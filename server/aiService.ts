import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import {
  comparisonOutputSchema,
  constraintsSchema,
  costBreakdownSchema,
  evaluationOutputSchema,
  planDraftSchema,
  travelOptionsSchema,
  tripInputSchema,
  tripPlanSchema,
  formatPreferences,
  type ComparisonOutput,
  type EvaluationOutput,
  type PlanDraft,
  type TripInput,
  type TripPlan,
} from './schemas'
import { planIssue, reconcileDailyCosts, verifyBudget } from './budgetValidator'
import {
  basicComparisonSystemPrompt,
  costPromptFor,
  costSystemPrompt,
  evaluationPromptFor,
  extractionPromptFor,
  extractionSystemPrompt,
  itineraryPromptFor,
  itinerarySystemPrompt,
  maxReplanAttempts,
  modelName,
  optionsPromptFor,
  optimizedComparisonSystemPrompt,
  replanPromptFor,
  replanSystemPrompt,
  travelOptionsSystemPrompt,
} from './prompts'

export class MissingGeminiKeyError extends Error {
  constructor() {
    super('AI API key is not configured. Add GEMINI_API_KEY to the server environment.')
    this.name = 'MissingGeminiKeyError'
  }
}

export class PlanRejectedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PlanRejectedError'
  }
}

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new MissingGeminiKeyError()
  return createGoogleGenerativeAI({ apiKey })(modelName)
}

async function structured<S extends z.ZodType>(schema: S, system: string, prompt: string): Promise<z.infer<S>> {
  const { output } = await generateText({
    model: getModel(),
    system,
    prompt,
    output: Output.object({ schema }),
    temperature: 0.35,
    maxRetries: 1,
  })
  if (!output) throw new Error('The AI returned an empty response.')
  return output as z.infer<S>
}

export async function extractConstraints(input: TripInput) {
  const extracted = await structured(constraintsSchema, extractionSystemPrompt, extractionPromptFor(input))
  const matches = extracted.origin.trim().toLowerCase() === input.origin.trim().toLowerCase()
    && extracted.destination.trim().toLowerCase() === input.destination.trim().toLowerCase()
    && extracted.travelers === input.travelers
    && extracted.days === input.days
    && extracted.budget === input.budget
    && extracted.currency === 'INR'
    && extracted.max_daily_travel_hours === input.maxDailyTravelHours
    && extracted.budget_strategy === input.budgetStrategy
    && JSON.stringify(extracted.preferences) === JSON.stringify(formatPreferences(input))
  if (!matches) throw new Error('The AI did not preserve the validated trip constraints.')
  return extracted
}

export async function generateTravelOptions(input: TripInput) {
  return structured(travelOptionsSchema, travelOptionsSystemPrompt, optionsPromptFor(input))
}

export async function generateItinerary(input: TripInput, selectedOptions: PlanDraft['selected_options']) {
  return structured(planDraftSchema.shape.itinerary, itinerarySystemPrompt, itineraryPromptFor(input, selectedOptions))
}

export async function estimateCosts(input: TripInput, selectedOptions: PlanDraft['selected_options'], itinerary: PlanDraft['itinerary']) {
  return structured(costBreakdownSchema, costSystemPrompt, costPromptFor(input, selectedOptions, itinerary))
}

async function generateInitialDraft(input: TripInput): Promise<PlanDraft> {
  const options = await generateTravelOptions(input)
  const leastCostly = <T extends { estimated_cost: number; name: string; description: string }>(items: T[]) => {
    const selected = [...items].sort((a, b) => a.estimated_cost - b.estimated_cost)[0]
    return { name: selected.name, description: selected.description, cost: selected.estimated_cost }
  }
  const selectedOptions: PlanDraft['selected_options'] = {
    transportation: leastCostly(options.transportation),
    accommodation: leastCostly(options.accommodation),
    food: leastCostly(options.food),
    activities: options.activities.slice(0, Math.min(options.activities.length, input.days * 2)).map(({ name, description, estimated_cost }) => ({ name, description, cost: estimated_cost })),
  }
  const itinerary = await generateItinerary(input, selectedOptions)
  const costBreakdown = await estimateCosts(input, selectedOptions, itinerary)
  return planDraftSchema.parse({
    selected_options: selectedOptions,
    itinerary,
    cost_breakdown: costBreakdown,
    reasoning_summary: `Selected ${selectedOptions.transportation.name}, ${selectedOptions.accommodation.name}, and local experiences to reflect your ${input.budgetStrategy.replace('-', ' ')} strategy. All prices are estimates, not live quotes.`,
  })
}

export async function replanTrip(input: TripInput, currentCost: number, issue: string, previousDraft: PlanDraft) {
  return structured(planDraftSchema, replanSystemPrompt, replanPromptFor(input, currentCost, issue, previousDraft))
}

export async function planTrip(input: TripInput): Promise<TripPlan> {
  let draft = await generateInitialDraft(input)
  let verification = verifyBudget(draft.cost_breakdown, input.budget)
  draft = { ...draft, itinerary: reconcileDailyCosts(draft.itinerary, verification.totalCost) }
  let issue = planIssue(input, draft, verification)
  let attempts = 0

  while (issue && attempts < maxReplanAttempts) {
    attempts += 1
    draft = await replanTrip(input, verification.totalCost, issue, draft)
    verification = verifyBudget(draft.cost_breakdown, input.budget)
    draft = { ...draft, itinerary: reconcileDailyCosts(draft.itinerary, verification.totalCost) }
    issue = planIssue(input, draft, verification)
  }
  if (issue) throw new PlanRejectedError('We could not generate a valid plan within the specified constraints. Try increasing the budget or relaxing your travel preferences.')

  return tripPlanSchema.parse({
    trip: { origin: input.origin, destination: input.destination, travelers: input.travelers, days: input.days, budget: input.budget, currency: 'INR' },
    ...draft,
    verification,
    process: {
      constraintsValidated: true,
      travelOptionsGenerated: true,
      itineraryGenerated: true,
      costEstimated: true,
      budgetVerified: true,
      replanningRequired: attempts > 0,
      replanningAttempts: attempts,
    },
  })
}

export async function runEvaluationCase(input: TripInput) {
  try {
    const output = await structured(evaluationOutputSchema, optimizedComparisonSystemPrompt, evaluationPromptFor(input))
    const verification = verifyBudget(output.cost_breakdown, input.budget)
    const constraintSatisfied = output.itinerary.length === input.days
      && output.itinerary.every((day, index) => day.day === index + 1 && day.travel_time_hours <= input.maxDailyTravelHours)
    return { output, jsonValid: true, constraintSatisfied, budgetCompliant: verification.status === 'PASS', replanTriggered: verification.status === 'FAIL' }
  } catch (error) {
    return { output: null, jsonValid: false, constraintSatisfied: false, budgetCompliant: false, replanTriggered: false, error: error instanceof Error ? error.message : 'AI request failed' }
  }
}

export async function runPromptComparison(input: TripInput) {
  const call = (system: string) => structured(comparisonOutputSchema, system, evaluationPromptFor(input))
  const [a, b] = await Promise.allSettled([call(basicComparisonSystemPrompt), call(optimizedComparisonSystemPrompt)])
  const versionA = a.status === 'fulfilled' ? a.value : null
  const versionB = b.status === 'fulfilled' ? b.value : null
  if (!versionA && !versionB) throw new Error('Neither prompt version returned a valid structured plan.')
  const measured = versionB ?? versionA
  const notAvailable = { constraintSatisfaction: null, jsonValidity: null, budgetCompliance: null, completeness: null }
  if (!measured) return { versionA, versionB, checks: notAvailable }
  const verification = verifyBudget(measured.cost_breakdown, input.budget)
  return {
    versionA,
    versionB,
    checks: {
      constraintSatisfaction: measured.itinerary.length === input.days && measured.itinerary.every((day, index) => day.day === index + 1 && day.travel_time_hours <= input.maxDailyTravelHours),
      jsonValidity: Boolean(versionA && versionB),
      budgetCompliance: verification.status === 'PASS',
      completeness: Boolean(measured.selected_options.transportation.name && measured.selected_options.accommodation.name && measured.selected_options.food.name && measured.selected_options.activities.length && measured.itinerary.length),
    },
  }
}

export const validateInput = (input: unknown) => tripInputSchema.safeParse(input)
export const isMissingKey = (error: unknown) => error instanceof MissingGeminiKeyError
export const isPlanRejected = (error: unknown) => error instanceof PlanRejectedError
export const safeErrorCode = (error: unknown) => isMissingKey(error) ? 'missing_api_key' : isPlanRejected(error) ? 'plan_unavailable' : 'ai_error'
export const serviceSchemas = { plan: tripPlanSchema, comparison: comparisonOutputSchema, evaluation: evaluationOutputSchema }
export type { TripInput, TripPlan, PlanDraft, ComparisonOutput, EvaluationOutput }

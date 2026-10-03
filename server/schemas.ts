import { z } from 'zod'

export const preferenceTags = [
  'Sightseeing',
  'Food',
  'Adventure',
  'Nature',
  'History',
  'Culture',
  'Shopping',
  'Photography',
  'Relaxation',
  'Nightlife',
  'Family-friendly',
  'Luxury',
  'Budget-friendly',
] as const

export const budgetStrategies = ['save-money', 'balanced', 'use-full-budget'] as const

export const tripInputSchema = z.object({
  origin: z.string().trim().min(1, 'Please enter your starting location.').max(120),
  destination: z.string().trim().min(1, 'Please enter a destination.').max(120),
  travelers: z.number().int().min(1).max(20),
  days: z.number().int().min(1).max(7),
  budget: z.number().positive().max(5_000_000),
  maxDailyTravelHours: z.number().positive().max(24),
  budgetStrategy: z.enum(budgetStrategies),
  preferences: z.array(z.enum(preferenceTags)).max(preferenceTags.length),
  customPreferences: z.string().trim().max(500),
})

export type TripInput = z.infer<typeof tripInputSchema>

export const constraintsSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  travelers: z.number().int().positive(),
  days: z.number().int().min(1).max(7),
  budget: z.number().positive(),
  currency: z.literal('INR'),
  max_daily_travel_hours: z.number().positive(),
  budget_strategy: z.enum(budgetStrategies),
  preferences: z.array(z.string()),
})

const optionSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  estimated_cost: z.number().int().nonnegative(),
  reason: z.string().min(1),
  category: z.string().min(1),
})

export const travelOptionsSchema = z.object({
  transportation: z.array(optionSchema).min(1).max(4),
  accommodation: z.array(optionSchema).min(1).max(4),
  food: z.array(optionSchema).min(1).max(4),
  activities: z.array(optionSchema).min(1).max(6),
})

export const selectedOptionsSchema = z.object({
  transportation: z.object({ name: z.string(), description: z.string(), cost: z.number().int().nonnegative() }),
  accommodation: z.object({ name: z.string(), description: z.string(), cost: z.number().int().nonnegative() }),
  food: z.object({ name: z.string(), description: z.string(), cost: z.number().int().nonnegative() }),
  activities: z.array(z.object({ name: z.string(), description: z.string(), cost: z.number().int().nonnegative() })),
})

export const itinerarySchema = z.object({
  days: z.array(z.object({
    day: z.number().int().positive(),
    date_label: z.string(),
    morning: z.string(),
    afternoon: z.string(),
    evening: z.string(),
    travel_time_hours: z.number().nonnegative(),
    activities: z.array(z.string()),
    estimated_daily_cost: z.number().int().nonnegative(),
  })).min(1).max(7),
})

export const costBreakdownSchema = z.object({
  transport: z.number().int().nonnegative(),
  accommodation: z.number().int().nonnegative(),
  food: z.number().int().nonnegative(),
  activities: z.number().int().nonnegative(),
  miscellaneous: z.number().int().nonnegative(),
})

export const planDraftSchema = z.object({
  selected_options: selectedOptionsSchema,
  itinerary: itinerarySchema.shape.days,
  cost_breakdown: costBreakdownSchema,
  reasoning_summary: z.string().min(1).max(600),
})

export const tripPlanSchema = z.object({
  trip: z.object({
    origin: z.string(),
    destination: z.string(),
    travelers: z.number().int().positive(),
    days: z.number().int().positive(),
    budget: z.number().positive(),
    currency: z.literal('INR'),
  }),
  selected_options: selectedOptionsSchema,
  itinerary: itinerarySchema.shape.days,
  cost_breakdown: costBreakdownSchema,
  reasoning_summary: z.string(),
  verification: z.object({
    status: z.enum(['PASS', 'FAIL']),
    totalCost: z.number(),
    budget: z.number(),
    remainingBudget: z.number(),
    budgetUtilization: z.number(),
  }),
  process: z.object({
    constraintsValidated: z.boolean(),
    travelOptionsGenerated: z.boolean(),
    itineraryGenerated: z.boolean(),
    costEstimated: z.boolean(),
    budgetVerified: z.boolean(),
    replanningRequired: z.boolean(),
    replanningAttempts: z.number().int().min(0).max(3),
  }),
})

export type TravelOptions = z.infer<typeof travelOptionsSchema>
export type PlanDraft = z.infer<typeof planDraftSchema>
export type TripPlan = z.infer<typeof tripPlanSchema>
export type CostBreakdown = z.infer<typeof costBreakdownSchema>

export const evaluationOutputSchema = z.object({
  selected_options: selectedOptionsSchema,
  itinerary: itinerarySchema.shape.days,
  cost_breakdown: costBreakdownSchema,
  reasoning_summary: z.string(),
})

export const comparisonOutputSchema = z.object({
  selected_options: selectedOptionsSchema,
  itinerary: itinerarySchema.shape.days,
  cost_breakdown: costBreakdownSchema,
  reasoning_summary: z.string(),
})

export type EvaluationOutput = z.infer<typeof evaluationOutputSchema>
export type ComparisonOutput = z.infer<typeof comparisonOutputSchema>

export const suspiciousInputPattern = /(?:ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions?|system\s+prompt|developer\s+message|reveal\s+(?:your\s+)?(?:instructions|prompt)|jailbreak|write\s+(?:me\s+)?(?:python|javascript|code)|hack\s+(?:a|the|this)\s+website|political\s+advice|tell\s+me\s+a\s+joke|act\s+as\s+(?:a\s+)?(?:hacker|politician)|\b(?:malware|phishing|exploit)\b)/i

export function validatePlanningIntent(input: TripInput) {
  const userText = [input.origin, input.destination, input.customPreferences].join(' ')
  if (suspiciousInputPattern.test(userText)) {
    return { ok: false as const, status: 'rejected' as const, reason: 'This application only supports budget travel planning.' }
  }
  return { ok: true as const }
}

export function validateOutputConstraints(input: TripInput, output: EvaluationOutput | PlanDraft) {
  const days = output.itinerary
  const dayCountOk = days.length === input.days && days.every((day, index) => day.day === index + 1)
  const travelTimeOk = days.every((day) => day.travel_time_hours <= input.maxDailyTravelHours)
  const tripFieldsOk = output.selected_options.transportation.name.length > 0 && output.selected_options.accommodation.name.length > 0
  return dayCountOk && travelTimeOk && tripFieldsOk
}

export function toUserFacingError(error: unknown) {
  const message = error instanceof Error ? error.message : ''
  if (/429|rate.?limit|quota/i.test(message)) return 'Google AI has reached its current request limit. The planner tried its backup model too; check Google AI Studio usage and quota for this API key, or try again after the limit resets.'
  if (/api.?key|unauthorized|403|401/i.test(message)) return 'The AI service could not authenticate. Check the server environment configuration.'
  if (/timeout|network|fetch failed/i.test(message)) return 'The AI service is temporarily unavailable. Please try again.'
  return 'We could not complete the trip plan. Please adjust your trip details and try again.'
}

export function getUserFacingErrorCode(error: unknown) {
  const message = error instanceof Error ? error.message : ''
  if (/429|rate.?limit|quota/i.test(message)) return 'rate_limit'
  if (/timeout|network|fetch failed/i.test(message)) return 'network'
  return 'ai_error'
}

export function isTripInput(value: unknown): value is TripInput {
  return tripInputSchema.safeParse(value).success
}

export function toTripInput(value: TripInput): TripInput {
  return tripInputSchema.parse(value)
}

export function formatPreferences(input: TripInput) {
  return [...input.preferences, ...(input.customPreferences ? [input.customPreferences] : [])]
}

export function toConstraintInput(input: TripInput) {
  return {
    origin: input.origin,
    destination: input.destination,
    travelers: input.travelers,
    days: input.days,
    budget: input.budget,
    currency: 'INR' as const,
    max_daily_travel_hours: input.maxDailyTravelHours,
    budget_strategy: input.budgetStrategy,
    preferences: formatPreferences(input),
  }
}

export function normalizeConstraints(input: TripInput) {
  return constraintsSchema.parse(toConstraintInput(input))
}

export function validateModelConstraints(input: TripInput, extracted: z.infer<typeof constraintsSchema>) {
  return extracted.origin.trim().toLowerCase() === input.origin.trim().toLowerCase()
    && extracted.destination.trim().toLowerCase() === input.destination.trim().toLowerCase()
    && extracted.travelers === input.travelers
    && extracted.days === input.days
    && extracted.budget === input.budget
    && extracted.currency === 'INR'
    && extracted.max_daily_travel_hours === input.maxDailyTravelHours
}

export function getStrategyTarget(strategy: TripInput['budgetStrategy']) {
  switch (strategy) {
    case 'save-money': return 'Aim to preserve roughly 15–25% of the budget when realistic.'
    case 'balanced': return 'Aim to use around 85–95% when appropriate, while retaining a reasonable buffer.'
    case 'use-full-budget': return 'Use a comfortable share of the budget but always keep a safety buffer; never spend the full budget.'
  }
}

export function createTripSummary(input: TripInput) {
  return `${input.days} days, ${input.travelers} traveler${input.travelers === 1 ? '' : 's'} from ${input.origin} to ${input.destination}; INR ${input.budget}; max ${input.maxDailyTravelHours} travel hours per day; strategy ${input.budgetStrategy}; preferences ${formatPreferences(input).join(', ') || 'none specified'}.`
}

export function formatReplanFeedback(input: TripInput, totalCost: number) {
  const excess = Math.max(0, totalCost - input.budget)
  return `Original budget: ₹${input.budget}. Current independently calculated cost: ₹${totalCost}. Amount over budget: ₹${excess}. Keep the same destination, origin, traveler count, duration, and important preferences. Reduce costs through appropriate alternatives such as cheaper transport and accommodation, local food, free attractions, and optimized routes. Do not reduce duration or exceed the max daily travel time. Never spend the entire budget; preserve a reasonable safety buffer. Return only the exact structured plan schema.`
}

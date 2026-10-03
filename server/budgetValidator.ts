import type { CostBreakdown, TripInput } from './schemas'

export type BudgetVerification = {
  status: 'PASS' | 'FAIL'
  totalCost: number
  budget: number
  remainingBudget: number
  budgetUtilization: number
}

export function verifyBudget(costs: CostBreakdown, budget: number): BudgetVerification {
  const values = [costs.transport, costs.accommodation, costs.food, costs.activities, costs.miscellaneous]
  if (!values.every((value) => Number.isSafeInteger(value) && value >= 0) || !Number.isFinite(budget) || budget <= 0) {
    throw new Error('Budget calculation received invalid category values.')
  }
  const totalCost = values.reduce((sum, value) => sum + value, 0)
  const remainingBudget = budget - totalCost
  return {
    status: totalCost <= budget ? 'PASS' : 'FAIL',
    totalCost,
    budget,
    remainingBudget,
    budgetUtilization: Number(((totalCost / budget) * 100).toFixed(1)),
  }
}

export function validatePlanConstraints(input: TripInput, itinerary: Array<{ day: number; travel_time_hours: number }>) {
  return itinerary.length === input.days
    && itinerary.every((item, index) => item.day === index + 1 && item.travel_time_hours <= input.maxDailyTravelHours)
}

export function isWithinStrategyBuffer(input: TripInput, verification: BudgetVerification) {
  const utilization = verification.budgetUtilization
  if (input.budgetStrategy === 'save-money') return utilization <= 85
  return utilization <= 97
}

export function costChartRows(costs: CostBreakdown, remainingBudget: number) {
  return [
    { category: 'Transportation', amount: costs.transport, fill: 'var(--chart-1)' },
    { category: 'Accommodation', amount: costs.accommodation, fill: 'var(--chart-2)' },
    { category: 'Food', amount: costs.food, fill: 'var(--chart-3)' },
    { category: 'Activities', amount: costs.activities, fill: 'var(--chart-4)' },
    { category: 'Miscellaneous', amount: costs.miscellaneous, fill: 'var(--chart-5)' },
    { category: 'Remaining budget', amount: Math.max(0, remainingBudget), fill: 'var(--chart-6)' },
  ]
}

export function planIssue(input: TripInput, draft: { itinerary: Array<{ day: number; travel_time_hours: number }> }, verification: BudgetVerification) {
  const problems: string[] = []
  if (draft.itinerary.length !== input.days) problems.push(`Expected ${input.days} days, received ${draft.itinerary.length}.`)
  if (draft.itinerary.some((item, index) => item.day !== index + 1)) problems.push('Day numbers must be consecutive and start at 1.')
  if (draft.itinerary.some((item) => item.travel_time_hours > input.maxDailyTravelHours)) problems.push(`At least one day exceeds ${input.maxDailyTravelHours} travel hours.`)
  if (verification.status === 'FAIL') problems.push(`Calculated total ₹${verification.totalCost} exceeds the budget ₹${input.budget}.`)
  if (isWithinStrategyBuffer(input, verification) === false && verification.status === 'PASS') problems.push('The plan did not preserve the requested budget safety buffer.')
  return problems.join(' ')
}

export function evaluationConstraintSatisfied(input: TripInput, draft: { itinerary: Array<{ day: number; travel_time_hours: number }> }, verification: BudgetVerification) {
  return validatePlanConstraints(input, draft.itinerary) && verification.status === 'PASS'
}

export function compareCompleteness(draft: { selected_options: { transportation: unknown; accommodation: unknown; food: unknown; activities: unknown[] }; itinerary: unknown[] }) {
  return Boolean(draft.selected_options.transportation && draft.selected_options.accommodation && draft.selected_options.food && draft.selected_options.activities.length > 0 && draft.itinerary.length > 0)
}

export function costPercent(cost: number, budget: number) {
  return budget > 0 ? Math.round((cost / budget) * 1000) / 10 : 0
}

export function describeBudget(verification: BudgetVerification) {
  return verification.remainingBudget >= 0
    ? `₹${verification.remainingBudget.toLocaleString('en-IN')} remains in the trip budget.`
    : `The estimate is ₹${Math.abs(verification.remainingBudget).toLocaleString('en-IN')} over budget.`
}

export function assertSafeTotals(costs: CostBreakdown) {
  const total = costs.transport + costs.accommodation + costs.food + costs.activities + costs.miscellaneous
  if (!Number.isSafeInteger(total)) throw new Error('Budget total exceeds the safe integer range.')
  return total
}

export const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
export const formatINR = (amount: number) => currencyFormatter.format(amount)
export const categoryRows = (costs: CostBreakdown) => [
  { category: 'Transportation', cost: costs.transport },
  { category: 'Accommodation', cost: costs.accommodation },
  { category: 'Food', cost: costs.food },
  { category: 'Activities', cost: costs.activities },
  { category: 'Miscellaneous', cost: costs.miscellaneous },
]
export const formatUtilization = (percent: number) => `${percent.toFixed(1)}%`
export const planBudgetIsValid = (result: BudgetVerification) => result.status === 'PASS'
export const budgetSafetyMargin = (result: BudgetVerification) => result.budget > 0 ? result.remainingBudget / result.budget : 0
export const budgetSummary = (result: BudgetVerification) => ({ ...result, label: result.status === 'PASS' ? 'Budget Verified' : 'Over budget' })
export const getCostTotal = (costs: CostBreakdown) => costs.transport + costs.accommodation + costs.food + costs.activities + costs.miscellaneous
export const withinBudget = (costs: CostBreakdown, budget: number) => getCostTotal(costs) <= budget

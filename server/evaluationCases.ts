import { tripInputSchema, type TripInput } from './schemas'

const base = { origin: 'Rajkot, Gujarat', destination: 'Udaipur, Rajasthan', travelers: 2, days: 3, budget: 12000, maxDailyTravelHours: 5, budgetStrategy: 'balanced' as const, preferences: ['Sightseeing', 'Food'] as TripInput['preferences'], customPreferences: '' }

export const evaluationCases: Array<{ id: number; name: string; description: string; input: TripInput }> = [
  { id: 1, name: 'Low budget', description: 'Tests a tight INR budget.', input: tripInputSchema.parse({ ...base, budget: 4000, budgetStrategy: 'save-money' }) },
  { id: 2, name: 'High budget', description: 'Allows more comfort choices.', input: tripInputSchema.parse({ ...base, budget: 65000, budgetStrategy: 'use-full-budget' }) },
  { id: 3, name: 'Solo traveler', description: 'One traveler, short stay.', input: tripInputSchema.parse({ ...base, travelers: 1, days: 2, budget: 9000 }) },
  { id: 4, name: 'Group travel', description: 'Four travelers sharing transport and lodging.', input: tripInputSchema.parse({ ...base, travelers: 4, budget: 32000 }) },
  { id: 5, name: 'Short trip', description: 'Single-day itinerary.', input: tripInputSchema.parse({ ...base, days: 1, budget: 7000 }) },
  { id: 6, name: 'Different destination', description: 'A different origin and destination.', input: tripInputSchema.parse({ ...base, origin: 'Jaipur, Rajasthan', destination: 'Jodhpur, Rajasthan', budget: 14000 }) },
  { id: 7, name: 'Food focused', description: 'Prioritizes local food experiences.', input: tripInputSchema.parse({ ...base, preferences: ['Food', 'Culture'], customPreferences: 'Prefer local vegetarian food.' }) },
  { id: 8, name: 'Adventure preference', description: 'Prioritizes outdoor adventure.', input: tripInputSchema.parse({ ...base, preferences: ['Adventure', 'Nature'], customPreferences: 'Choose beginner-friendly outdoor activities.' }) },
  { id: 9, name: 'Restrictive travel time', description: 'Very limited daily travel time.', input: tripInputSchema.parse({ ...base, maxDailyTravelHours: 1, days: 2, budget: 15000 }) },
  { id: 10, name: 'Re-plan pressure', description: 'Minimal budget designed to test a first-pass overspend.', input: tripInputSchema.parse({ ...base, budget: 2500, maxDailyTravelHours: 3, budgetStrategy: 'save-money' }) },
]

export function getEvaluationCases() { return evaluationCases }

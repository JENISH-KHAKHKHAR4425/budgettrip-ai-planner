import { NextResponse } from 'next/server'
import { planTrip, isMissingKey, isPlanRejected } from '@/server/aiService'
import { toUserFacingError, getUserFacingErrorCode, validatePlanningIntent, tripInputSchema } from '@/server/schemas'

export const maxDuration = 300

export async function POST(request: Request) {
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Please submit a valid trip request.' }, { status: 400 }) }
  const parsed = tripInputSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return NextResponse.json({ error: first?.message ?? 'Please check your trip details.' }, { status: 400 })
  }
  const intent = validatePlanningIntent(parsed.data)
  if (!intent.ok) return NextResponse.json({ ...intent, message: 'Please enter a travel-planning request.' }, { status: 422 })
  try {
    const plan = await planTrip(parsed.data)
    return NextResponse.json({ plan })
  } catch (error) {
    const status = isMissingKey(error) ? 503 : isPlanRejected(error) ? 422 : 502
    const message = isMissingKey(error) ? 'AI API key is not configured. Add GEMINI_API_KEY to the server environment.' : isPlanRejected(error) && error instanceof Error ? error.message : toUserFacingError(error)
    return NextResponse.json({ error: message, code: getUserFacingErrorCode(error) }, { status })
  }
}

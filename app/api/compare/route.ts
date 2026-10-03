import { NextResponse } from 'next/server'
import { runPromptComparison, isMissingKey } from '@/server/aiService'
import { tripInputSchema, validatePlanningIntent } from '@/server/schemas'

export const maxDuration = 120

export async function POST(request: Request) {
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }
  const parsed = tripInputSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid trip details.' }, { status: 400 })
  if (!validatePlanningIntent(parsed.data).ok) return NextResponse.json({ error: 'Please enter a travel-planning request.' }, { status: 422 })
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: 'AI API key is not configured. Add GEMINI_API_KEY to the server environment.' }, { status: 503 })
  try { return NextResponse.json(await runPromptComparison(parsed.data)) }
  catch (error) {
    const message = isMissingKey(error) ? 'AI API key is not configured. Add GEMINI_API_KEY to the server environment.' : 'Prompt comparison is temporarily unavailable. Please try again.'
    return NextResponse.json({ error: message }, { status: isMissingKey(error) ? 503 : 502 })
  }
}

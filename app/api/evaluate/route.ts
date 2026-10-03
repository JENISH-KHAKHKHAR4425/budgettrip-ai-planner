import { NextResponse } from 'next/server'
import { isMissingKey, runEvaluationCase } from '@/server/aiService'
import { getEvaluationCases } from '@/server/evaluationCases'

export const maxDuration = 300

export async function POST() {
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: 'AI API key is not configured. Add GEMINI_API_KEY to the server environment.' }, { status: 503 })
  const results = []
  for (const testCase of getEvaluationCases()) {
    const result = await runEvaluationCase(testCase.input)
    results.push({ ...testCase, ...result })
  }
  const total = results.length
  const validCount = results.filter((result) => result.jsonValid).length
  const satisfiedCount = results.filter((result) => result.constraintSatisfied && result.budgetCompliant).length
  return NextResponse.json({ results, metrics: { total, jsonValidityRate: total ? Math.round(validCount / total * 1000) / 10 : 0, constraintSatisfactionRate: total ? Math.round(satisfiedCount / total * 1000) / 10 : 0, validCount, satisfiedCount } })
}

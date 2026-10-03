'use client'

import { useState } from 'react'
import { ArrowRight, Check, CircleAlert, LoaderCircle, Play, Sparkles } from 'lucide-react'

interface EvaluationResult { id: number; name: string; description: string; jsonValid: boolean; constraintSatisfied: boolean; budgetCompliant: boolean; replanTriggered: boolean; error?: string; output: null | { reasoning_summary: string; itinerary: Array<{ day: number }>; cost_breakdown: Record<string, number> } }
interface EvaluationPayload { results: EvaluationResult[]; metrics: { total: number; jsonValidityRate: number; constraintSatisfactionRate: number; validCount: number; satisfiedCount: number } }

export function EvaluationDashboard() {
  const [data, setData] = useState<EvaluationPayload | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function run() {
    setLoading(true); setError(''); setData(null)
    try {
      const response = await fetch('/api/evaluate', { method: 'POST' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'The evaluation could not run.')
      setData(result)
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'The evaluation could not run.') }
    finally { setLoading(false) }
  }
  return <main className="wrap interior-page"><div className="eyebrow">PROMPT ENGINEERING LAB · 01</div><div className="interior-heading"><div><h1>Evaluation</h1><p>Run the real Gemini planner against ten consistent travel scenarios. Results are calculated from each response — nothing is pre-filled.</p></div><button className="submit-button eval-run" onClick={run} disabled={loading}>{loading ? <><LoaderCircle className="spin" size={17} /> RUNNING SCENARIOS…</> : <><Play size={16} /> RUN EVALUATION <ArrowRight size={16} /></>}</button></div>
    <div className="evaluation-method"><Sparkles size={17} /><p><b>What we measure</b><br />JSON validity means a response passed its Zod schema. Constraint satisfaction means exact day count, daily travel-time limits and budget compliance all pass independent checks.</p></div>
    {loading && <div className="evaluation-loading" role="status"><LoaderCircle className="spin" size={20} /><div><b>Working through ten travel scenarios</b><small>Each test calls Gemini and validates its response. This may take a few minutes.</small></div></div>}
    {error && <div className="form-error eval-error" role="alert"><CircleAlert size={18} />{error}</div>}
    {data && <><div className="metric-grid"><Metric label="Constraint satisfaction" value={`${data.metrics.constraintSatisfactionRate}%`} detail={`${data.metrics.satisfiedCount} of ${data.metrics.total} scenarios`} /><Metric label="JSON validity" value={`${data.metrics.jsonValidityRate}%`} detail={`${data.metrics.validCount} schema-valid outputs`} /><Metric label="Scenarios run" value={`${data.metrics.total}`} detail="Real Gemini calls" /></div><div className="evaluation-table-wrap"><table className="evaluation-table"><thead><tr><th>Scenario</th><th>Valid JSON</th><th>Constraints</th><th>Budget</th><th>Re-plan</th></tr></thead><tbody>{data.results.map((item) => <tr key={item.id}><td><b>{String(item.id).padStart(2, '0')} · {item.name}</b><small>{item.description}</small>{item.error && <small className="scenario-error">{item.error}</small>}{item.output && <details className="scenario-output"><summary>View result</summary><p>{item.output.reasoning_summary}</p><small>{item.output.itinerary.length} days · {Object.values(item.output.cost_breakdown).reduce((sum, value) => sum + value, 0).toLocaleString('en-IN')} INR estimated</small></details>}</td><td><Status value={item.jsonValid} /></td><td><Status value={item.constraintSatisfied} /></td><td><Status value={item.budgetCompliant} /></td><td>{item.replanTriggered ? 'Triggered' : '—'}</td></tr>)}</tbody></table></div><p className="evaluation-footnote">Constraint satisfaction is the share that meets itinerary constraints and the independent budget check. Failure cases are retained in the results.</p></>}
    {!data && !loading && !error && <div className="empty-state"><span className="empty-icon"><Play size={21} /></span><h2>Measure what the model actually returns.</h2><p>Start the evaluation to run ten live model calls and calculate the metrics.</p></div>}
  </main>
}
function Metric({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className="metric-card"><span>{label}</span><b>{value}</b><small>{detail}</small></div> }
function Status({ value }: { value: boolean }) { return <span className={value ? 'status-pass' : 'status-fail'}>{value ? <><Check size={13} /> Pass</> : 'Fail'}</span> }

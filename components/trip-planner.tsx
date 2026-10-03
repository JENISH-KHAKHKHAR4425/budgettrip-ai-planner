'use client'

import { useMemo, useState } from 'react'
import { AlertCircle, ArrowDown, ArrowRight, Camera, CalendarDays, Check, Clock3, Compass, Gem, Heart, Landmark, Leaf, LoaderCircle, MapPin, Mountain, Moon, ShoppingBag, Sparkles, Trees, Utensils, Users, Wallet } from 'lucide-react'
import { preferenceTags, tripInputSchema, type TripInput, type TripPlan } from '@/server/schemas'
import { TripResults } from './trip-results'

const initial: TripInput = { origin: '', destination: '', travelers: 2, days: 3, budget: 12000, maxDailyTravelHours: 5, budgetStrategy: 'balanced', preferences: [], customPreferences: '' }
const icons: Record<string, typeof Compass> = { Sightseeing: Camera, Food: Utensils, Adventure: Mountain, Nature: Trees, History: Landmark, Culture: Landmark, Shopping: ShoppingBag, Photography: Camera, Relaxation: Heart, Nightlife: Moon, 'Family-friendly': Users, Luxury: Gem, 'Budget-friendly': Leaf }
const strategies = [
  { value: 'save-money', title: 'Save money', copy: 'Aim to leave more unspent.' },
  { value: 'balanced', title: 'Balanced', copy: 'Mix comfort and experiences.' },
  { value: 'use-full-budget', title: 'More comfort', copy: 'Use more, keep a buffer.' },
] as const

export function BudgetStrategyName({ strategy }: { strategy: TripInput['budgetStrategy'] }) {
  return strategy === 'save-money' ? 'Save Money' : strategy === 'balanced' ? 'Balanced' : 'More Comfort'
}

export function TripPlanner() {
  const [form, setForm] = useState<TripInput>(initial)
  const [plan, setPlan] = useState<TripPlan | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const selected = useMemo(() => new Set(form.preferences), [form.preferences])
  const patch = <K extends keyof TripInput>(key: K, value: TripInput[K]) => setForm((current) => ({ ...current, [key]: value }))

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const parsed = tripInputSchema.safeParse(form)
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Please check your trip details.'); return }
    setLoading(true)
    setPlan(null)
    try {
      const response = await fetch('/api/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed.data) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'AI service is temporarily unavailable. Please try again.')
      setPlan(data.plan as TripPlan)
      window.setTimeout(() => document.querySelector('#trip-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'AI service is temporarily unavailable. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function loadDemo() {
    setForm({ ...initial, origin: 'Rajkot, Gujarat', destination: 'Udaipur, Rajasthan', preferences: ['Food', 'Sightseeing', 'History'], customPreferences: 'Prefer local food, historical places and photography.' })
    setError('')
    document.querySelector('#planner')?.scrollIntoView({ behavior: 'smooth' })
  }

  return <>
    <section className="hero-section">
      <div className="hero-photo" aria-hidden="true" /><div className="hero-overlay" />
      <div className="hero-content wrap"><div className="hero-copy"><div className="eyebrow eyebrow-light"><span className="eyebrow-dot" /> AI-POWERED BUDGET PLANNING</div><h1>Go further.<br /><em>Spend thoughtfully.</em></h1><p>Good trips aren&apos;t about spending more. They&apos;re about knowing what matters to you.</p><a className="hero-link" href="#planner">Build your trip <ArrowDown size={15} /></a></div><div className="hero-note"><MapPin size={16} /><span>Lake Pichola<br /><b>Udaipur, Rajasthan</b></span></div></div>
      <div className="hero-bottom"><span>01 / PLAN WITH PURPOSE</span><span>Curated around your budget and the way you travel</span></div>
    </section>
    <main className="wrap page-content">
      <section className="intro-row"><div><div className="eyebrow">THE TRIP BUILDER</div><h2>Build a trip that fits you.</h2><p>Tell us what matters. We&apos;ll handle the thoughtful planning.</p></div><button className="demo-button" type="button" onClick={loadDemo}><Sparkles size={15} /> Load demo trip</button></section>
      <div className="planner-layout" id="planner">
        <form className="planner-card" onSubmit={submit} noValidate>
          <div className="form-heading"><div className="form-step">01</div><div><h3>Your trip, your way</h3><p>Start with the essentials. Fine-tune the details as you go.</p></div></div>
          <FormSection title="THE ROUTE" />
          <div className="form-grid route-grid">
            <Field label="Starting from" icon={<MapPin size={16} />}><input required value={form.origin} onChange={(event) => patch('origin', event.target.value)} placeholder="e.g. Rajkot, Gujarat" maxLength={120} /></Field>
            <Field label="Heading to" icon={<MapPin size={16} />}><input required value={form.destination} onChange={(event) => patch('destination', event.target.value)} placeholder="e.g. Udaipur, Rajasthan" maxLength={120} /></Field>
          </div>
          <FormSection title="THE DETAILS" />
          <div className="form-grid detail-grid">
            <Field label="Travelers" icon={<Users size={16} />}><input type="number" min={1} max={20} step={1} value={form.travelers} onChange={(event) => patch('travelers', Number(event.target.value))} /></Field>
            <Field label="Days" icon={<CalendarDays size={16} />}><input type="number" min={1} max={7} step={1} value={form.days} onChange={(event) => patch('days', Number(event.target.value))} /></Field>
            <Field label="Total budget · INR" icon={<Wallet size={16} />}><span className="currency-symbol">₹</span><input type="number" min={1} max={5000000} step={500} value={form.budget} onChange={(event) => patch('budget', Number(event.target.value))} /></Field>
            <Field label="Daily travel limit" icon={<Clock3 size={16} />}><input type="number" min={0.5} max={24} step={0.5} value={form.maxDailyTravelHours} onChange={(event) => patch('maxDailyTravelHours', Number(event.target.value))} /><span className="input-suffix">hours</span></Field>
          </div>
          <FormSection title="YOUR BUDGET STYLE" />
          <div className="strategy-grid" role="radiogroup" aria-label="Budget strategy">{strategies.map((item) => <button key={item.value} type="button" role="radio" aria-checked={form.budgetStrategy === item.value} className={`strategy-option ${form.budgetStrategy === item.value ? 'strategy-active' : ''}`} onClick={() => patch('budgetStrategy', item.value)}><span className="strategy-radio">{form.budgetStrategy === item.value && <span />}</span><b>{item.title}</b><small>{item.copy}</small></button>)}</div>
          <FormSection title="WHAT DO YOU LOVE?" />
          <div className="preference-list">{preferenceTags.map((tag) => { const Icon = icons[tag] ?? Compass; const active = selected.has(tag); return <button type="button" key={tag} className={`preference-chip ${active ? 'preference-active' : ''}`} aria-pressed={active} onClick={() => patch('preferences', active ? form.preferences.filter((item) => item !== tag) : [...form.preferences, tag])}><Icon size={14} />{tag}{active && <Check size={12} />}</button> })}</div>
          <label className="field custom-field"><span>Anything else we should know? <small>optional</small></span><textarea value={form.customPreferences} onChange={(event) => patch('customPreferences', event.target.value)} placeholder="Prefer local food, historical places and photography…" rows={3} maxLength={500} /></label>
          {error && <div className="form-error" role="alert"><AlertCircle size={17} />{error}</div>}
          {loading && <div className="planning-state" role="status"><LoaderCircle className="spin" size={17} /><span>Gemini is working through your trip details…</span><small>This can take a minute</small></div>}
          <button className="submit-button" type="submit" disabled={loading}>{loading ? <><LoaderCircle className="spin" size={17} /> AI IS PLANNING…</> : <>PLAN MY TRIP <ArrowRight size={17} /></>}</button>
          <p className="form-disclaimer">AI estimates aren&apos;t live prices or reservations. Your budget is checked independently.</p>
        </form>
        <aside className="planner-aside"><div className="aside-note"><div className="aside-icon"><Sparkles size={19} /></div><span className="eyebrow">A BETTER KIND OF PLANNING</span><h3>Less guesswork.<br /><em>More good days.</em></h3><p>We turn your budget, pace and interests into a practical itinerary — then check the numbers ourselves.</p></div><div className="aside-stat"><span>01</span><div><b>Made for your budget</b><small>Every category is checked before your plan is shown.</small></div></div><div className="aside-stat"><span>02</span><div><b>Built around your pace</b><small>Your daily travel-time limit stays in view.</small></div></div><div className="aside-stat"><span>03</span><div><b>Always an estimate</b><small>Pricing isn&apos;t live inventory or a booking promise.</small></div></div><div className="aside-corner">PLAN SMARTER · TRAVEL BETTER</div></aside>
      </div>
      {plan && <TripResults plan={plan} input={form} />}
    </main>
  </>
}

function FormSection({ title }: { title: string }) { return <div className="form-section-title"><span>{title}</span><i /></div> }
function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) { return <label className="field"><span>{label}</span><div className="input-wrap">{icon}{children}</div></label> }

export const plannerDescription = 'A server-backed trip planner that validates traveler inputs and independently checks the estimated trip budget.'
export const appName = 'BudgetTrip AI'

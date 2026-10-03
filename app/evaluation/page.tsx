import type { Metadata } from 'next'
import { SiteFrame } from '@/components/site-header'
import { EvaluationDashboard } from '@/components/evaluation-dashboard'

export const metadata: Metadata = { title: 'Evaluation | BudgetTrip AI', description: 'Run real AI trip planning evaluation scenarios and inspect actual validation results.' }

export default function EvaluationPage() { return <SiteFrame><EvaluationDashboard /></SiteFrame> }

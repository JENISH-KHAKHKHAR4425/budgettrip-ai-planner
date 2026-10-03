import type { Metadata } from 'next'
import { SiteFrame } from '@/components/site-header'
import { PromptHistoryPage } from '@/components/information-pages'

export const metadata: Metadata = { title: 'Prompt History | BudgetTrip AI', description: 'Explore the prompt techniques and guardrails used in BudgetTrip AI.' }

export default function HistoryPage() { return <SiteFrame><PromptHistoryPage /></SiteFrame> }

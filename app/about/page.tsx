import type { Metadata } from 'next'
import { SiteFrame } from '@/components/site-header'
import { AboutPage } from '@/components/information-pages'

export const metadata: Metadata = { title: 'About | BudgetTrip AI', description: 'How BudgetTrip AI uses structured prompts and application-side budget verification.' }

export default function About() { return <SiteFrame><AboutPage /></SiteFrame> }

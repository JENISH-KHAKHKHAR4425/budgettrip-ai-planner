import type { Metadata } from 'next'
import { SiteFrame } from '@/components/site-header'
import { TripPlanner } from '@/components/trip-planner'

export const metadata: Metadata = { title: 'BudgetTrip AI | Plan Smarter, Travel Better', description: 'Plan a thoughtful, budget-aware trip with AI-generated itineraries and independently verified cost estimates.' }

export default function Home() { return <SiteFrame><TripPlanner /></SiteFrame> }

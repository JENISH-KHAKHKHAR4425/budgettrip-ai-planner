import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BudgetTrip AI | Smart Budget Trip Planner',
  description: 'Plan a thoughtful, budget-aware trip with AI-generated itineraries and independently verified cost estimates.',
  applicationName: 'BudgetTrip AI',
  keywords: ['AI trip planner', 'budget travel', 'India travel itinerary', 'INR travel budget'],
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#101713',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

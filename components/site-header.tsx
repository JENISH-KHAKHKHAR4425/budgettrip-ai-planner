'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, Menu } from 'lucide-react'
import { useState } from 'react'

const links = [
  { label: 'Home', href: '/' },
  { label: 'Plan Trip', href: '/#planner' },
  { label: 'Evaluation', href: '/evaluation' },
  { label: 'Prompt History', href: '/prompt-history' },
  { label: 'About', href: '/about' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="BudgetTrip AI home">
          <span className="brand-mark"><Compass size={21} strokeWidth={2.2} /></span>
          <span>BudgetTrip<span className="brand-ai"> AI</span></span>
        </Link>
        <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle navigation" aria-expanded={open}><Menu size={21} /></button>
        <nav className={`main-nav ${open ? 'nav-open' : ''}`} aria-label="Main navigation">
          {links.map((link) => {
            const active = link.href === '/' ? pathname === '/' : !link.href.includes('#') && pathname === link.href
            return <Link key={link.label} className={active ? 'nav-link active' : 'nav-link'} href={link.href} onClick={() => setOpen(false)}>{link.label}</Link>
          })}
        </nav>
        <Link className="nav-cta" href="/#planner">Start planning <span aria-hidden="true">↗</span></Link>
      </div>
    </header>
  )
}

export function SiteFrame({ children }: { children: React.ReactNode }) {
  return <><SiteHeader />{children}<footer className="site-footer"><span>BudgetTrip AI</span><span>Thoughtful trips. Smarter budgets.</span><span>Estimates only · No live bookings</span></footer></>
}

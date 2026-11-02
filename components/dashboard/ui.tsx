'use client'
import { motion } from 'framer-motion'

export const toneColors: Record<string, string> = {
  violet: '#7c6cff', teal: '#59d5c9', gold: '#f6b86c', pink: '#ed8fbb',
}

export function GlassIcon({ children, tone = 'violet' }: { children: React.ReactNode; tone?: string }) {
  return <div className={`glass-icon tone-${tone}`}>{children}</div>
}

export function SectionTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="section-head">
      <div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>
      {action}
    </div>
  )
}

export function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning,'
  if (h < 17) return 'Good afternoon,'
  return 'Good evening,'
}

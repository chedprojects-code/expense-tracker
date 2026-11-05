'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { calcStats, fmt, type Transaction } from '@/lib/supabase/db'
import { GlassIcon, SectionTitle, toneColors } from './ui'

export function InsightsView({ stats, transactions, month, year }: {
  stats: ReturnType<typeof calcStats>
  transactions: Transaction[]
  month: number
  year: number
}) {
  const monthTxns = transactions.filter((transaction) => {
    const date = new Date(transaction.date)
    return date.getMonth() === month && date.getFullYear() === year
  })
  const topExpense = stats.allCategories[0]
  const net = stats.income.rawAmount - stats.expenses.rawAmount

  return (
    <section className="notes-page">
      <SectionTitle eyebrow="INSIGHTS" title="Your patterns" />
      <div className="stat-grid" style={{ marginBottom: 12 }}>
        <div className="glass-panel stat-card">
          <p style={{ color: 'var(--muted)', fontSize: 10, margin: '0 0 4px' }}>Net this month</p>
          <strong style={{ fontSize: 16, color: net >= 0 ? '#18ad99' : '#d878a1' }}>{fmt(Math.abs(net))}</strong>
          <p style={{ fontSize: 9, color: 'var(--muted)', margin: '4px 0 0' }}>{net >= 0 ? 'surplus' : 'deficit'}</p>
        </div>
        <div className="glass-panel stat-card">
          <p style={{ color: 'var(--muted)', fontSize: 10, margin: '0 0 4px' }}>Transactions</p>
          <strong style={{ fontSize: 16 }}>{monthTxns.length}</strong>
          <p style={{ fontSize: 9, color: 'var(--muted)', margin: '4px 0 0' }}>this month</p>
        </div>
      </div>
      {topExpense && (
        <div className="glass-panel" style={{ padding: '14px', borderRadius: 20, marginBottom: 12 }}>
          <p className="eyebrow">TOP SPENDING CATEGORY</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <GlassIcon tone={topExpense.tone}><Sparkles style={{ width: 14 }} /></GlassIcon>
            <div>
              <p style={{ margin: 0, fontWeight: 700 }}>{topExpense.label}</p>
              <p style={{ margin: 0, fontSize: 10, color: 'var(--muted)' }}>{topExpense.percent}% of total expenses</p>
            </div>
            <strong style={{ marginLeft: 'auto' }}>{topExpense.value}</strong>
          </div>
        </div>
      )}
      <div className="glass-panel" style={{ padding: '14px', borderRadius: 20 }}>
        <p className="eyebrow" style={{ marginBottom: 10 }}>ALL CATEGORIES</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {stats.allCategories.length === 0
            ? <p style={{ color: 'var(--muted)', fontSize: 11 }}>No expenses recorded this month.</p>
            : stats.allCategories.map((category) => (
              <div key={category.label} className="category-item">
                <span className="category-name"><i style={{ background: toneColors[category.tone] }} />{category.label}</span>
                <strong>{category.value}</strong>
                <div className="category-bar">
                  <motion.i initial={{ width: 0 }} animate={{ width: `${category.percent}%` }} transition={{ duration: .8 }} style={{ background: toneColors[category.tone], display: 'block', height: '100%', borderRadius: 10 }} />
                </div>
              </div>
            ))
          }
        </div>
      </div>
      <div className="glass-panel" style={{ padding: '14px', borderRadius: 20, marginTop: 12 }}>
        <p className="eyebrow" style={{ marginBottom: 10 }}>TRANSACTIONS</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {monthTxns.length === 0
            ? <p style={{ color: 'var(--muted)', fontSize: 11 }}>No transactions this month.</p>
            : monthTxns.map((tx) => (
              <div key={tx.id} id={`search-result-transaction-${tx.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>{tx.description || tx.category}</p>
                  <small style={{ color: 'var(--muted)', fontSize: 10 }}>{tx.category} · {tx.date}</small>
                </div>
                <strong style={{ fontSize: 13, color: tx.type === 'income' ? '#18ad99' : '#d878a1' }}>
                  {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                </strong>
              </div>
            ))
          }
        </div>
      </div>
    </section>
  )
}

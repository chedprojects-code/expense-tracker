'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { fmt, type MonthlyBudget, type Transaction } from '@/lib/supabase/db'
import { parseLocalDate } from '@/lib/date-utils'
import { SectionTitle } from './ui'

const COMMON_EXPENSE_CATEGORIES = [
  'Food & snacks', 'Transport', 'Outings', 'Data & airtime', 'Utilities',
  'Shopping', 'Health', 'Rent', 'Other',
]

export function BudgetManager({ budgets, transactions, month, year, onSave, onDelete }: {
  budgets: MonthlyBudget[]
  transactions: Transaction[]
  month: number
  year: number
  onSave: (category: string, amount: number) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [category, setCategory] = useState(COMMON_EXPENSE_CATEGORIES[0])
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const categories = [...new Set([
    ...COMMON_EXPENSE_CATEGORIES,
    ...transactions.filter((transaction) => transaction.type === 'expense').map((transaction) => transaction.category),
  ])]
  const spentByCategory = new Map<string, number>()

  for (const transaction of transactions) {
    const date = parseLocalDate(transaction.date)
    if (transaction.type === 'expense' && date.getMonth() === month && date.getFullYear() === year) {
      spentByCategory.set(transaction.category, (spentByCategory.get(transaction.category) ?? 0) + transaction.amount)
    }
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const parsedAmount = Number(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a budget greater than zero.')
      return
    }
    try {
      await onSave(category, parsedAmount)
      setAmount('')
      setError('')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save this budget.')
    }
  }

  return (
    <section style={{ marginTop: 16 }}>
      <SectionTitle eyebrow="MONTHLY PLAN" title="Category budgets" />
      <form className="glass-panel" onSubmit={submit} style={{ borderRadius: 18, padding: 12, display: 'flex', gap: 7 }}>
        <select aria-label="Budget category" value={category} onChange={(event) => setCategory(event.target.value)} style={{ minWidth: 0, flex: 1, borderRadius: 9, padding: 8, background: 'var(--surface)', color: 'var(--ink)' }}>
          {categories.map((option) => <option key={option}>{option}</option>)}
        </select>
        <input aria-label="Budget amount" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Monthly limit" style={{ width: 110, minWidth: 0, borderRadius: 9, padding: 8, background: 'var(--surface)', color: 'var(--ink)' }} />
        <button className="primary-button" type="submit" style={{ margin: 0, padding: '8px 10px' }}>Set</button>
      </form>
      {error && <p role="alert" style={{ color: '#c44', fontSize: 10, margin: '6px 2px' }}>{error}</p>}
      {budgets.length === 0 ? (
        <div className="glass-panel" style={{ padding: 12, borderRadius: 16, marginTop: 8, color: 'var(--muted)', fontSize: 10 }}>
          Set a category limit to track spending progress here.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {budgets.map((budget) => {
            const spent = spentByCategory.get(budget.category) ?? 0
            const percent = Math.round((spent / budget.amount) * 100)
            const overBudget = spent > budget.amount
            return (
              <div key={budget.id} className="glass-panel" style={{ padding: 12, borderRadius: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontSize: 11, flex: 1 }}>{budget.category}</strong>
                  <span style={{ fontSize: 9, color: overBudget ? '#d878a1' : 'var(--muted)' }}>
                    {fmt(spent)} / {fmt(budget.amount)}
                  </span>
                  <button type="button" aria-label={`Delete ${budget.category} budget`} onClick={() => onDelete(budget.id)} style={{ background: 'none', color: 'var(--muted)', padding: 3 }}>
                    <Trash2 style={{ width: 13 }} />
                  </button>
                </div>
                <div className="progress" style={{ marginTop: 8 }}>
                  <i style={{ display: 'block', height: '100%', width: `${Math.min(percent, 100)}%`, borderRadius: 9, background: overBudget ? '#d878a1' : percent >= 80 ? '#f0a04b' : '#18ad99' }} />
                </div>
                <small style={{ display: 'block', marginTop: 5, color: overBudget ? '#d878a1' : 'var(--muted)', fontSize: 9 }}>
                  {overBudget ? `Over budget by ${fmt(spent - budget.amount)}` : percent >= 80 ? 'Close to your limit' : `${fmt(budget.amount - spent)} remaining`}
                </small>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

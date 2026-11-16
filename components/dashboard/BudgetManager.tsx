'use client'

import { useState } from 'react'
import { Pencil, Save, Trash2, X } from 'lucide-react'
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
  onSave: (category: string, amount: number, budgetId?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [category, setCategory] = useState(COMMON_EXPENSE_CATEGORIES[0])
  const [amount, setAmount] = useState('')
  const [editingBudget, setEditingBudget] = useState<MonthlyBudget | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [error, setError] = useState('')
  const categories = [...new Set([
    ...COMMON_EXPENSE_CATEGORIES,
    ...budgets.map((budget) => budget.category),
    ...transactions.filter((transaction) => transaction.type === 'expense').map((transaction) => transaction.category),
  ])]
  const spentByCategory = new Map<string, number>()

  for (const transaction of transactions) {
    const date = parseLocalDate(transaction.date)
    if (transaction.type === 'expense' && date.getMonth() === month && date.getFullYear() === year) {
      spentByCategory.set(transaction.category, (spentByCategory.get(transaction.category) ?? 0) + transaction.amount)
    }
  }

  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0)
  const totalSpent = budgets.reduce((sum, budget) => sum + (spentByCategory.get(budget.category) ?? 0), 0)
  const totalRemaining = totalBudget - totalSpent

  const resetForm = () => {
    setEditingBudget(null)
    setCategory(COMMON_EXPENSE_CATEGORIES[0])
    setAmount('')
    setError('')
  }

  const editBudget = (budget: MonthlyBudget) => {
    setEditingBudget(budget)
    setCategory(budget.category)
    setAmount(String(budget.amount))
    setError('')
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const parsedAmount = Number(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a budget greater than zero.')
      return
    }
    setSaving(true)
    try {
      await onSave(category, parsedAmount, editingBudget?.id)
      resetForm()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save this budget.')
    } finally {
      setSaving(false)
    }
  }

  const deleteBudget = async (budget: MonthlyBudget) => {
    setDeletingId(budget.id)
    setError('')
    try {
      await onDelete(budget.id)
      if (editingBudget?.id === budget.id) resetForm()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete this budget.')
    } finally {
      setDeletingId('')
    }
  }

  return (
    <section className="budget-manager">
      <SectionTitle eyebrow="MONTHLY PLAN" title="Category budgets" />
      <div className="budget-summary">
        <div className="glass-panel budget-summary-card">
          <span>Total budget</span>
          <strong>{fmt(totalBudget)}</strong>
        </div>
        <div className="glass-panel budget-summary-card">
          <span>Spent so far</span>
          <strong>{fmt(totalSpent)}</strong>
        </div>
        <div className="glass-panel budget-summary-card">
          <span>{totalRemaining < 0 ? 'Over budget' : 'Remaining'}</span>
          <strong style={{ color: totalRemaining < 0 ? '#d878a1' : '#18ad99' }}>
            {fmt(Math.abs(totalRemaining))}
          </strong>
        </div>
      </div>

      <form className="glass-panel budget-form" onSubmit={submit}>
        <label>
          <span>Category</span>
          <select aria-label="Budget category" value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((option) => {
              const isUsedByAnotherBudget = budgets.some((budget) => budget.category === option && budget.id !== editingBudget?.id)
              return <option key={option} value={option} disabled={Boolean(editingBudget) && isUsedByAnotherBudget}>{option}</option>
            })}
          </select>
        </label>
        <label>
          <span>Monthly limit</span>
          <input aria-label="Budget amount" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Enter amount" />
        </label>
        <div className="budget-form-actions">
          <button className="primary-button" type="submit" disabled={saving} style={{ margin: 0 }}>
            <Save style={{ width: 14 }} /> {saving ? 'Saving…' : editingBudget ? 'Update budget' : 'Add budget'}
          </button>
          {editingBudget && (
            <button type="button" className="budget-cancel-button" onClick={resetForm}>
              <X style={{ width: 14 }} /> Cancel
            </button>
          )}
        </div>
      </form>
      {error && <p role="alert" className="budget-error">{error}</p>}

      {budgets.length === 0 ? (
        <div className="glass-panel budget-empty">
          <p>No category budgets yet.</p>
          <small>Set a monthly limit to track spending progress here.</small>
        </div>
      ) : (
        <div className="budget-list">
          {budgets.map((budget) => {
            const spent = spentByCategory.get(budget.category) ?? 0
            const percent = Math.round((spent / budget.amount) * 100)
            const overBudget = spent > budget.amount
            return (
              <article key={budget.id} className="glass-panel budget-card">
                <div className="budget-card-heading">
                  <div>
                    <strong>{budget.category}</strong>
                    <small>{fmt(spent)} spent of {fmt(budget.amount)}</small>
                  </div>
                  <div className="budget-card-actions">
                    <button type="button" aria-label={`Edit ${budget.category} budget`} title="Edit budget" onClick={() => editBudget(budget)}>
                      <Pencil style={{ width: 14 }} />
                    </button>
                    <button type="button" aria-label={`Delete ${budget.category} budget`} title="Delete budget" disabled={deletingId === budget.id} onClick={() => deleteBudget(budget)}>
                      <Trash2 style={{ width: 14 }} />
                    </button>
                  </div>
                </div>
                <div className="progress">
                  <i style={{ display: 'block', height: '100%', width: `${Math.min(percent, 100)}%`, borderRadius: 9, background: overBudget ? '#d878a1' : percent >= 80 ? '#f0a04b' : '#18ad99' }} />
                </div>
                <small className={`budget-status ${overBudget ? 'over' : ''}`}>
                  {overBudget ? `Over budget by ${fmt(spent - budget.amount)}` : percent >= 80 ? 'Close to your limit' : `${fmt(budget.amount - spent)} remaining`}
                </small>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

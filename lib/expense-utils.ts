import type { Note, Account, SavingsGoal } from '@/lib/supabase/db'
import type { NoteDraft, AccountDraft, TxDraft, GoalDraft } from '@/components/dashboard/types'

export function createNoteDraft(note?: Note): NoteDraft {
  if (note) {
    return { title: note.title, amount: String(note.amount), due_date: note.due_date, category: note.category }
  }
  return { title: '', amount: '', due_date: '', category: 'Want' }
}

export function createAccountDraft(account?: Account): AccountDraft {
  if (account) {
    return { name: account.name, purpose: account.purpose, balance: String(account.balance), tone: account.tone, symbol: account.symbol }
  }
  return { name: '', purpose: '', balance: '', tone: 'violet', symbol: '₦' }
}

export function createTxDraft(type: 'income' | 'expense' = 'expense'): TxDraft {
  return {
    type,
    amount: '',
    category: type === 'income' ? 'Salary' : 'Food & snacks',
    description: '',
    date: new Date().toISOString().slice(0, 10),
  }
}

export function createGoalDraft(goal?: SavingsGoal): GoalDraft {
  if (goal) {
    return { title: goal.title, current: String(goal.current_amount), target: String(goal.target_amount) }
  }
  return { title: '', current: '', target: '' }
}

export function createProfileDraft(profile?: { name: string; initials: string }): { name: string; initials: string } {
  if (profile) {
    return { name: profile.name, initials: profile.initials }
  }
  return { name: '', initials: '' }
}

export function isFormValid<T extends object>(draft: T, fields: (keyof T)[]): boolean {
  return fields.every((field) => {
    const value = draft[field]
    return typeof value === 'string' && value.trim() !== ''
  })
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function getViewPeriodLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleString('en-NG', { month: 'short', year: 'numeric' })
}

export function shiftMonth(month: number, year: number, dir: 1 | -1): { month: number; year: number } {
  const next = month + dir
  if (next < 0) return { month: 11, year: year - 1 }
  if (next > 11) return { month: 0, year: year + 1 }
  return { month: next, year }
}

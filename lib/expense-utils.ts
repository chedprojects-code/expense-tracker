import type { Note, Account, SavingsGoal, Lender, FutureExpense } from '@/lib/supabase/db'
import type { NoteDraft, AccountDraft, TxDraft, GoalDraft, LenderDraft, FutureExpenseDraft, RecurringDraft } from '@/components/dashboard/types'
import type { RecurringTransaction } from '@/lib/supabase/db'
import { formatLocalDate } from '@/lib/date-utils'

export function createNoteDraft(note?: Note): NoteDraft {
  if (note) {
    return {
      title: note.title,
      amount: String(note.amount),
      amount_max: note.amount_max != null ? String(note.amount_max) : '',
      due_date: note.due_date,
      category: note.category,
      tags: note.tags ?? [],
    }
  }
  return { title: '', amount: '', amount_max: '', due_date: '', category: 'Want', tags: [] }
}

export function createAccountDraft(account?: Account): AccountDraft {
  if (account) {
    return {
      name: account.name ?? '',
      purpose: account.purpose ?? '',
      balance: account.balance == null ? '' : String(account.balance),
      tone: account.tone ?? 'violet',
      symbol: account.symbol ?? '₦',
      annual_interest: String(account.annual_interest ?? 0),
      is_vault: account.is_vault ?? false,
    }
  }
  return { name: '', purpose: '', balance: '', tone: 'violet', symbol: '₦', annual_interest: '0', is_vault: false }
}

export function createTxDraft(type: 'income' | 'expense' | 'transfer' = 'expense', accountIds: string[] = []): TxDraft {
  return {
    type,
    amount: '',
    category: type === 'income' ? 'Salary' : type === 'transfer' ? 'Transfer' : 'Food & snacks',
    description: '',
    date: formatLocalDate(),
    account_id: accountIds[0] ?? '',
    transfer_to_account_id: accountIds[1] ?? '',
  }
}

export function createRecurringDraft(rule?: RecurringTransaction): RecurringDraft {
  if (rule) {
    return {
      type: rule.type,
      amount: String(rule.amount),
      category: rule.category,
      description: rule.description,
      account_id: rule.account_id ?? '',
      frequency: rule.frequency,
      next_date: rule.next_date,
    }
  }
  return {
    type: 'expense',
    amount: '',
    category: 'Other',
    description: '',
    account_id: '',
    frequency: 'monthly',
    next_date: formatLocalDate(),
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

export function createLenderDraft(lender?: Lender): LenderDraft {
  if (lender) {
    return {
      name: lender.name ?? '',
      amount: lender.amount == null ? '' : String(lender.amount),
      note: lender.note ?? '',
      account_id: lender.account_id ?? '',
    }
  }
  return { name: '', amount: '', note: '', account_id: '' }
}

export function createFutureExpenseDraft(item?: FutureExpense): FutureExpenseDraft {
  if (item) return { title: item.title, amount: String(item.amount), due_date: item.due_date, category: item.category }
  return { title: '', amount: '', due_date: formatLocalDate(), category: 'Other' }
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

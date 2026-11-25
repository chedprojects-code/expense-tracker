export type NoteDraft = { title: string; amount: string; amount_max: string; due_date: string; category: string; tags: string[] }
export type AccountDraft = { name: string; purpose: string; balance: string; tone: string; symbol: string; annual_interest: string; is_vault: boolean }
export type TxDraft = { type: 'income' | 'expense' | 'transfer'; amount: string; category: string; description: string; date: string; account_id: string; transfer_to_account_id: string }
export type GoalDraft = { title: string; current: string; target: string }
export type LenderDraft = { name: string; amount: string; note: string; account_id: string }
export type FutureExpenseDraft = { title: string; amount: string; due_date: string; category: string }
export type RecurringDraft = { type: 'income' | 'expense'; amount: string; category: string; description: string; account_id: string; frequency: 'weekly' | 'monthly'; next_date: string }
export type DashboardSearchType =
  | 'account'
  | 'transaction'
  | 'futureExpense'
  | 'lender'
  | 'financialNote'
  | 'plainNote'
  | 'buyListItem'
  | 'goal'
export type DashboardSearchItem = {
  id: string
  type: DashboardSearchType
  title: string
  detail: string
  searchText?: string
  date?: string
  section?: string
}

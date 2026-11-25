import { createClient } from '@/lib/supabase/client'
import { parseLocalDate } from '@/lib/date-utils'

export type Profile = {
  id: string
  name: string
  initials: string
  updated_at: string
}

export type Account = {
  id: string
  user_id: string
  name: string
  purpose: string
  balance: number
  balance_as_of: string
  tone: string
  symbol: string
  annual_interest: number
  is_vault: boolean
  vault_hidden: boolean
  last_interest_applied_at: string | null
  created_at: string
}

export type Transaction = {
  id: string
  user_id: string
  type: 'income' | 'expense' | 'transfer'
  amount: number
  category: string
  description: string
  date: string
  account_id: string | null
  transfer_to_account_id: string | null
  buy_list_item_id: string | null
  recurring_id: string | null
  created_at: string
}

export type Note = {
  id: string
  user_id: string
  title: string
  amount: number
  amount_max: number | null
  due_date: string
  category: string
  updated_at: string
  created_at: string
  sort_order: number
  tags: string[]
  pinned: boolean
  archived: boolean
}

export type PlainNote = {
  id: string
  user_id: string
  title: string
  body: string
  created_at: string
  updated_at: string
  sort_order: number
  due_date: string | null
  tags: string[]
  pinned: boolean
  archived: boolean
}

export type SavingsGoal = {
  id: string
  user_id: string
  title: string
  current_amount: number
  target_amount: number
  updated_at: string
}

export type Notification = {
  id: string
  user_id: string
  message: string
  read: boolean
  created_at: string
}

export const fmt = (n: number) =>
  'NGN ' + n.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

function throwOnSupabaseError(error: { message: string } | null): void {
  if (error) throw new Error(error.message)
}

// ─── Profile ────────────────────────────────────────────────────────────────
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  throwOnSupabaseError(error)
  return data
}

export async function updateProfile(userId: string, updates: Partial<Pick<Profile, 'name' | 'initials'>>) {
  const supabase = createClient()
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
  throwOnSupabaseError(error)
}

// ─── Accounts ───────────────────────────────────────────────────────────────
export async function getAccounts(userId: string): Promise<Account[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('accounts').select('*').eq('user_id', userId).order('created_at')
  throwOnSupabaseError(error)
  return data ?? []
}

export async function upsertAccount(account: Omit<Account, 'created_at'>): Promise<Account> {
  const supabase = createClient()
  const { data, error } = await supabase.from('accounts').upsert(account).select().single()
  throwOnSupabaseError(error)
  return data
}

export async function applyDailyInterest(accounts: Account[]): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('apply_daily_account_interest', {
    p_account_ids: accounts.filter((account) => account.annual_interest > 0).map((account) => account.id),
  })
  throwOnSupabaseError(error)
}

export async function updateAccountVaultVisibility(id: string, vault_hidden: boolean) {
  const supabase = createClient()
  const { error } = await supabase.from('accounts').update({ vault_hidden }).eq('id', id)
  throwOnSupabaseError(error)
}

export async function deleteAccount(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('accounts').delete().eq('id', id)
  throwOnSupabaseError(error)
}

// ─── Transactions ────────────────────────────────────────────────────────────
export async function getTransactions(userId: string): Promise<Transaction[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
  throwOnSupabaseError(error)
  return data ?? []
}

export async function saveTransaction(tx: Omit<Transaction, 'created_at'>): Promise<Transaction> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('save_account_transaction', {
    p_id: tx.id,
    p_type: tx.type,
    p_amount: tx.amount,
    p_category: tx.category,
    p_description: tx.description,
    p_date: tx.date,
    p_account_id: tx.account_id,
    p_transfer_to_account_id: tx.transfer_to_account_id,
    p_buy_list_item_id: tx.buy_list_item_id,
    p_recurring_id: tx.recurring_id,
  })
  throwOnSupabaseError(error)
  return data
}

export async function deleteTransaction(id: string) {
  const supabase = createClient()
  const { error } = await supabase.rpc('delete_account_transaction', { p_id: id })
  throwOnSupabaseError(error)
}

// ─── Stats & Chart ───────────────────────────────────────────────────────────
export function calcStats(transactions: Transaction[], month: number, year: number) {
  const inMonth = (t: Transaction, m: number, y: number) => {
    const d = parseLocalDate(t.date)
    return d.getMonth() === m && d.getFullYear() === y
  }

  const prevMonth = month === 0 ? 11 : month - 1
  const prevYear = month === 0 ? year - 1 : year

  const thisMonth = transactions.filter((t) => inMonth(t, month, year))
  const lastMonth = transactions.filter((t) => inMonth(t, prevMonth, prevYear))

  const sum = (arr: Transaction[], type: 'income' | 'expense') =>
    arr.filter((t) => t.type === type).reduce((acc, t) => acc + t.amount, 0)

  const income = sum(thisMonth, 'income')
  const expenses = sum(thisMonth, 'expense')
  const prevIncome = sum(lastMonth, 'income')
  const prevExpenses = sum(lastMonth, 'expense')

  const pct = (curr: number, prev: number) => {
    if (prev === 0 && curr === 0) return '0%'
    if (prev === 0) return '+100%'
    const diff = ((curr - prev) / prev) * 100
    return (diff >= 0 ? '+' : '') + diff.toFixed(1) + '%'
  }

  // Category breakdown
  const categoryMap: Record<string, number> = {}
  thisMonth.filter((t) => t.type === 'expense').forEach((t) => {
    categoryMap[t.category] = (categoryMap[t.category] ?? 0) + t.amount
  })
  const tones = ['violet', 'teal', 'gold', 'pink']
  const categories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, value], i) => ({
      label,
      value: fmt(value),
      rawValue: value,
      percent: expenses > 0 ? Math.round((value / expenses) * 100) : 0,
      tone: tones[i % tones.length],
    }))

  // All categories (for details panel)
  const allCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], i) => ({
      label,
      value: fmt(value),
      rawValue: value,
      percent: expenses > 0 ? Math.round((value / expenses) * 100) : 0,
      tone: tones[i % tones.length],
    }))

  const period = new Date(year, month, 1).toLocaleString('en-NG', { month: 'long', year: 'numeric' })

  return {
    period,
    income: { amount: fmt(income), rawAmount: income, change: pct(income, prevIncome), isPositive: income >= prevIncome },
    expenses: { amount: fmt(expenses), rawAmount: expenses, change: pct(expenses, prevExpenses), isPositive: expenses <= prevExpenses },
    categories,
    allCategories,
    thisMonthTxns: thisMonth,
  }
}

// Build SVG path data from daily transaction totals for the spending flow chart
export function buildChartPaths(transactions: Transaction[], month: number, year: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const incomeByDay: number[] = Array(daysInMonth).fill(0)
  const expenseByDay: number[] = Array(daysInMonth).fill(0)

  transactions.forEach((t) => {
    const d = parseLocalDate(t.date)
    if (d.getMonth() !== month || d.getFullYear() !== year) return
    const day = d.getDate() - 1
    if (t.type === 'income') incomeByDay[day] += t.amount
    else if (t.type === 'expense') expenseByDay[day] += t.amount
  })

  // Running cumulative
  const incCum = incomeByDay.reduce<number[]>((acc, v, i) => { acc.push((acc[i - 1] ?? 0) + v); return acc }, [])
  const expCum = expenseByDay.reduce<number[]>((acc, v, i) => { acc.push((acc[i - 1] ?? 0) + v); return acc }, [])

  const maxVal = Math.max(...incCum, ...expCum, 1)
  const W = 500
  const H = 150
  const pad = 10

  const toPoint = (val: number, idx: number, total: number) => {
    const x = (idx / (total - 1)) * (W - pad * 2) + pad
    const y = H - pad - ((val / maxVal) * (H - pad * 2))
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }

  const points = (arr: number[]) => arr.map((v, i) => toPoint(v, i, arr.length))

  const linePath = (pts: string[]) => pts.length < 2
    ? `M${pts[0] ?? '0,150'}`
    : `M${pts[0]} ` + pts.slice(1).map((p) => `L${p}`).join(' ')

  const incPts = points(incCum)
  const expPts = points(expCum)

  const incLine = linePath(incPts)
  const expLine = linePath(expPts)
  const incArea = incLine + ` L${W - pad},${H - pad} L${pad},${H - pad} Z`

  // Day labels: 5 evenly spaced
  const dayLabels = Array.from({ length: 5 }, (_, i) =>
    String(Math.round((i / 4) * (daysInMonth - 1)) + 1).padStart(2, '0')
  )

  return { incLine, expLine, incArea, dayLabels }
}

// ─── Notes ───────────────────────────────────────────────────────────────────
export async function getNotes(userId: string): Promise<Note[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
  throwOnSupabaseError(error)
  return data ?? []
}

export async function updateNotesSortOrder(items: { id: string; sort_order: number }[]) {
  const supabase = createClient()
  const results = await Promise.all(items.map(({ id, sort_order }) =>
    supabase.from('notes').update({ sort_order }).eq('id', id)
  ))
  for (const result of results) throwOnSupabaseError(result.error)
}

export async function upsertNote(note: Omit<Note, 'created_at'>): Promise<Note> {
  const supabase = createClient()
  const { data, error } = await supabase.from('notes').upsert({ ...note, updated_at: new Date().toISOString() }).select().single()
  throwOnSupabaseError(error)
  return data
}

export async function updateNoteFlags(id: string, updates: { pinned?: boolean; archived?: boolean }): Promise<Note> {
  const supabase = createClient()
  const { data, error } = await supabase.from('notes').update(updates).eq('id', id).select().single()
  throwOnSupabaseError(error)
  return data
}

// ─── Plain Notes ──────────────────────────────────────────────────────────────
export async function getPlainNotes(userId: string): Promise<PlainNote[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('plain_notes')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
  throwOnSupabaseError(error)
  return data ?? []
}

export async function updatePlainNotesSortOrder(items: { id: string; sort_order: number }[]) {
  const supabase = createClient()
  const results = await Promise.all(items.map(({ id, sort_order }) =>
    supabase.from('plain_notes').update({ sort_order }).eq('id', id)
  ))
  for (const result of results) throwOnSupabaseError(result.error)
}

export async function upsertPlainNote(note: Omit<PlainNote, 'created_at'>): Promise<PlainNote> {
  const supabase = createClient()
  const { data, error } = await supabase.from('plain_notes').upsert({ ...note, updated_at: new Date().toISOString() }).select().single()
  throwOnSupabaseError(error)
  return data
}

export async function updatePlainNoteFlags(id: string, updates: { pinned?: boolean; archived?: boolean }): Promise<PlainNote> {
  const supabase = createClient()
  const { data, error } = await supabase.from('plain_notes').update(updates).eq('id', id).select().single()
  throwOnSupabaseError(error)
  return data
}

export async function deletePlainNote(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('plain_notes').delete().eq('id', id)
  throwOnSupabaseError(error)
}

export async function deleteNote(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('notes').delete().eq('id', id)
  throwOnSupabaseError(error)
}

// ─── Savings Goal ─────────────────────────────────────────────────────────────
export async function getSavingsGoal(userId: string): Promise<SavingsGoal | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from('savings_goals').select('*').eq('user_id', userId).maybeSingle()
  throwOnSupabaseError(error)
  return data
}

export async function upsertSavingsGoal(goal: Omit<SavingsGoal, 'updated_at'>) {
  const supabase = createClient()
  const { error } = await supabase.from('savings_goals').upsert({ ...goal, updated_at: new Date().toISOString() })
  throwOnSupabaseError(error)
}

// ─── Notifications ────────────────────────────────────────────────────────────
export async function getNotifications(userId: string): Promise<Notification[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)
  throwOnSupabaseError(error)
  return data ?? []
}

export async function markNotificationsRead(userId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
  throwOnSupabaseError(error)
}

// ─── Lenders ──────────────────────────────────────────────────────────────────
export type Lender = {
  id: string
  user_id: string
  name: string
  amount: number
  note: string
  account_id: string | null
  created_at: string
}

export async function getLenders(userId: string): Promise<Lender[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('lenders').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  throwOnSupabaseError(error)
  return data ?? []
}

export async function upsertLender(lender: Omit<Lender, 'created_at'>): Promise<Lender> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('save_lender', {
    p_id: lender.id,
    p_name: lender.name,
    p_amount: lender.amount,
    p_note: lender.note,
    p_account_id: lender.account_id,
  })
  throwOnSupabaseError(error)
  return data
}

export async function recordLenderRepayment(lenderId: string, accountId: string) {
  const supabase = createClient()
  const { error } = await supabase.rpc('record_lender_repayment', {
    p_lender_id: lenderId,
    p_account_id: accountId,
  })
  throwOnSupabaseError(error)
}

export async function deleteLender(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('lenders').delete().eq('id', id)
  throwOnSupabaseError(error)
}

// ─── Future Expenses ───────────────────────────────────────────────────────────────
export type FutureExpense = {
  id: string
  user_id: string
  title: string
  amount: number
  due_date: string
  category: string
  paid_at: string | null
  paid_transaction_id: string | null
  created_at: string
}

export async function getFutureExpenses(userId: string): Promise<FutureExpense[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('future_expenses').select('*').eq('user_id', userId).order('due_date')
  throwOnSupabaseError(error)
  return data ?? []
}

export async function upsertFutureExpense(item: Omit<FutureExpense, 'created_at'>) {
  const supabase = createClient()
  const { error } = await supabase.from('future_expenses').upsert(item)
  throwOnSupabaseError(error)
}

export async function deleteFutureExpense(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('future_expenses').delete().eq('id', id)
  throwOnSupabaseError(error)
}

export async function settleFutureExpense(id: string, amount: number, accountId: string | null): Promise<Transaction> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('settle_future_expense', {
    p_expense_id: id,
    p_account_id: accountId,
    p_amount: amount,
  })
  throwOnSupabaseError(error)
  return data
}

// ─── Buy List ──────────────────────────────────────────────────────────────────
export type BuyListItem = {
  id: string
  user_id: string
  title: string
  price: number | null
  category: 'need' | 'want'
  bought: boolean
  bought_at: string | null
  created_at: string
  sort_order: number
}

export async function getBuyListItems(userId: string): Promise<BuyListItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('buy_list_items').select('*').eq('user_id', userId).order('sort_order', { ascending: true })
  throwOnSupabaseError(error)
  return data ?? []
}

export async function updateBuyListSortOrder(items: { id: string; sort_order: number }[]) {
  const supabase = createClient()
  const results = await Promise.all(items.map(({ id, sort_order }) =>
    supabase.from('buy_list_items').update({ sort_order }).eq('id', id)
  ))
  for (const result of results) throwOnSupabaseError(result.error)
}

export async function insertBuyListItem(item: Omit<BuyListItem, 'id' | 'created_at'>): Promise<BuyListItem> {
  const supabase = createClient()
  const { data, error } = await supabase.from('buy_list_items').insert(item).select().single()
  throwOnSupabaseError(error)
  return data
}

export async function updateBuyListItem(id: string, updates: Partial<Pick<BuyListItem, 'bought' | 'title' | 'category' | 'price'>>) {
  const supabase = createClient()
  const { error } = await supabase.from('buy_list_items').update(updates).eq('id', id)
  throwOnSupabaseError(error)
}

export async function deleteBuyListItem(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('buy_list_items').delete().eq('id', id)
  throwOnSupabaseError(error)
}

export async function purchaseBuyListItem(id: string, amount: number, accountId: string | null): Promise<Transaction> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('purchase_buy_list_item', {
    p_item_id: id,
    p_amount: amount,
    p_account_id: accountId,
  })
  throwOnSupabaseError(error)
  return data
}

export async function unpurchaseBuyListItem(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('transactions')
    .select('id')
    .eq('buy_list_item_id', id)
    .maybeSingle()
  throwOnSupabaseError(error)
  if (data) await deleteTransaction(data.id)
  const { error: updateError } = await supabase
    .from('buy_list_items')
    .update({ bought: false, bought_at: null })
    .eq('id', id)
  throwOnSupabaseError(updateError)
}

export type RecurringTransaction = {
  id: string
  user_id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  account_id: string | null
  frequency: 'weekly' | 'monthly'
  next_date: string
  active: boolean
  created_at: string
}

export async function getRecurringTransactions(userId: string): Promise<RecurringTransaction[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .order('next_date')
  throwOnSupabaseError(error)
  return data ?? []
}

export async function upsertRecurringTransaction(rule: Omit<RecurringTransaction, 'created_at'>): Promise<RecurringTransaction> {
  const supabase = createClient()
  const { data, error } = await supabase.from('recurring_transactions').upsert(rule).select().single()
  throwOnSupabaseError(error)
  return data
}

export async function deleteRecurringTransaction(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('recurring_transactions').delete().eq('id', id)
  throwOnSupabaseError(error)
}

export async function recordRecurringTransaction(id: string): Promise<Transaction> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('record_recurring_transaction', { p_recurring_id: id })
  throwOnSupabaseError(error)
  return data
}

export type MonthlyBudget = {
  id: string
  user_id: string
  month_start: string
  category: string
  amount: number
  created_at: string
}

export async function getMonthlyBudgets(userId: string, monthStart: string): Promise<MonthlyBudget[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('monthly_budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('month_start', monthStart)
    .order('category')
  throwOnSupabaseError(error)
  return data ?? []
}

export async function upsertMonthlyBudget(budget: Omit<MonthlyBudget, 'created_at'>): Promise<MonthlyBudget> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('monthly_budgets')
    .upsert(budget, { onConflict: 'id' })
    .select()
    .single()
  throwOnSupabaseError(error)
  return data
}

export async function deleteMonthlyBudget(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('monthly_budgets').delete().eq('id', id)
  throwOnSupabaseError(error)
}

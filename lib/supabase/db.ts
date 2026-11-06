import { createClient } from '@/lib/supabase/client'

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
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
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
}

export type PlainNote = {
  id: string
  user_id: string
  title: string
  body: string
  created_at: string
  updated_at: string
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

export async function upsertAccount(account: Omit<Account, 'created_at'>) {
  const supabase = createClient()
  const { error } = await supabase.from('accounts').upsert(account)
  throwOnSupabaseError(error)
}

export async function applyDailyInterest(accounts: Account[]): Promise<void> {
  const supabase = createClient()
  const now = new Date()
  const updates = accounts
    .filter((a) => a.annual_interest > 0)
    .map((a) => {
      const last = a.last_interest_applied_at ? new Date(a.last_interest_applied_at) : new Date(a.created_at)
      const days = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
      if (days < 1) return null
      const interest = a.balance * (a.annual_interest / 100) * (Math.floor(days) / 365)
      return { id: a.id, balance: a.balance + interest, last_interest_applied_at: now.toISOString() }
    })
    .filter(Boolean) as { id: string; balance: number; last_interest_applied_at: string }[]

  await Promise.all(
    updates.map((u) => supabase.from('accounts').update({ balance: u.balance, last_interest_applied_at: u.last_interest_applied_at }).eq('id', u.id))
  )
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

export async function insertTransaction(tx: Omit<Transaction, 'id' | 'created_at'>) {
  const supabase = createClient()
  const { error } = await supabase.from('transactions').insert(tx)
  throwOnSupabaseError(error)
}

export async function deleteTransaction(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  throwOnSupabaseError(error)
}

export async function updateTransaction(id: string, updates: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at'>>) {
  const supabase = createClient()
  const { error } = await supabase.from('transactions').update(updates).eq('id', id)
  throwOnSupabaseError(error)
}

// ─── Stats & Chart ───────────────────────────────────────────────────────────
export function calcStats(transactions: Transaction[], month: number, year: number) {
  const inMonth = (t: Transaction, m: number, y: number) => {
    const d = new Date(t.date)
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
    const d = new Date(t.date)
    if (d.getMonth() !== month || d.getFullYear() !== year) return
    const day = d.getDate() - 1
    if (t.type === 'income') incomeByDay[day] += t.amount
    else expenseByDay[day] += t.amount
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
    .order('created_at', { ascending: false })
  throwOnSupabaseError(error)
  return data ?? []
}

export async function upsertNote(note: Omit<Note, 'created_at'>): Promise<Note> {
  const supabase = createClient()
  const { data, error } = await supabase.from('notes').upsert({ ...note, updated_at: new Date().toISOString() }).select().single()
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
    .order('created_at', { ascending: false })
  throwOnSupabaseError(error)
  return data ?? []
}

export async function upsertPlainNote(note: Omit<PlainNote, 'created_at'>): Promise<PlainNote> {
  const supabase = createClient()
  const { data, error } = await supabase.from('plain_notes').upsert({ ...note, updated_at: new Date().toISOString() }).select().single()
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
  created_at: string
}

export async function getLenders(userId: string): Promise<Lender[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('lenders').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  throwOnSupabaseError(error)
  return data ?? []
}

export async function upsertLender(lender: Omit<Lender, 'created_at'>) {
  const supabase = createClient()
  const { error } = await supabase.from('lenders').upsert(lender)
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

// ─── Buy List ──────────────────────────────────────────────────────────────────
export type BuyListItem = {
  id: string
  user_id: string
  title: string
  price: number | null
  category: 'need' | 'want'
  bought: boolean
  created_at: string
}

export async function getBuyListItems(userId: string): Promise<BuyListItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('buy_list_items').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  throwOnSupabaseError(error)
  return data ?? []
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

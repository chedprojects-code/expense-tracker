import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  getProfile, getAccounts, getTransactions, getNotes, getSavingsGoal,
  getNotifications, markNotificationsRead,
  upsertNote, deleteNote,
  upsertAccount, deleteAccount, updateAccountVaultVisibility,
  upsertSavingsGoal, saveTransaction, deleteTransaction, updateProfile,
  getLenders, upsertLender, deleteLender,
  getFutureExpenses, upsertFutureExpense, deleteFutureExpense, settleFutureExpense,
  getPlainNotes, upsertPlainNote, deletePlainNote,
  getBuyListItems, insertBuyListItem, updateBuyListItem, deleteBuyListItem, purchaseBuyListItem, unpurchaseBuyListItem,
  getRecurringTransactions, upsertRecurringTransaction, deleteRecurringTransaction, recordRecurringTransaction,
  getMonthlyBudgets, upsertMonthlyBudget, deleteMonthlyBudget,
  calcStats, buildChartPaths,
  applyDailyInterest,
  updateNotesSortOrder, updatePlainNotesSortOrder, updateBuyListSortOrder,
  type Account, type Note, type SavingsGoal, type Transaction, type Notification, type Lender, type FutureExpense, type PlainNote, type BuyListItem,
  type RecurringTransaction, type MonthlyBudget,
} from '@/lib/supabase/db'
import {
  createAccountDraft, createGoalDraft, createNoteDraft, createProfileDraft, createTxDraft,
  createLenderDraft, createFutureExpenseDraft, createRecurringDraft,
  generateId, getViewPeriodLabel, isFormValid, shiftMonth as getShiftedMonth,
} from '@/lib/expense-utils'
import type { GoalDraft, LenderDraft, FutureExpenseDraft, DashboardSearchItem, RecurringDraft } from '@/components/dashboard/types'
import { createClient } from '@/lib/supabase/client'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { formatLocalDate } from '@/lib/date-utils'

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useExpenseData() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [user, authLoading, router])

  // ── Persisted UI prefs ──────────────────────────────────────────────────────
  const [dark, setDark] = useLocalStorage('pref:dark', false)
  const [showBalance, setShowBalance] = useLocalStorage('pref:showBalance', true)
  const [hideAccountAmounts, setHideAccountAmounts] = useLocalStorage('pref:hideAccountAmounts', false)
  const [hideLenderAmounts, setHideLenderAmounts] = useLocalStorage('pref:hideLenderAmounts', false)
  const [collapsed, setCollapsed] = useLocalStorage<Record<string, boolean>>('pref:collapsed', {})
  const [excludedAccounts, setExcludedAccounts] = useLocalStorage<string[]>('pref:excludedAccounts', [])
  const [excludedLenders, setExcludedLenders] = useLocalStorage<string[]>('pref:excludedLenders', [])
  const [hiddenLenders, setHiddenLenders] = useLocalStorage<string[]>('pref:hiddenLenders', [])

  const toggleCollapse = useCallback((key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [setCollapsed])

  const toggleExcludeAccount = useCallback((id: string) => {
    setExcludedAccounts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }, [setExcludedAccounts])

  const toggleExcludeLender = useCallback((id: string) => {
    setExcludedLenders((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }, [setExcludedLenders])

  const toggleHideLender = useCallback((id: string) => {
    setHiddenLenders((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }, [setHiddenLenders])

  // ── UI state ────────────────────────────────────────────────────────────────
  const [active, setActive] = useLocalStorage('pref:activeTab', 'Home')
  const [dataLoading, setDataLoading] = useState(true)
  const [actionError, setActionError] = useState('')
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth())
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear())
  const [showMonthPicker, setShowMonthPicker] = useState(false)

  // ── Panel visibility ────────────────────────────────────────────────────────
  const [showNotifications, setShowNotifications] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showCategoryDetails, setShowCategoryDetails] = useState(false)
  const [showSpendingFlow, setShowSpendingFlow] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  // ── Dialog state ────────────────────────────────────────────────────────────
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [noteDraft, setNoteDraft] = useState(() => createNoteDraft())

  const [showAccountDialog, setShowAccountDialog] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [accountDraft, setAccountDraft] = useState(() => createAccountDraft())

  const [showTxDialog, setShowTxDialog] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [txDraft, setTxDraft] = useState(() => createTxDraft())

  const [showLenderDialog, setShowLenderDialog] = useState(false)
  const [editingLender, setEditingLender] = useState<Lender | null>(null)
  const [lenderDraft, setLenderDraft] = useState<LenderDraft>(() => createLenderDraft())

  const [showFutureExpenseDialog, setShowFutureExpenseDialog] = useState(false)
  const [editingFutureExpense, setEditingFutureExpense] = useState<FutureExpense | null>(null)
  const [futureExpenseDraft, setFutureExpenseDraft] = useState<FutureExpenseDraft>(() => createFutureExpenseDraft())

  // ── Plain notes state ──────────────────────────────────────────────────────────────
  const [plainNotes, setPlainNotes] = useState<PlainNote[]>([])

  // ── Buy list state ─────────────────────────────────────────────────────────
  const [buyListItems, setBuyListItems] = useState<BuyListItem[]>([])
  const [purchaseItem, setPurchaseItem] = useState<BuyListItem | null>(null)
  const [futureExpenseToPay, setFutureExpenseToPay] = useState<FutureExpense | null>(null)

  const [goalDraft, setGoalDraft] = useState<GoalDraft>(() => createGoalDraft())
  const [profileDraft, setProfileDraft] = useState(() => createProfileDraft())
  const [savingProfile, setSavingProfile] = useState(false)

  // ── Remote data ─────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<{ name: string; initials: string } | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [goal, setGoal] = useState<SavingsGoal | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [lenders, setLenders] = useState<Lender[]>([])
  const [futureExpenses, setFutureExpenses] = useState<FutureExpense[]>([])
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([])
  const [monthlyBudgets, setMonthlyBudgets] = useState<MonthlyBudget[]>([])
  const [preferredAccountId, setPreferredAccountId] = useLocalStorage('pref:lastAccountId', '')
  const [showRecurringDialog, setShowRecurringDialog] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null)
  const [recurringDraft, setRecurringDraft] = useState<RecurringDraft>(() => createRecurringDraft())

  // ── Load all data ───────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!user) return
    setDataLoading(true)
    try {
      const [p, a, t, n, g, notifs, lnds, fe, pn, bl, recurring] = await Promise.all([
        getProfile(user.id),
        getAccounts(user.id),
        getTransactions(user.id),
        getNotes(user.id),
        getSavingsGoal(user.id),
        getNotifications(user.id),
        getLenders(user.id),
        getFutureExpenses(user.id),
        getPlainNotes(user.id),
        getBuyListItems(user.id),
        getRecurringTransactions(user.id),
      ])
      setProfile(p)
      setAccounts(a)
      if (a.some((acc) => acc.annual_interest > 0)) {
        await applyDailyInterest(a)
        const refreshed = await getAccounts(user.id)
        setAccounts(refreshed)
      }
      setTransactions(t)
      setNotes(n)
      setGoal(g)
      setNotifications(notifs)
      setLenders(lnds)
      setFutureExpenses(fe)
      setPlainNotes(pn)
      setBuyListItems(bl)
      setRecurringTransactions(recurring)
      if (p) setProfileDraft(createProfileDraft(p))
      if (g) setGoalDraft(createGoalDraft(g))
    } catch (err) {
      console.error('[loadData]', err)
      setActionError('Could not load your financial data. Check your connection and Supabase setup, then try again.')
    } finally {
      setDataLoading(false)
    }
  }, [user])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (!user) return
    const monthStart = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-01`
    getMonthlyBudgets(user.id, monthStart)
      .then(setMonthlyBudgets)
      .catch((err) => {
        console.error('[getMonthlyBudgets]', err)
        setActionError('Could not load category budgets. Please try again.')
      })
  }, [user, viewMonth, viewYear])

  // ── Targeted refresh helpers ────────────────────────────────────────────────
  const refreshNotes = useCallback(async () => { if (user) setNotes(await getNotes(user.id)) }, [user])
  const refreshPlainNotes = useCallback(async () => { if (user) setPlainNotes(await getPlainNotes(user.id)) }, [user])
  const refreshBuyList = useCallback(async () => { if (user) setBuyListItems(await getBuyListItems(user.id)) }, [user])
  const refreshRecurringTransactions = useCallback(async () => {
    if (user) setRecurringTransactions(await getRecurringTransactions(user.id))
  }, [user])
  const refreshAccounts = useCallback(async () => {
    if (!user) return
    const a = await getAccounts(user.id)
    setAccounts(a)
    if (a.some((acc) => acc.annual_interest > 0)) {
      await applyDailyInterest(a)
      setAccounts(await getAccounts(user.id))
    }
  }, [user])
  const refreshTransactions = useCallback(async () => { if (user) setTransactions(await getTransactions(user.id)) }, [user])
  const refreshLenders = useCallback(async () => { if (user) setLenders(await getLenders(user.id)) }, [user])
  const refreshFutureExpenses = useCallback(async () => { if (user) setFutureExpenses(await getFutureExpenses(user.id)) }, [user])

  // ── Realtime subscriptions ──────────────────────────────────────────────────
  // Each table gets its own targeted refresh. Sort-order updates are debounced
  // so N rapid drag events collapse into a single fetch.
  const notesSortTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const plainSortTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const buySortTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` }, () => refreshTransactions())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts', filter: `user_id=eq.${user.id}` }, () => refreshAccounts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `user_id=eq.${user.id}` }, () => {
        if (notesSortTimer.current) clearTimeout(notesSortTimer.current)
        notesSortTimer.current = setTimeout(() => refreshNotes(), 600)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lenders', filter: `user_id=eq.${user.id}` }, () => refreshLenders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'future_expenses', filter: `user_id=eq.${user.id}` }, () => refreshFutureExpenses())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plain_notes', filter: `user_id=eq.${user.id}` }, () => {
        if (plainSortTimer.current) clearTimeout(plainSortTimer.current)
        plainSortTimer.current = setTimeout(() => refreshPlainNotes(), 600)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'buy_list_items', filter: `user_id=eq.${user.id}` }, () => {
        if (buySortTimer.current) clearTimeout(buySortTimer.current)
        buySortTimer.current = setTimeout(() => refreshBuyList(), 600)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recurring_transactions', filter: `user_id=eq.${user.id}` }, () => refreshRecurringTransactions())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_budgets', filter: `user_id=eq.${user.id}` }, () => {
        const monthStart = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-01`
        getMonthlyBudgets(user.id, monthStart).then(setMonthlyBudgets).catch((err) => console.error('[refreshBudgets]', err))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, viewMonth, viewYear, refreshTransactions, refreshAccounts, refreshNotes, refreshLenders, refreshFutureExpenses, refreshPlainNotes, refreshBuyList, refreshRecurringTransactions])

  // ── Derived values ──────────────────────────────────────────────────────────
  const stats = calcStats(transactions, viewMonth, viewYear)
  const chart = buildChartPaths(transactions, viewMonth, viewYear)
  const totalLent = lenders.reduce((sum, l) => sum + l.amount, 0)
  const totalFutureExpenses = futureExpenses.filter((f) => !f.paid_at).reduce((sum, f) => sum + f.amount, 0)
  const vaultAccounts = accounts.filter((a) => a.is_vault)
  const vaultTotal = vaultAccounts.reduce((sum, a) => sum + a.balance, 0)
  const hiddenVaultTotal = vaultAccounts.filter((a) => a.vault_hidden).reduce((sum, a) => sum + a.balance, 0)
  const hiddenLendersTotal = lenders.filter((l) => hiddenLenders.includes(l.id)).reduce((sum, l) => sum + l.amount, 0)
  const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0) + totalLent - hiddenVaultTotal - hiddenLendersTotal
  const spendableLent = lenders.filter((lender) => !excludedLenders.includes(lender.id)).reduce((sum, lender) => sum + lender.amount, 0)
  const spendableWorth = accounts.filter((a) => !excludedAccounts.includes(a.id) && !(a.is_vault && a.vault_hidden)).reduce((sum, a) => sum + a.balance, 0) + spendableLent
  const netAfterFuture = netWorth - totalFutureExpenses
  const spendableAfterFuture = spendableWorth - totalFutureExpenses
  const goalPercent = goal ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100)) : 0
  const unreadCount = notifications.filter((n) => !n.read).length
  const viewPeriodLabel = getViewPeriodLabel(viewYear, viewMonth)

  // ── Month navigation ────────────────────────────────────────────────────────
  const shiftMonth = useCallback((dir: 1 | -1) => {
    setViewMonth((m) => {
      const shifted = getShiftedMonth(m, viewYear, dir)
      if (shifted.year !== viewYear) setViewYear((year) => year + dir)
      return shifted.month
    })
  }, [viewYear])

  const pickMonth = useCallback((m: number) => {
    setViewMonth(m)
    setShowMonthPicker(false)
  }, [])

  const setViewPeriod = useCallback((month: number, year: number) => {
    setViewMonth(month)
    setViewYear(year)
    setShowMonthPicker(false)
  }, [])

  // ── Notes CRUD ──────────────────────────────────────────────────────────────
  const openNote = useCallback((note?: Note) => {
    setEditingNote(note ?? null)
    setNoteDraft(createNoteDraft(note))
    setShowNoteDialog(true)
  }, [])

  const closeNote = useCallback(() => {
    setShowNoteDialog(false)
    setEditingNote(null)
  }, [])

  const saveNote = useCallback(async () => {
    const amount = Number(noteDraft.amount)
    const maxAmount = noteDraft.amount_max.trim() ? Number(noteDraft.amount_max) : null
    if (!user || !isFormValid(noteDraft, ['title', 'amount', 'due_date'])) return
    if (!Number.isFinite(amount) || amount <= 0 || (maxAmount !== null && (!Number.isFinite(maxAmount) || maxAmount < amount))) {
      setActionError('Enter a positive minimum amount and a maximum amount no lower than the minimum.')
      return
    }
    try {
      const saved = await upsertNote({
        id: editingNote?.id ?? generateId(),
        user_id: user.id,
        title: noteDraft.title,
        amount,
        amount_max: maxAmount,
        due_date: noteDraft.due_date,
        category: noteDraft.category,
        updated_at: new Date().toISOString(),
        sort_order: editingNote?.sort_order ?? notes.length,
      })
      setNotes((prev) =>
        editingNote ? prev.map((x) => x.id === saved.id ? saved : x) : [...prev, saved]
      )
      closeNote()
    } catch (err) {
      console.error('[saveNote]', err)
      setActionError('Could not save this note. Please try again.')
    }
  }, [noteDraft, editingNote, user, closeNote, notes.length])

  const removeNote = useCallback(async (id: string) => {
    try {
      await deleteNote(id)
      setNotes((prev) => prev.filter((x) => x.id !== id))
    } catch (err) {
      console.error('[removeNote]', err)
      setActionError('Could not delete this note. Please try again.')
    }
  }, [])

  // ── Accounts CRUD ───────────────────────────────────────────────────────────
  const openAccount = useCallback((account?: Account) => {
    setActionError('')
    setEditingAccount(account ?? null)
    setAccountDraft(createAccountDraft(account))
    setShowAccountDialog(true)
  }, [])

  const closeAccount = useCallback(() => {
    setShowAccountDialog(false)
    setEditingAccount(null)
  }, [])

  const saveAccount = useCallback(async () => {
    if (!user || !isFormValid(accountDraft, ['name', 'balance'])) return
    const balance = Number(accountDraft.balance)
    const annualInterest = Number(accountDraft.annual_interest || 0)
    if (!Number.isFinite(balance) || !Number.isFinite(annualInterest) || annualInterest < 0) {
      setActionError('Enter a valid account balance and a non-negative interest rate.')
      return
    }
    try {
      const saved = await upsertAccount({
        id: editingAccount?.id ?? generateId(),
        user_id: user.id,
        name: accountDraft.name,
        purpose: accountDraft.purpose,
        balance,
        balance_as_of: editingAccount?.balance_as_of ?? formatLocalDate(),
        tone: accountDraft.tone,
        symbol: accountDraft.symbol,
        annual_interest: annualInterest,
        is_vault: accountDraft.is_vault,
        vault_hidden: editingAccount?.vault_hidden ?? false,
        last_interest_applied_at: editingAccount?.last_interest_applied_at ?? null,
      })
      setAccounts((prev) =>
        editingAccount ? prev.map((x) => x.id === saved.id ? saved : x) : [...prev, saved]
      )
      closeAccount()
    } catch (err) {
      console.error('[saveAccount]', err)
      setActionError('Could not save this account. Please try again.')
    }
  }, [accountDraft, editingAccount, user, closeAccount])

  const removeAccount = useCallback(async (id: string) => {
    const account = accounts.find((item) => item.id === id)
    if (account && !window.confirm(`Delete ${account.name}? Its existing transactions will remain, but will no longer be linked to the account.`)) return
    try {
      await deleteAccount(id)
      setAccounts((prev) => prev.filter((x) => x.id !== id))
    } catch (err) {
      console.error('[removeAccount]', err)
      setActionError('Could not delete this account. Please try again.')
    }
  }, [accounts])

  // ── Transactions ────────────────────────────────────────────────────────────
  const openTx = useCallback((type: 'income' | 'expense' | 'transfer' = 'expense', tx?: Transaction) => {
    setActionError('')
    setEditingTx(tx ?? null)
    const accountIds = [
      accounts.find((account) => account.id === preferredAccountId)?.id ?? accounts[0]?.id ?? '',
      accounts.find((account) => account.id !== (accounts.find((account) => account.id === preferredAccountId)?.id ?? accounts[0]?.id))?.id ?? '',
    ]
    setTxDraft(tx ? {
      type: tx.type,
      amount: String(tx.amount),
      category: tx.category,
      description: tx.description,
      date: tx.date,
      account_id: tx.account_id ?? '',
      transfer_to_account_id: tx.transfer_to_account_id ?? '',
    } : createTxDraft(type, accountIds))
    setShowTxDialog(true)
  }, [accounts, preferredAccountId])

  const saveTx = useCallback(async () => {
    const amount = Number(txDraft.amount)
    if (!user || !isFormValid(txDraft, ['amount'])) return
    if (!Number.isFinite(amount) || amount <= 0) {
      setActionError('Enter a transaction amount greater than zero.')
      return
    }
    if (txDraft.type === 'transfer' && (!txDraft.account_id || !txDraft.transfer_to_account_id || txDraft.account_id === txDraft.transfer_to_account_id)) {
      setActionError('Choose two different accounts for the transfer.')
      return
    }
    try {
      const saved = await saveTransaction({
        id: editingTx?.id ?? generateId(),
        user_id: user.id,
        type: txDraft.type,
        amount,
        category: txDraft.category,
        description: txDraft.description,
        date: txDraft.date,
        account_id: txDraft.account_id || null,
        transfer_to_account_id: txDraft.type === 'transfer' ? txDraft.transfer_to_account_id || null : null,
        buy_list_item_id: editingTx?.buy_list_item_id ?? null,
        recurring_id: editingTx?.recurring_id ?? null,
      })
      setTransactions((prev) => editingTx
        ? prev.map((transaction) => transaction.id === saved.id ? saved : transaction)
        : [saved, ...prev])
      if (txDraft.account_id) setPreferredAccountId(txDraft.account_id)
      if (editingTx?.type === 'transfer' || txDraft.type === 'transfer' || editingTx?.account_id !== saved.account_id) {
        await refreshAccounts()
      } else if (saved.account_id) {
        await refreshAccounts()
      }
      setShowTxDialog(false)
      setEditingTx(null)
    } catch (err) {
      console.error('[saveTx]', err)
      setActionError(err instanceof Error ? err.message : 'Could not save this transaction.')
    }
  }, [txDraft, editingTx, user, setPreferredAccountId, refreshAccounts])

  const removeTx = useCallback(async (id: string) => {
    try {
      const transaction = transactions.find((item) => item.id === id)
      await deleteTransaction(id)
      setTransactions((prev) => prev.filter((x) => x.id !== id))
      if (transaction?.buy_list_item_id) {
        setBuyListItems((prev) => prev.map((item) => item.id === transaction.buy_list_item_id
          ? { ...item, bought: false, bought_at: null }
          : item))
      }
      if (transaction) {
        setFutureExpenses((prev) => prev.map((expense) => expense.paid_transaction_id === transaction.id
          ? { ...expense, paid_at: null, paid_transaction_id: null }
          : expense))
      }
      await refreshAccounts()
    } catch (err) {
      console.error('[removeTx]', err)
      setActionError(err instanceof Error ? err.message : 'Could not delete this transaction.')
    }
  }, [transactions, futureExpenses, refreshAccounts])

  // ── Savings Goal ────────────────────────────────────────────────────────────
  const saveGoal = useCallback(async () => {
    if (!user || !isFormValid(goalDraft, ['title', 'current', 'target'])) return
    const currentAmount = Number(goalDraft.current)
    const targetAmount = Number(goalDraft.target)
    if (!Number.isFinite(currentAmount) || currentAmount < 0 || !Number.isFinite(targetAmount) || targetAmount <= 0) {
      setActionError('Enter a non-negative current amount and a target greater than zero.')
      return
    }
    try {
      const updated: SavingsGoal = {
        id: goal?.id ?? generateId(),
        user_id: user.id,
        title: goalDraft.title,
        current_amount: currentAmount,
        target_amount: targetAmount,
        updated_at: new Date().toISOString(),
      }
      await upsertSavingsGoal(updated)
      setGoal(updated)
    } catch (err) {
      console.error('[saveGoal]', err)
      setActionError('Could not save your savings goal. Please try again.')
    }
  }, [goalDraft, goal, user])

  // ── Profile ─────────────────────────────────────────────────────────────────
  const saveProfile = useCallback(async () => {
    if (!user || !isFormValid(profileDraft, ['name'])) return
    setSavingProfile(true)
    try {
      const updates = {
        name: profileDraft.name,
        initials: profileDraft.initials || profileDraft.name.slice(0, 2).toUpperCase(),
      }
      await updateProfile(user.id, updates)
      setProfile((prev) => ({ ...prev, ...updates }))
    } catch (err) {
      console.error('[saveProfile]', err)
      setActionError('Could not save your profile. Please try again.')
    } finally {
      setSavingProfile(false)
    }
  }, [profileDraft, user])

  // ── Lenders CRUD ────────────────────────────────────────────────────────────
  const openLender = useCallback((lender?: Lender) => {
    setEditingLender(lender ?? null)
    setLenderDraft(createLenderDraft(lender))
    setShowLenderDialog(true)
  }, [])

  const closeLender = useCallback(() => {
    setShowLenderDialog(false)
    setEditingLender(null)
  }, [])

  const saveLender = useCallback(async () => {
    if (!user || !isFormValid(lenderDraft, ['name', 'amount'])) return
    const amount = Number(lenderDraft.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setActionError('Enter an amount owed greater than zero.')
      return
    }
    try {
      const saved: Lender = {
        id: editingLender?.id ?? generateId(),
        user_id: user.id,
        name: lenderDraft.name,
        amount,
        note: lenderDraft.note,
        created_at: editingLender?.created_at ?? new Date().toISOString(),
      }
      await upsertLender(saved)
      setLenders((prev) =>
        editingLender ? prev.map((x) => x.id === saved.id ? saved : x) : [saved, ...prev]
      )
      closeLender()
    } catch (err) {
      console.error('[saveLender]', err)
      setActionError('Could not save this lender. Please try again.')
    }
  }, [lenderDraft, editingLender, user, closeLender])

  const removeLender = useCallback(async (id: string) => {
    try {
      await deleteLender(id)
      setLenders((prev) => prev.filter((x) => x.id !== id))
    } catch (err) {
      console.error('[removeLender]', err)
      setActionError('Could not delete this lender. Please try again.')
    }
  }, [])

  // ── Future Expenses CRUD ─────────────────────────────────────────────────────────
  const openFutureExpense = useCallback((item?: FutureExpense) => {
    setEditingFutureExpense(item ?? null)
    setFutureExpenseDraft(createFutureExpenseDraft(item))
    setShowFutureExpenseDialog(true)
  }, [])

  const closeFutureExpense = useCallback(() => {
    setShowFutureExpenseDialog(false)
    setEditingFutureExpense(null)
  }, [])

  const saveFutureExpense = useCallback(async () => {
    if (!user || !isFormValid(futureExpenseDraft, ['title', 'amount', 'due_date'])) return
    const amount = Number(futureExpenseDraft.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setActionError('Enter a planned expense amount greater than zero.')
      return
    }
    try {
      const saved: FutureExpense = {
        id: editingFutureExpense?.id ?? generateId(),
        user_id: user.id,
        title: futureExpenseDraft.title,
        amount,
        due_date: futureExpenseDraft.due_date,
        category: futureExpenseDraft.category,
        paid_at: editingFutureExpense?.paid_at ?? null,
        paid_transaction_id: editingFutureExpense?.paid_transaction_id ?? null,
        created_at: editingFutureExpense?.created_at ?? new Date().toISOString(),
      }
      await upsertFutureExpense(saved)
      setFutureExpenses((prev) =>
        editingFutureExpense ? prev.map((x) => x.id === saved.id ? saved : x) : [...prev, saved]
      )
      closeFutureExpense()
    } catch (err) {
      console.error('[saveFutureExpense]', err)
      setActionError('Could not save this planned expense. Please try again.')
    }
  }, [futureExpenseDraft, editingFutureExpense, user, closeFutureExpense])

  const removeFutureExpense = useCallback(async (id: string) => {
    const item = futureExpenses.find((expense) => expense.id === id)
    if (item?.paid_at) {
      setActionError('Paid planned expenses cannot be deleted from this list.')
      return
    }
    try {
      await deleteFutureExpense(id)
      setFutureExpenses((prev) => prev.filter((x) => x.id !== id))
    } catch (err) {
      console.error('[removeFutureExpense]', err)
      setActionError('Could not delete this planned expense. Please try again.')
    }
  }, [futureExpenses])

  const settleFutureExpenseAction = useCallback(async (id: string, amount: number, accountId: string | null) => {
    try {
      const transaction = await settleFutureExpense(id, amount, accountId)
      setTransactions((prev) => [transaction, ...prev])
      setFutureExpenses((prev) => prev.map((expense) => expense.id === id
        ? { ...expense, paid_at: new Date().toISOString(), paid_transaction_id: transaction.id }
        : expense))
      setFutureExpenseToPay(null)
      if (accountId) {
        setPreferredAccountId(accountId)
        await refreshAccounts()
      }
    } catch (err) {
      console.error('[settleFutureExpense]', err)
      setActionError(err instanceof Error ? err.message : 'Could not record this payment.')
      throw err
    }
  }, [refreshAccounts, setPreferredAccountId])

  // ── Buy List CRUD ───────────────────────────────────────────────────────────
  const addBuyListItem = useCallback(async (title: string, category: 'need' | 'want', price: number | null) => {
    if (!user || !title.trim()) return
    if (price !== null && (!Number.isFinite(price) || price <= 0)) {
      setActionError('Enter a valid price greater than zero.')
      return
    }
    try {
      const saved = await insertBuyListItem({ user_id: user.id, title, category, price, bought: false, bought_at: null, sort_order: buyListItems.length })
      setBuyListItems((prev) => [...prev, saved])
    } catch (err) {
      console.error('[addBuyListItem]', err)
      setActionError('Could not add this buy-list item. Please try again.')
    }
  }, [user, buyListItems.length])

  const toggleBuyListItem = useCallback(async (id: string, bought: boolean) => {
    try {
      if (bought) {
        await unpurchaseBuyListItem(id)
        setBuyListItems((prev) => prev.map((item) => item.id === id ? { ...item, bought: false, bought_at: null } : item))
        await refreshAccounts()
        await refreshTransactions()
      } else {
        const item = buyListItems.find((buyItem) => buyItem.id === id)
        if (item) setPurchaseItem(item)
      }
    } catch (err) {
      console.error('[toggleBuyListItem]', err)
      setActionError(err instanceof Error ? err.message : 'Could not update this buy-list item.')
    }
  }, [buyListItems, refreshAccounts, refreshTransactions])

  const saveBuyListPurchase = useCallback(async (amount: number, accountId: string | null) => {
    if (!purchaseItem) return
    try {
      const transaction = await purchaseBuyListItem(purchaseItem.id, amount, accountId)
      setBuyListItems((prev) => prev.map((item) => item.id === purchaseItem.id
        ? { ...item, bought: true, bought_at: new Date().toISOString() }
        : item))
      setTransactions((prev) => [transaction, ...prev])
      setPurchaseItem(null)
      if (accountId) {
        setPreferredAccountId(accountId)
        await refreshAccounts()
      }
    } catch (err) {
      console.error('[saveBuyListPurchase]', err)
      setActionError(err instanceof Error ? err.message : 'Could not record this purchase.')
      throw err
    }
  }, [purchaseItem, refreshAccounts, setPreferredAccountId])

  const editBuyListItem = useCallback(async (id: string, title: string, price: number | null, category: 'need' | 'want') => {
    try {
      await updateBuyListItem(id, { title, price, category })
      setBuyListItems((prev) => prev.map((x) => x.id === id ? { ...x, title, price, category } : x))
    } catch (err) {
      console.error('[editBuyListItem]', err)
      setActionError('Could not update this buy-list item. Please try again.')
    }
  }, [])

  const removeBuyListItem = useCallback(async (id: string) => {
    const item = buyListItems.find((buyItem) => buyItem.id === id)
    if (item && !window.confirm(item.bought
      ? 'Remove this item from the list? Its recorded transaction will remain in your history.'
      : 'Remove this item from your buy list?')) return
    try {
      await deleteBuyListItem(id)
      setBuyListItems((prev) => prev.filter((x) => x.id !== id))
    } catch (err) {
      console.error('[removeBuyListItem]', err)
      setActionError('Could not delete this buy-list item. Please try again.')
    }
  }, [buyListItems])

  const openRecurring = useCallback((rule?: RecurringTransaction) => {
    setActionError('')
    setEditingRecurring(rule ?? null)
    setRecurringDraft(createRecurringDraft(rule))
    setShowRecurringDialog(true)
  }, [])

  const closeRecurring = useCallback(() => {
    setShowRecurringDialog(false)
    setEditingRecurring(null)
  }, [])

  const saveRecurring = useCallback(async () => {
    if (!user || !isFormValid(recurringDraft, ['amount', 'category', 'next_date'])) return
    const amount = Number(recurringDraft.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setActionError('Enter a recurring amount greater than zero.')
      return
    }
    try {
      const saved = await upsertRecurringTransaction({
        id: editingRecurring?.id ?? generateId(),
        user_id: user.id,
        type: recurringDraft.type,
        amount,
        category: recurringDraft.category,
        description: recurringDraft.description,
        account_id: recurringDraft.account_id || null,
        frequency: recurringDraft.frequency,
        next_date: recurringDraft.next_date,
        active: true,
      })
      setRecurringTransactions((prev) => editingRecurring
        ? prev.map((rule) => rule.id === saved.id ? saved : rule)
        : [...prev, saved].sort((a, b) => a.next_date.localeCompare(b.next_date)))
      closeRecurring()
    } catch (err) {
      console.error('[saveRecurring]', err)
      setActionError(err instanceof Error ? err.message : 'Could not save this recurring reminder.')
    }
  }, [user, recurringDraft, editingRecurring, closeRecurring])

  const removeRecurring = useCallback(async (id: string) => {
    try {
      await deleteRecurringTransaction(id)
      setRecurringTransactions((prev) => prev.filter((rule) => rule.id !== id))
    } catch (err) {
      console.error('[removeRecurring]', err)
      setActionError('Could not delete this recurring reminder.')
    }
  }, [])

  const recordRecurring = useCallback(async (id: string) => {
    try {
      const transaction = await recordRecurringTransaction(id)
      setTransactions((prev) => [transaction, ...prev])
      await Promise.all([refreshRecurringTransactions(), refreshAccounts()])
    } catch (err) {
      console.error('[recordRecurring]', err)
      setActionError(err instanceof Error ? err.message : 'Could not record this recurring transaction.')
    }
  }, [refreshRecurringTransactions, refreshAccounts])

  const saveBudget = useCallback(async (category: string, amount: number) => {
    if (!user || !Number.isFinite(amount) || amount <= 0) throw new Error('Enter a budget greater than zero.')
    const monthStart = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-01`
    try {
      const saved = await upsertMonthlyBudget({
        id: monthlyBudgets.find((budget) => budget.category === category)?.id ?? generateId(),
        user_id: user.id,
        month_start: monthStart,
        category,
        amount,
      })
      setMonthlyBudgets((prev) => [
        ...prev.filter((budget) => budget.category !== category),
        saved,
      ].sort((a, b) => a.category.localeCompare(b.category)))
    } catch (err) {
      console.error('[saveBudget]', err)
      throw new Error('Could not save this budget. Please try again.')
    }
  }, [user, viewYear, viewMonth, monthlyBudgets])

  const removeBudget = useCallback(async (id: string) => {
    try {
      await deleteMonthlyBudget(id)
      setMonthlyBudgets((prev) => prev.filter((budget) => budget.id !== id))
    } catch (err) {
      console.error('[removeBudget]', err)
      setActionError('Could not delete this budget. Please try again.')
    }
  }, [])

  // ── Plain Notes CRUD ──────────────────────────────────────────────────────────────
  const savePlainNote = useCallback(async (id: string | null, title: string, body: string) => {
    if (!user) return
    try {
      const saved = await upsertPlainNote({
        id: id ?? generateId(),
        user_id: user.id,
        title,
        body,
        updated_at: new Date().toISOString(),
        sort_order: id ? plainNotes.find((note) => note.id === id)?.sort_order ?? plainNotes.length : plainNotes.length,
      })
      setPlainNotes((prev) =>
        id ? prev.map((x) => x.id === saved.id ? saved : x) : [...prev, saved]
      )
    } catch (err) {
      console.error('[savePlainNote]', err)
      setActionError('Could not save this note. Please try again.')
    }
  }, [user, plainNotes])

  const removePlainNote = useCallback(async (id: string) => {
    try {
      await deletePlainNote(id)
      setPlainNotes((prev) => prev.filter((x) => x.id !== id))
    } catch (err) {
      console.error('[removePlainNote]', err)
      setActionError('Could not delete this note. Please try again.')
    }
  }, [])

  // ── Reorder ─────────────────────────────────────────────────────────────────
  const reorderNotes = useCallback(async (reordered: Note[]) => {
    setNotes(reordered)
    try {
      await updateNotesSortOrder(reordered.map((n, i) => ({ id: n.id, sort_order: i })))
    } catch (err) {
      console.error('[reorderNotes]', err)
      setActionError('Could not save the note order.')
      await refreshNotes()
    }
  }, [refreshNotes])

  const reorderPlainNotes = useCallback(async (reordered: PlainNote[]) => {
    setPlainNotes(reordered)
    try {
      await updatePlainNotesSortOrder(reordered.map((n, i) => ({ id: n.id, sort_order: i })))
    } catch (err) {
      console.error('[reorderPlainNotes]', err)
      setActionError('Could not save the note order.')
      await refreshPlainNotes()
    }
  }, [refreshPlainNotes])

  const reorderBuyListItems = useCallback(async (reordered: BuyListItem[]) => {
    setBuyListItems(reordered)
    try {
      await updateBuyListSortOrder(reordered.map((n, i) => ({ id: n.id, sort_order: i })))
    } catch (err) {
      console.error('[reorderBuyListItems]', err)
      setActionError('Could not save the buy-list order.')
      await refreshBuyList()
    }
  }, [refreshBuyList])

  // ── Search items ────────────────────────────────────────────────────────────
  const searchItems: DashboardSearchItem[] = [
    ...accounts.map((a) => ({ id: a.id, type: 'account' as const, title: a.name, detail: a.purpose, searchText: `${a.balance} ${a.symbol}`, section: a.is_vault ? 'Vault' : 'Home' })),
    ...transactions.map((t) => ({ id: t.id, type: 'transaction' as const, title: t.description || t.category, detail: `${t.type} · ${t.date}`, searchText: `${t.category} ${t.amount}`, date: t.date })),
    ...notes.map((n) => ({ id: n.id, type: 'financialNote' as const, title: n.title, detail: `${n.category} · due ${n.due_date}`, searchText: `${n.amount} ${n.amount_max ?? ''}` })),
    ...lenders.map((l) => ({ id: l.id, type: 'lender' as const, title: l.name, detail: l.note || 'lender', searchText: String(l.amount) })),
    ...futureExpenses.map((f) => ({ id: f.id, type: 'futureExpense' as const, title: f.title, detail: `${f.category} · due ${f.due_date}`, searchText: String(f.amount) })),
    ...plainNotes.map((p) => ({ id: p.id, type: 'plainNote' as const, title: p.title, detail: p.body.slice(0, 40), searchText: p.body })),
    ...buyListItems.map((b) => ({ id: b.id, type: 'buyListItem' as const, title: b.title, detail: b.category, searchText: `${b.category} ${b.price ?? ''}` })),
    ...(goal ? [{ id: goal.id, type: 'goal' as const, title: goal.title, detail: `${goalPercent}% of target`, searchText: `${goal.current_amount} ${goal.target_amount}` }] : []),
  ]

  // ── Vault visibility toggle ──────────────────────────────────────────────────────────────
  const toggleVaultHidden = useCallback(async (id: string, currentHidden: boolean) => {
    try {
      await updateAccountVaultVisibility(id, !currentHidden)
      setAccounts((prev) => prev.map((a) => a.id === id ? { ...a, vault_hidden: !currentHidden } : a))
    } catch (err) {
      console.error('[toggleVaultHidden]', err)
      setActionError('Could not update vault visibility.')
    }
  }, [])

  // ── Notifications ───────────────────────────────────────────────────────────
  const handleMarkRead = useCallback(async () => {
    if (!user) return
    try {
      await markNotificationsRead(user.id)
      setNotifications((prev) => prev.map((x) => ({ ...x, read: true })))
    } catch (err) {
      console.error('[handleMarkRead]', err)
      setActionError('Could not mark notifications as read.')
    }
  }, [user])

  return {
    // auth
    user, authLoading, signOut,
    // ui
    active, setActive,
    dark, setDark,
    showBalance, setShowBalance,
    dataLoading,
    actionError, setActionError,
    // month
    viewMonth, viewYear, viewPeriodLabel,
    showMonthPicker, setShowMonthPicker,
    shiftMonth, pickMonth, setViewPeriod,
    // panels
    showNotifications, setShowNotifications,
    showHelp, setShowHelp,
    showCategoryDetails, setShowCategoryDetails,
    showSpendingFlow, setShowSpendingFlow,
    showAdd, setShowAdd,
    // notes
    showNoteDialog, noteDraft, setNoteDraft, editingNote,
    openNote, closeNote, saveNote, removeNote, reorderNotes,
    // account dialog
    showAccountDialog, accountDraft, setAccountDraft, editingAccount,
    openAccount, closeAccount, saveAccount, removeAccount,
    // tx dialog
    showTxDialog, setShowTxDialog, txDraft, setTxDraft, editingTx,
    openTx, saveTx, removeTx,
    // goal
    goalDraft, setGoalDraft, saveGoal,
    // profile
    profileDraft, setProfileDraft, savingProfile, saveProfile,
    // notifications
    handleMarkRead,
    // data
    profile, accounts, transactions, notes, goal, notifications,
    // derived
    stats, chart, netWorth, netAfterFuture, spendableWorth, spendableAfterFuture, goalPercent, unreadCount,
    // ui prefs
    hideAccountAmounts, setHideAccountAmounts,
    preferredAccountId,
    hideLenderAmounts, setHideLenderAmounts,
    collapsed, toggleCollapse,
    excludedAccounts, toggleExcludeAccount, excludedLenders, toggleExcludeLender,
    hiddenLenders, toggleHideLender, hiddenLendersTotal,
    // lenders
    lenders, totalLent,
    showLenderDialog, lenderDraft, setLenderDraft, editingLender,
    openLender, closeLender, saveLender, removeLender,
    // future expenses
    futureExpenses, totalFutureExpenses,
    showFutureExpenseDialog, futureExpenseDraft, setFutureExpenseDraft, editingFutureExpense,
    openFutureExpense, closeFutureExpense, saveFutureExpense, removeFutureExpense,
    futureExpenseToPay, setFutureExpenseToPay, settleFutureExpenseAction,
    // plain notes
    plainNotes, savePlainNote, removePlainNote, reorderPlainNotes,
    // buy list
    buyListItems, addBuyListItem, toggleBuyListItem, editBuyListItem, removeBuyListItem, reorderBuyListItems,
    purchaseItem, setPurchaseItem, saveBuyListPurchase,
    // recurring reminders
    recurringTransactions, showRecurringDialog, editingRecurring, recurringDraft, setRecurringDraft,
    openRecurring, closeRecurring, saveRecurring, removeRecurring, recordRecurring,
    // monthly budgets
    monthlyBudgets, saveBudget, removeBudget,
    // vault
    vaultAccounts, vaultTotal, hiddenVaultTotal, toggleVaultHidden,
    // search
    searchItems,
    // reload
    loadData,
  }
}

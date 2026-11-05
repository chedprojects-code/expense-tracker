import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  getProfile, getAccounts, getTransactions, getNotes, getSavingsGoal,
  getNotifications, markNotificationsRead,
  upsertNote, deleteNote,
  upsertAccount, deleteAccount, updateAccountVaultVisibility,
  upsertSavingsGoal, insertTransaction, updateTransaction, deleteTransaction, updateProfile,
  getLenders, upsertLender, deleteLender,
  getFutureExpenses, upsertFutureExpense, deleteFutureExpense,
  getPlainNotes, upsertPlainNote, deletePlainNote,
  getBuyListItems, insertBuyListItem, updateBuyListItem, deleteBuyListItem,
  calcStats, buildChartPaths,
  applyDailyInterest,
  type Account, type Note, type SavingsGoal, type Transaction, type Notification, type Lender, type FutureExpense, type PlainNote, type BuyListItem,
} from '@/lib/supabase/db'
import {
  createAccountDraft, createGoalDraft, createNoteDraft, createProfileDraft, createTxDraft,
  createLenderDraft, createFutureExpenseDraft,
  generateId, getViewPeriodLabel, isFormValid, shiftMonth as getShiftedMonth,
} from '@/lib/expense-utils'
import type { GoalDraft, LenderDraft, FutureExpenseDraft } from '@/components/dashboard/types'
import { createClient } from '@/lib/supabase/client'
import { useLocalStorage } from '@/hooks/useLocalStorage'

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
  const [active, setActive] = useState('Home')
  const [dataLoading, setDataLoading] = useState(true)
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

  // ── Load all data ───────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!user) return
    setDataLoading(true)
    try {
      const [p, a, t, n, g, notifs, lnds, fe, pn, bl] = await Promise.all([
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
      if (p) setProfileDraft(createProfileDraft(p))
      if (g) setGoalDraft(createGoalDraft(g))
    } catch (err) {
      console.error('[loadData]', err)
    } finally {
      setDataLoading(false)
    }
  }, [user])

  useEffect(() => { loadData() }, [loadData])

  // ── Realtime subscriptions ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts', filter: `user_id=eq.${user.id}` }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `user_id=eq.${user.id}` }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lenders', filter: `user_id=eq.${user.id}` }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'future_expenses', filter: `user_id=eq.${user.id}` }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plain_notes', filter: `user_id=eq.${user.id}` }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'buy_list_items', filter: `user_id=eq.${user.id}` }, () => loadData())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, loadData])

  // ── Derived values ──────────────────────────────────────────────────────────
  const stats = calcStats(transactions, viewMonth, viewYear)
  const chart = buildChartPaths(transactions, viewMonth, viewYear)
  const totalLent = lenders.reduce((sum, l) => sum + l.amount, 0)
  const totalFutureExpenses = futureExpenses.reduce((sum, f) => sum + f.amount, 0)
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
    if (!user || !isFormValid(noteDraft, ['title', 'amount', 'due_date'])) return
    try {
      await upsertNote({
        id: editingNote?.id ?? generateId(),
        user_id: user.id,
        title: noteDraft.title,
        amount: parseFloat(noteDraft.amount),
        amount_max: noteDraft.amount_max.trim() ? parseFloat(noteDraft.amount_max) : null,
        due_date: noteDraft.due_date,
        category: noteDraft.category,
        updated_at: new Date().toISOString(),
      })
      closeNote()
      await loadData()
    } catch (err) {
      console.error('[saveNote]', err)
    }
  }, [noteDraft, editingNote, user, closeNote, loadData])

  const removeNote = useCallback(async (id: string) => {
    try {
      await deleteNote(id)
      setNotes((prev) => prev.filter((x) => x.id !== id))
    } catch (err) {
      console.error('[removeNote]', err)
    }
  }, [])

  // ── Accounts CRUD ───────────────────────────────────────────────────────────
  const openAccount = useCallback((account?: Account) => {
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
    try {
      await upsertAccount({
        id: editingAccount?.id ?? generateId(),
        user_id: user.id,
        name: accountDraft.name,
        purpose: accountDraft.purpose,
        balance: parseFloat(accountDraft.balance),
        tone: accountDraft.tone,
        symbol: accountDraft.symbol,
        annual_interest: parseFloat(accountDraft.annual_interest) || 0,
        is_vault: accountDraft.is_vault,
        vault_hidden: editingAccount?.vault_hidden ?? false,
        last_interest_applied_at: editingAccount?.last_interest_applied_at ?? null,
      })
      closeAccount()
      await loadData()
    } catch (err) {
      console.error('[saveAccount]', err)
    }
  }, [accountDraft, editingAccount, user, closeAccount, loadData])

  const removeAccount = useCallback(async (id: string) => {
    try {
      await deleteAccount(id)
      setAccounts((prev) => prev.filter((x) => x.id !== id))
    } catch (err) {
      console.error('[removeAccount]', err)
    }
  }, [])

  // ── Transactions ────────────────────────────────────────────────────────────
  const openTx = useCallback((type: 'income' | 'expense' = 'expense', tx?: Transaction) => {
    setEditingTx(tx ?? null)
    setTxDraft(tx ? { type: tx.type, amount: String(tx.amount), category: tx.category, description: tx.description, date: tx.date } : createTxDraft(type))
    setShowTxDialog(true)
  }, [])

  const saveTx = useCallback(async () => {
    if (!user || !isFormValid(txDraft, ['amount'])) return
    try {
      if (editingTx) {
        await updateTransaction(editingTx.id, {
          type: txDraft.type,
          amount: parseFloat(txDraft.amount),
          category: txDraft.category,
          description: txDraft.description,
          date: txDraft.date,
        })
      } else {
        await insertTransaction({
          user_id: user.id,
          type: txDraft.type,
          amount: parseFloat(txDraft.amount),
          category: txDraft.category,
          description: txDraft.description,
          date: txDraft.date,
        })
      }
      setShowTxDialog(false)
      setEditingTx(null)
      await loadData()
    } catch (err) {
      console.error('[saveTx]', err)
    }
  }, [txDraft, editingTx, user, loadData])

  const removeTx = useCallback(async (id: string) => {
    try {
      await deleteTransaction(id)
      setTransactions((prev) => prev.filter((x) => x.id !== id))
    } catch (err) {
      console.error('[removeTx]', err)
    }
  }, [])

  // ── Savings Goal ────────────────────────────────────────────────────────────
  const saveGoal = useCallback(async () => {
    if (!user || !isFormValid(goalDraft, ['title', 'current', 'target'])) return
    try {
      await upsertSavingsGoal({
        id: goal?.id ?? generateId(),
        user_id: user.id,
        title: goalDraft.title,
        current_amount: parseFloat(goalDraft.current),
        target_amount: parseFloat(goalDraft.target),
      })
      await loadData()
    } catch (err) {
      console.error('[saveGoal]', err)
    }
  }, [goalDraft, goal, user, loadData])

  // ── Profile ─────────────────────────────────────────────────────────────────
  const saveProfile = useCallback(async () => {
    if (!user || !isFormValid(profileDraft, ['name'])) return
    setSavingProfile(true)
    try {
      await updateProfile(user.id, {
        name: profileDraft.name,
        initials: profileDraft.initials || profileDraft.name.slice(0, 2).toUpperCase(),
      })
      await loadData()
    } catch (err) {
      console.error('[saveProfile]', err)
    } finally {
      setSavingProfile(false)
    }
  }, [profileDraft, user, loadData])

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
    try {
      await upsertLender({
        id: editingLender?.id ?? generateId(),
        user_id: user.id,
        name: lenderDraft.name,
        amount: parseFloat(lenderDraft.amount),
        note: lenderDraft.note,
      })
      closeLender()
      await loadData()
    } catch (err) {
      console.error('[saveLender]', err)
    }
  }, [lenderDraft, editingLender, user, closeLender, loadData])

  const removeLender = useCallback(async (id: string) => {
    try {
      await deleteLender(id)
      setLenders((prev) => prev.filter((x) => x.id !== id))
    } catch (err) {
      console.error('[removeLender]', err)
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
    try {
      await upsertFutureExpense({
        id: editingFutureExpense?.id ?? generateId(),
        user_id: user.id,
        title: futureExpenseDraft.title,
        amount: parseFloat(futureExpenseDraft.amount),
        due_date: futureExpenseDraft.due_date,
        category: futureExpenseDraft.category,
      })
      closeFutureExpense()
      await loadData()
    } catch (err) {
      console.error('[saveFutureExpense]', err)
    }
  }, [futureExpenseDraft, editingFutureExpense, user, closeFutureExpense, loadData])

  const removeFutureExpense = useCallback(async (id: string) => {
    try {
      await deleteFutureExpense(id)
      setFutureExpenses((prev) => prev.filter((x) => x.id !== id))
    } catch (err) {
      console.error('[removeFutureExpense]', err)
    }
  }, [])

  // ── Buy List CRUD ───────────────────────────────────────────────────────────
  const addBuyListItem = useCallback(async (title: string, category: 'need' | 'want', price: number | null) => {
    if (!user || !title.trim()) return
    try {
      await insertBuyListItem({ user_id: user.id, title, category, price, bought: false })
      await loadData()
    } catch (err) {
      console.error('[addBuyListItem]', err)
    }
  }, [user, loadData])

  const toggleBuyListItem = useCallback(async (id: string, bought: boolean) => {
    try {
      await updateBuyListItem(id, { bought: !bought })
      setBuyListItems((prev) => prev.map((x) => x.id === id ? { ...x, bought: !bought } : x))
    } catch (err) {
      console.error('[toggleBuyListItem]', err)
    }
  }, [])

  const editBuyListItem = useCallback(async (id: string, title: string, price: number | null, category: 'need' | 'want') => {
    try {
      await updateBuyListItem(id, { title, price, category })
      setBuyListItems((prev) => prev.map((x) => x.id === id ? { ...x, title, price, category } : x))
    } catch (err) {
      console.error('[editBuyListItem]', err)
    }
  }, [])

  const removeBuyListItem = useCallback(async (id: string) => {
    try {
      await deleteBuyListItem(id)
      setBuyListItems((prev) => prev.filter((x) => x.id !== id))
    } catch (err) {
      console.error('[removeBuyListItem]', err)
    }
  }, [])

  // ── Plain Notes CRUD ──────────────────────────────────────────────────────────────
  const savePlainNote = useCallback(async (id: string | null, title: string, body: string) => {
    if (!user) return
    try {
      await upsertPlainNote({ id: id ?? generateId(), user_id: user.id, title, body, updated_at: new Date().toISOString() })
      await loadData()
    } catch (err) {
      console.error('[savePlainNote]', err)
    }
  }, [user, loadData])

  const removePlainNote = useCallback(async (id: string) => {
    try {
      await deletePlainNote(id)
      setPlainNotes((prev) => prev.filter((x) => x.id !== id))
    } catch (err) {
      console.error('[removePlainNote]', err)
    }
  }, [])

  // ── Vault visibility toggle ──────────────────────────────────────────────────────────────
  const toggleVaultHidden = useCallback(async (id: string, currentHidden: boolean) => {
    try {
      await updateAccountVaultVisibility(id, !currentHidden)
      setAccounts((prev) => prev.map((a) => a.id === id ? { ...a, vault_hidden: !currentHidden } : a))
    } catch (err) {
      console.error('[toggleVaultHidden]', err)
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
    // month
    viewMonth, viewYear, viewPeriodLabel,
    showMonthPicker, setShowMonthPicker,
    shiftMonth, pickMonth,
    // panels
    showNotifications, setShowNotifications,
    showHelp, setShowHelp,
    showCategoryDetails, setShowCategoryDetails,
    showSpendingFlow, setShowSpendingFlow,
    showAdd, setShowAdd,
    // note dialog
    showNoteDialog, noteDraft, setNoteDraft, editingNote,
    openNote, closeNote, saveNote, removeNote,
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
    // plain notes
    plainNotes, savePlainNote, removePlainNote,
    // buy list
    buyListItems, addBuyListItem, toggleBuyListItem, editBuyListItem, removeBuyListItem,
    // vault
    vaultAccounts, vaultTotal, hiddenVaultTotal, toggleVaultHidden,
    // reload
    loadData,
  }
}

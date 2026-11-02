import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  getProfile, getAccounts, getTransactions, getNotes, getSavingsGoal,
  getNotifications, markNotificationsRead,
  upsertNote, deleteNote,
  upsertAccount, deleteAccount,
  upsertSavingsGoal, insertTransaction, updateTransaction, deleteTransaction, updateProfile,
  getLenders, upsertLender, deleteLender,
  calcStats, buildChartPaths,
  type Account, type Note, type SavingsGoal, type Transaction, type Notification, type Lender,
} from '@/lib/supabase/db'
import {
  createAccountDraft, createGoalDraft, createNoteDraft, createProfileDraft, createTxDraft,
  createLenderDraft,
  generateId, getViewPeriodLabel, isFormValid, shiftMonth as getShiftedMonth,
} from '@/lib/expense-utils'
import type { GoalDraft, LenderDraft } from '@/components/dashboard/types'
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
  const [collapsed, setCollapsed] = useLocalStorage<Record<string, boolean>>('pref:collapsed', {})

  const toggleCollapse = useCallback((key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [setCollapsed])

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

  // ── Load all data ───────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!user) return
    setDataLoading(true)
    try {
      const [p, a, t, n, g, notifs, lnds] = await Promise.all([
        getProfile(user.id),
        getAccounts(user.id),
        getTransactions(user.id),
        getNotes(user.id),
        getSavingsGoal(user.id),
        getNotifications(user.id),
        getLenders(user.id),
      ])
      setProfile(p)
      setAccounts(a)
      setTransactions(t)
      setNotes(n)
      setGoal(g)
      setNotifications(notifs)
      setLenders(lnds)
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
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, loadData])

  // ── Derived values ──────────────────────────────────────────────────────────
  const stats = calcStats(transactions, viewMonth, viewYear)
  const chart = buildChartPaths(transactions, viewMonth, viewYear)
  const totalLent = lenders.reduce((sum, l) => sum + l.amount, 0)
  const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0) + totalLent
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
    hideAccountAmounts, setHideAccountAmounts,
    collapsed, toggleCollapse,
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
    stats, chart, netWorth, goalPercent, unreadCount,
    // lenders
    lenders, totalLent,
    showLenderDialog, lenderDraft, setLenderDraft, editingLender,
    openLender, closeLender, saveLender, removeLender,
    // reload
    loadData,
  }
}

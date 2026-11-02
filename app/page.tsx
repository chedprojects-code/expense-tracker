'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  getProfile, getAccounts, getTransactions, getNotes, getSavingsGoal,
  getNotifications, markNotificationsRead,
  upsertNote, deleteNote, upsertAccount, deleteAccount,
  upsertSavingsGoal, insertTransaction, updateProfile,
  calcStats, buildChartPaths, fmt,
  type Account, type Note, type SavingsGoal, type Transaction, type Notification,
} from '@/lib/supabase/db'
import {
  NoteDialog, AccountDialog, TxDialog,
} from '@/components/dashboard/dialogs'
import {
  NotificationsPanel, CategoryDetailsPanel, SpendingFlowPanel, HelpPanel,
} from '@/components/dashboard/panels'
import { GlassIcon, SectionTitle, toneColors, greeting } from '@/components/dashboard/ui'
import type { NoteDraft, AccountDraft, TxDraft, GoalDraft } from '@/components/dashboard/types'
import {
  ArrowDownLeft, ArrowUpRight, Bell, Calendar, ChevronLeft, ChevronRight,
  CircleHelp, CreditCard, Home, LogOut, Moon, MoreHorizontal, Pencil, Plus,
  Save, Settings2, Sparkles, Sun, Target, Trash2, TrendingUp, WalletCards, X, Loader2,
} from 'lucide-react'

const navItems = [
  { label: 'Home', icon: Home },
  { label: 'Notes', icon: WalletCards },
  { label: 'Insights', icon: Sparkles },
  { label: 'Settings', icon: Settings2 },
]

const today = new Date()

export default function Page() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()

  // UI state
  const [active, setActive] = useState('Home')
  const [dark, setDark] = useState(false)
  const [showBalance, setShowBalance] = useState(true)
  const [dataLoading, setDataLoading] = useState(true)
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [showMonthPicker, setShowMonthPicker] = useState(false)

  // Panel visibility
  const [showNotifications, setShowNotifications] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showCategoryDetails, setShowCategoryDetails] = useState(false)
  const [showSpendingFlow, setShowSpendingFlow] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  // Dialog state
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [noteDraft, setNoteDraft] = useState<NoteDraft>({ title: '', amount: '', due_date: '', category: 'Want' })

  const [showAccountDialog, setShowAccountDialog] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [accountDraft, setAccountDraft] = useState<AccountDraft>({ name: '', purpose: '', balance: '', tone: 'violet', symbol: '₦' })

  const [showTxDialog, setShowTxDialog] = useState(false)
  const [txDraft, setTxDraft] = useState<TxDraft>({ type: 'expense', amount: '', category: 'Food & snacks', description: '', date: today.toISOString().slice(0, 10) })

  const [goalDraft, setGoalDraft] = useState<GoalDraft>({ title: '', current: '', target: '' })
  const [profileDraft, setProfileDraft] = useState({ name: '', initials: '' })
  const [savingProfile, setSavingProfile] = useState(false)

  // Supabase data
  const [profile, setProfile] = useState<{ name: string; initials: string } | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [goal, setGoal] = useState<SavingsGoal | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [user, authLoading, router])

  const loadData = useCallback(async () => {
    if (!user) return
    setDataLoading(true)
    const [p, a, t, n, g, notifs] = await Promise.all([
      getProfile(user.id),
      getAccounts(user.id),
      getTransactions(user.id),
      getNotes(user.id),
      getSavingsGoal(user.id),
      getNotifications(user.id),
    ])
    setProfile(p)
    setAccounts(a)
    setTransactions(t)
    setNotes(n)
    setGoal(g)
    setNotifications(notifs)
    if (p) setProfileDraft({ name: p.name, initials: p.initials })
    if (g) setGoalDraft({ title: g.title, current: String(g.current_amount), target: String(g.target_amount) })
    setDataLoading(false)
  }, [user])

  useEffect(() => { loadData() }, [loadData])

  if (authLoading || !user) return null

  const stats = calcStats(transactions, viewMonth, viewYear)
  const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0)
  const { incLine, expLine, incArea, dayLabels } = buildChartPaths(transactions, viewMonth, viewYear)
  const goalPercent = goal ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100)) : 0
  const unreadCount = notifications.filter((n) => !n.read).length

  const viewPeriodLabel = new Date(viewYear, viewMonth, 1).toLocaleString('en-NG', { month: 'short', year: 'numeric' })

  const shiftMonth = (dir: 1 | -1) => {
    setViewMonth((m) => {
      const next = m + dir
      if (next < 0) { setViewYear((y) => y - 1); return 11 }
      if (next > 11) { setViewYear((y) => y + 1); return 0 }
      return next
    })
  }

  // ── Notes ──
  const openNote = (note?: Note) => {
    setEditingNote(note ?? null)
    setNoteDraft(note
      ? { title: note.title, amount: String(note.amount), due_date: note.due_date, category: note.category }
      : { title: '', amount: '', due_date: '', category: 'Want' })
    setShowNoteDialog(true)
  }
  const saveNote = async () => {
    if (!noteDraft.title.trim() || !noteDraft.amount || !noteDraft.due_date) return
    await upsertNote({
      id: editingNote?.id ?? crypto.randomUUID(),
      user_id: user.id,
      title: noteDraft.title,
      amount: parseFloat(noteDraft.amount),
      due_date: noteDraft.due_date,
      category: noteDraft.category,
      updated_at: new Date().toISOString(),
    })
    setShowNoteDialog(false)
    setEditingNote(null)
    loadData()
  }
  const removeNote = async (id: string) => {
    await deleteNote(id)
    setNotes((n) => n.filter((x) => x.id !== id))
  }

  // ── Accounts ──
  const openAccount = (account?: Account) => {
    setEditingAccount(account ?? null)
    setAccountDraft(account
      ? { name: account.name, purpose: account.purpose, balance: String(account.balance), tone: account.tone, symbol: account.symbol }
      : { name: '', purpose: '', balance: '', tone: 'violet', symbol: '₦' })
    setShowAccountDialog(true)
  }
  const saveAccount = async () => {
    if (!accountDraft.name.trim() || !accountDraft.balance) return
    await upsertAccount({
      id: editingAccount?.id ?? crypto.randomUUID(),
      user_id: user.id,
      name: accountDraft.name,
      purpose: accountDraft.purpose,
      balance: parseFloat(accountDraft.balance),
      tone: accountDraft.tone,
      symbol: accountDraft.symbol,
    })
    setShowAccountDialog(false)
    setEditingAccount(null)
    loadData()
  }
  const removeAccount = async (id: string) => {
    await deleteAccount(id)
    setAccounts((a) => a.filter((x) => x.id !== id))
  }

  // ── Transactions ──
  const openTx = (type: 'income' | 'expense' = 'expense') => {
    setTxDraft({ type, amount: '', category: type === 'income' ? 'Salary' : 'Food & snacks', description: '', date: today.toISOString().slice(0, 10) })
    setShowTxDialog(true)
  }
  const saveTx = async () => {
    if (!txDraft.amount) return
    await insertTransaction({
      user_id: user.id,
      type: txDraft.type,
      amount: parseFloat(txDraft.amount),
      category: txDraft.category,
      description: txDraft.description,
      date: txDraft.date,
    })
    setShowTxDialog(false)
    loadData()
  }

  // ── Goal ──
  const saveGoal = async () => {
    if (!goalDraft.title.trim() || !goalDraft.current || !goalDraft.target) return
    await upsertSavingsGoal({
      id: goal?.id ?? crypto.randomUUID(),
      user_id: user.id,
      title: goalDraft.title,
      current_amount: parseFloat(goalDraft.current),
      target_amount: parseFloat(goalDraft.target),
    })
    loadData()
  }

  // ── Profile ──
  const saveProfile = async () => {
    if (!profileDraft.name.trim()) return
    setSavingProfile(true)
    await updateProfile(user.id, { name: profileDraft.name, initials: profileDraft.initials || profileDraft.name.slice(0, 2).toUpperCase() })
    await loadData()
    setSavingProfile(false)
  }

  // ── Notifications ──
  const handleMarkRead = async () => {
    await markNotificationsRead(user.id)
    setNotifications((n) => n.map((x) => ({ ...x, read: true })))
  }

  return (
    <main className={`app-shell ${dark ? 'dark-mode' : ''}`}>
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <div className="floating-money money-one">₦</div>
      <div className="floating-money money-two">$</div>
      <div className="floating-money money-three">+</div>

      <section className="phone-frame">
        {/* ── Topbar ── */}
        <header className="topbar">
          <div className="profile-wrap">
            <div className="avatar">{profile?.initials ?? user.email?.[0]?.toUpperCase() ?? '?'}</div>
            <div>
              <p className="eyebrow">{greeting()}</p>
              <h1>{profile?.name ?? user.email?.split('@')[0]} <span className="wave">✦</span></h1>
            </div>
          </div>
          <div className="top-actions">
            <button aria-label="Help" onClick={() => setShowHelp(true)}><CircleHelp /></button>
            <button aria-label="Toggle dark mode" onClick={() => setDark(!dark)}>{dark ? <Sun /> : <Moon />}</button>
            <button aria-label="Notifications" className="notification" onClick={() => setShowNotifications(true)}>
              <Bell />
              {unreadCount > 0 && <i />}
            </button>
            <button aria-label="Sign out" onClick={signOut}><LogOut /></button>
          </div>
        </header>

        {/* ── Content ── */}
        <div className="content-scroll">
          {dataLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <Loader2 className="animate-spin" style={{ width: 28, height: 28, color: 'var(--muted)' }} />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={active} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }}>

                {/* ══ HOME ══ */}
                {active === 'Home' && <>
                  {/* Net Worth */}
                  <motion.section className="net-worth glass-panel" initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }}>
                    <div className="net-copy">
                      <p className="eyebrow light">
                        TOTAL NET WORTH
                        <button className="eye" onClick={() => setShowBalance(!showBalance)} aria-label="Toggle">{showBalance ? '◉' : '○'}</button>
                      </p>
                      <div className="net-value">{showBalance ? fmt(netWorth) : '••••••••'}</div>
                      <div className="trend">
                        <TrendingUp />
                        <strong style={{ color: stats.income.isPositive ? '#8af0dc' : '#ed8fbb' }}>{stats.income.change}</strong>
                        <span>income vs last month</span>
                      </div>
                    </div>
                    <div className="orb-wrap">
                      <motion.div className="orb" animate={{ scale: [1, 1.13, 1], opacity: [.55, .95, .55] }} transition={{ duration: 2.8, repeat: Infinity }}>
                        <span>✦</span>
                      </motion.div>
                      <div className="orb-value">NGN <small>+</small></div>
                    </div>
                  </motion.section>

                  {/* Overview with month filter */}
                  <SectionTitle
                    eyebrow="OVERVIEW"
                    title={stats.period}
                    action={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button className="month-button" style={{ padding: '6px 7px' }} onClick={() => shiftMonth(-1)} aria-label="Previous month"><ChevronLeft style={{ width: 13 }} /></button>
                        <button className="month-button" onClick={() => setShowMonthPicker(!showMonthPicker)}>
                          {viewPeriodLabel} <ChevronRight style={{ width: 13 }} />
                        </button>
                        <button className="month-button" style={{ padding: '6px 7px' }} onClick={() => shiftMonth(1)} aria-label="Next month"><ChevronRight style={{ width: 13 }} /></button>
                      </div>
                    }
                  />

                  {/* Month picker dropdown */}
                  <AnimatePresence>
                    {showMonthPicker && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        className="glass-panel" style={{ borderRadius: 16, padding: '12px', marginBottom: 12, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
                        {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                          <button key={m}
                            onClick={() => { setViewMonth(i); setShowMonthPicker(false) }}
                            style={{ padding: '7px 4px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: viewMonth === i ? '#7168db' : 'var(--surface)', color: viewMonth === i ? '#fff' : 'var(--ink)', border: '1px solid var(--line)' }}>
                            {m}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Stat cards */}
                  <section className="stat-grid">
                    <motion.div className="glass-panel stat-card" whileHover={{ y: -4 }}>
                      <div className="stat-top">
                        <GlassIcon tone="teal"><ArrowDownLeft /></GlassIcon>
                        <span className="positive">{stats.income.change}</span>
                      </div>
                      <p>Income</p>
                      <strong>{stats.income.amount}</strong>
                      <div className="mini-bars"><i /><i /><i /><i /><i /><i /><i /></div>
                    </motion.div>
                    <motion.div className="glass-panel stat-card" whileHover={{ y: -4 }}>
                      <div className="stat-top">
                        <GlassIcon tone="pink"><ArrowUpRight /></GlassIcon>
                        <span className="negative">{stats.expenses.change}</span>
                      </div>
                      <p>Expenses</p>
                      <strong>{stats.expenses.amount}</strong>
                      <div className="mini-bars expense"><i /><i /><i /><i /><i /><i /><i /></div>
                    </motion.div>
                  </section>

                  {/* Spending Flow chart */}
                  <SectionTitle
                    eyebrow="SPENDING FLOW"
                    title="Your activity"
                    action={
                      <button className="icon-button" aria-label="View all activity" onClick={() => setShowSpendingFlow(true)}>
                        <MoreHorizontal />
                      </button>
                    }
                  />
                  <section className="glass-panel chart-card">
                    <div className="chart-labels">
                      <span><i className="dot income-dot" /> Income</span>
                      <span><i className="dot expense-dot" /> Expenses</span>
                    </div>
                    <div className="chart">
                      <div className="grid-lines"><i /><i /><i /><i /></div>
                      <svg viewBox="0 0 500 150" preserveAspectRatio="none" aria-label="Spending flow chart">
                        <path className="area" d={incArea} />
                        <path className="line income-line" d={incLine} />
                        <path className="line expense-line" d={expLine} />
                      </svg>
                    </div>
                    <div className="chart-days">
                      {dayLabels.map((d) => <span key={d}>{d}</span>)}
                    </div>
                  </section>

                  {/* Accounts */}
                  <SectionTitle
                    eyebrow="YOUR ACCOUNTS"
                    title="Where your money lives"
                    action={<button className="text-button" onClick={() => openAccount()}>+ Add <ChevronRight /></button>}
                  />
                  {accounts.length === 0 ? (
                    <div className="glass-panel empty-notes" style={{ borderRadius: 20, padding: '24px 16px' }}>
                      <CreditCard style={{ width: 24, color: '#7168db' }} />
                      <p>No accounts yet</p>
                      <button className="text-button" onClick={() => openAccount()}>Add your first account</button>
                    </div>
                  ) : (
                    <div className="account-row">
                      {accounts.map((acc, i) => (
                        <motion.article whileHover={{ y: -5 }} className={`account-card ${i === 0 ? 'active-account' : ''}`} key={acc.id}>
                          <div className={`account-icon account-${acc.tone}`}>{acc.symbol}</div>
                          <p>{acc.name}</p>
                          <small>{acc.purpose}</small>
                          <strong>{fmt(acc.balance)}</strong>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 11 }}>
                            <div className="account-dots"><i /><i /><i /></div>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={() => openAccount(acc)} style={{ background: 'none', padding: 2 }}><Pencil style={{ width: 11, color: 'var(--muted)' }} /></button>
                              <button onClick={() => removeAccount(acc.id)} style={{ background: 'none', padding: 2 }}><Trash2 style={{ width: 11, color: 'var(--muted)' }} /></button>
                            </div>
                          </div>
                        </motion.article>
                      ))}
                    </div>
                  )}

                  {/* Spending Breakdown */}
                  <SectionTitle
                    eyebrow="SPENDING BREAKDOWN"
                    title="By category"
                    action={
                      <button className="text-button" onClick={() => setShowCategoryDetails(true)}>
                        Details <ChevronRight />
                      </button>
                    }
                  />
                  <section className="glass-panel categories-card">
                    <div className="donut">
                      <div className="donut-hole">
                        <strong style={{ fontSize: 11 }}>{stats.expenses.amount.replace('NGN ', '')}</strong>
                        <span>spent</span>
                      </div>
                    </div>
                    <div className="category-list">
                      {stats.categories.length === 0 ? (
                        <p style={{ color: 'var(--muted)', fontSize: 10 }}>No expenses this month</p>
                      ) : stats.categories.map((item) => (
                        <div className="category-item" key={item.label}>
                          <span className="category-name">
                            <i style={{ background: toneColors[item.tone] }} />
                            {item.label}
                          </span>
                          <strong>{item.value}</strong>
                          <div className="category-bar">
                            <motion.i initial={{ width: 0 }} animate={{ width: `${item.percent}%` }} transition={{ duration: .8 }} style={{ background: toneColors[item.tone], display: 'block', height: '100%', borderRadius: 10 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Savings Goal */}
                  {goal && (
                    <section className="glass-panel goal-card" style={{ cursor: 'pointer' }} onClick={() => setActive('Settings')}>
                      <div className="goal-icon"><Target /></div>
                      <div className="goal-copy">
                        <p className="eyebrow">SAVINGS GOAL</p>
                        <h3>{goal.title}</h3>
                        <div className="goal-line">
                          <span>{fmt(goal.current_amount)} of {fmt(goal.target_amount)}</span>
                          <strong>{goalPercent}%</strong>
                        </div>
                        <div className="progress">
                          <motion.i initial={{ width: 0 }} animate={{ width: `${goalPercent}%` }} />
                        </div>
                      </div>
                      <ChevronRight className="goal-arrow" />
                    </section>
                  )}
                </>}

                {/* ══ NOTES ══ */}
                {active === 'Notes' && (
                  <NotesView notes={notes} onAdd={() => openNote()} onEdit={openNote} onDelete={removeNote} />
                )}

                {/* ══ INSIGHTS ══ */}
                {active === 'Insights' && (
                  <InsightsView stats={stats} transactions={transactions} month={viewMonth} year={viewYear} />
                )}

                {/* ══ SETTINGS ══ */}
                {active === 'Settings' && (
                  <SettingsView
                    profileDraft={profileDraft}
                    setProfileDraft={setProfileDraft}
                    onSaveProfile={saveProfile}
                    savingProfile={savingProfile}
                    goalDraft={goalDraft}
                    setGoalDraft={setGoalDraft}
                    onSaveGoal={saveGoal}
                    goal={goal}
                    goalPercent={goalPercent}
                  />
                )}

              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* ── Bottom Nav ── */}
        <nav className="bottom-nav" aria-label="Primary navigation">
          {navItems.map(({ label, icon: Icon }) => (
            <button key={label} className={active === label ? 'nav-active' : ''} onClick={() => setActive(label)}>
              <span><Icon /></span><small>{label}</small>
            </button>
          ))}
          <button onClick={() => setShowAdd(true)}>
            <span className="add-button"><Plus /></span><small>Add</small>
          </button>
        </nav>

        {/* ── Quick Add Sheet ── */}
        <AnimatePresence>
          {showAdd && (
            <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdd(false)}>
              <motion.div className="add-sheet glass-panel" initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} onClick={(e) => e.stopPropagation()}>
                <button className="close-button" onClick={() => setShowAdd(false)}><X /></button>
                <p className="eyebrow">QUICK ACTION</p>
                <h2>What would you like to add?</h2>
                <div className="quick-actions">
                  <button onClick={() => { setShowAdd(false); openTx('income') }}>
                    <GlassIcon tone="teal"><ArrowDownLeft /></GlassIcon>
                    <span>Income<small>Money received</small></span>
                  </button>
                  <button onClick={() => { setShowAdd(false); openTx('expense') }}>
                    <GlassIcon tone="pink"><ArrowUpRight /></GlassIcon>
                    <span>Expense<small>Money spent</small></span>
                  </button>
                  <button onClick={() => { setShowAdd(false); setActive('Notes'); openNote() }}>
                    <GlassIcon tone="violet"><WalletCards /></GlassIcon>
                    <span>Note<small>Plan a purchase</small></span>
                  </button>
                  <button onClick={() => { setShowAdd(false); openAccount() }}>
                    <GlassIcon tone="gold"><CreditCard /></GlassIcon>
                    <span>Account<small>Add a wallet</small></span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Dialogs ── */}
        <NoteDialog open={showNoteDialog} draft={noteDraft} setDraft={setNoteDraft} onSave={saveNote} onClose={() => { setShowNoteDialog(false); setEditingNote(null) }} isEditing={editingNote !== null} />
        <AccountDialog open={showAccountDialog} draft={accountDraft} setDraft={setAccountDraft} onSave={saveAccount} onClose={() => { setShowAccountDialog(false); setEditingAccount(null) }} isEditing={editingAccount !== null} />
        <TxDialog open={showTxDialog} draft={txDraft} setDraft={setTxDraft} onSave={saveTx} onClose={() => setShowTxDialog(false)} />

        {/* ── Panels ── */}
        <NotificationsPanel open={showNotifications} onClose={() => setShowNotifications(false)} notifications={notifications} onMarkRead={handleMarkRead} />
        <CategoryDetailsPanel open={showCategoryDetails} onClose={() => setShowCategoryDetails(false)} categories={stats.allCategories} transactions={transactions} month={viewMonth} year={viewYear} />
        <SpendingFlowPanel open={showSpendingFlow} onClose={() => setShowSpendingFlow(false)} transactions={transactions} month={viewMonth} year={viewYear} />
        <HelpPanel open={showHelp} onClose={() => setShowHelp(false)} />
      </section>
    </main>
  )
}

// ─── Notes View ───────────────────────────────────────────────────────────────
function NotesView({ notes, onAdd, onEdit, onDelete }: {
  notes: Note[]
  onAdd: () => void
  onEdit: (n: Note) => void
  onDelete: (id: string) => void
}) {
  return (
    <section className="notes-page">
      <SectionTitle eyebrow="PLANNED SPENDING" title="Your notes" action={<button className="primary-button small" onClick={onAdd}><Plus /> Add note</button>} />
      <p className="notes-intro">Keep the things you want to buy and bills you need to pay in one calm place.</p>
      <div className="notes-list">
        {notes.map((note) => (
          <motion.article layout key={note.id} className="glass-panel note-card">
            <div className="note-card-top">
              <GlassIcon tone={note.category === 'Pay' ? 'pink' : 'teal'}><Calendar /></GlassIcon>
              <span className={`note-tag ${note.category.toLowerCase()}`}>{note.category}</span>
              <div className="note-actions">
                <button onClick={() => onEdit(note)}><Pencil /></button>
                <button onClick={() => onDelete(note.id)}><Trash2 /></button>
              </div>
            </div>
            <h3>{note.title}</h3>
            <strong>{fmt(note.amount)}</strong>
            <div className="note-meta">
              <span><Calendar /> Due {note.due_date}</span>
              <small>Edited {new Date(note.updated_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</small>
            </div>
          </motion.article>
        ))}
        {notes.length === 0 && (
          <div className="empty-notes glass-panel">
            <WalletCards />
            <p>No notes yet</p>
            <button className="text-button" onClick={onAdd}>Add your first note</button>
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Insights View ────────────────────────────────────────────────────────────
function InsightsView({ stats, transactions, month, year }: {
  stats: ReturnType<typeof calcStats>
  transactions: Transaction[]
  month: number
  year: number
}) {
  const monthTxns = transactions.filter((t) => {
    const d = new Date(t.date)
    return d.getMonth() === month && d.getFullYear() === year
  })
  const topExpense = stats.allCategories[0]
  const net = stats.income.rawAmount - stats.expenses.rawAmount

  return (
    <section className="notes-page">
      <SectionTitle eyebrow="INSIGHTS" title="Your patterns" />
      <div className="stat-grid" style={{ marginBottom: 12 }}>
        <div className="glass-panel stat-card">
          <p style={{ color: 'var(--muted)', fontSize: 10, margin: '0 0 4px' }}>Net this month</p>
          <strong style={{ fontSize: 16, color: net >= 0 ? '#18ad99' : '#d878a1' }}>{fmt(Math.abs(net))}</strong>
          <p style={{ fontSize: 9, color: 'var(--muted)', margin: '4px 0 0' }}>{net >= 0 ? 'surplus' : 'deficit'}</p>
        </div>
        <div className="glass-panel stat-card">
          <p style={{ color: 'var(--muted)', fontSize: 10, margin: '0 0 4px' }}>Transactions</p>
          <strong style={{ fontSize: 16 }}>{monthTxns.length}</strong>
          <p style={{ fontSize: 9, color: 'var(--muted)', margin: '4px 0 0' }}>this month</p>
        </div>
      </div>
      {topExpense && (
        <div className="glass-panel" style={{ padding: '14px', borderRadius: 20, marginBottom: 12 }}>
          <p className="eyebrow">TOP SPENDING CATEGORY</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <GlassIcon tone={topExpense.tone}><Sparkles style={{ width: 14 }} /></GlassIcon>
            <div>
              <p style={{ margin: 0, fontWeight: 700 }}>{topExpense.label}</p>
              <p style={{ margin: 0, fontSize: 10, color: 'var(--muted)' }}>{topExpense.percent}% of total expenses</p>
            </div>
            <strong style={{ marginLeft: 'auto' }}>{topExpense.value}</strong>
          </div>
        </div>
      )}
      <div className="glass-panel" style={{ padding: '14px', borderRadius: 20 }}>
        <p className="eyebrow" style={{ marginBottom: 10 }}>ALL CATEGORIES</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {stats.allCategories.length === 0
            ? <p style={{ color: 'var(--muted)', fontSize: 11 }}>No expenses recorded this month.</p>
            : stats.allCategories.map((cat) => (
              <div key={cat.label} className="category-item">
                <span className="category-name"><i style={{ background: toneColors[cat.tone] }} />{cat.label}</span>
                <strong>{cat.value}</strong>
                <div className="category-bar">
                  <motion.i initial={{ width: 0 }} animate={{ width: `${cat.percent}%` }} transition={{ duration: .8 }} style={{ background: toneColors[cat.tone], display: 'block', height: '100%', borderRadius: 10 }} />
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </section>
  )
}

// ─── Settings View ────────────────────────────────────────────────────────────
function SettingsView({ profileDraft, setProfileDraft, onSaveProfile, savingProfile, goalDraft, setGoalDraft, onSaveGoal, goal, goalPercent }: {
  profileDraft: { name: string; initials: string }
  setProfileDraft: (d: { name: string; initials: string }) => void
  onSaveProfile: () => void
  savingProfile: boolean
  goalDraft: GoalDraft
  setGoalDraft: (d: GoalDraft) => void
  onSaveGoal: () => void
  goal: SavingsGoal | null
  goalPercent: number
}) {
  const inputStyle = { border: '1px solid var(--line)', borderRadius: 10, padding: '9px 11px', background: 'var(--surface)', color: 'var(--ink)', font: 'inherit', fontSize: 12, width: '100%' }

  return (
    <section className="settings-page">
      <SectionTitle eyebrow="SETTINGS" title="Your profile & money" />

      {/* Profile */}
      <div className="glass-panel balance-editor" style={{ marginBottom: 12 }}>
        <p className="eyebrow">YOUR PROFILE</p>
        <h3 style={{ margin: '4px 0 12px' }}>Update your name</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input value={profileDraft.name} onChange={(e) => setProfileDraft({ ...profileDraft, name: e.target.value })} placeholder="Your name" style={inputStyle} />
          <input value={profileDraft.initials} onChange={(e) => setProfileDraft({ ...profileDraft, initials: e.target.value })} placeholder="Initials (e.g. AJ)" maxLength={3} style={inputStyle} />
          <div className="money-input" style={{ justifyContent: 'flex-end' }}>
            <button onClick={onSaveProfile} aria-label="Save profile" disabled={savingProfile}>
              {savingProfile ? <Loader2 style={{ width: 14 }} className="animate-spin" /> : <Save style={{ width: 14 }} />}
            </button>
          </div>
        </div>
      </div>

      {/* Savings Goal */}
      <div className="glass-panel balance-editor" style={{ marginBottom: 12 }}>
        <p className="eyebrow">SAVINGS GOAL</p>
        <h3 style={{ margin: '4px 0 12px' }}>{goal?.title || 'Set a goal'}</h3>
        {goal && (
          <div className="progress" style={{ marginBottom: 12 }}>
            <motion.i initial={{ width: 0 }} animate={{ width: `${goalPercent}%` }} />
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input value={goalDraft.title} onChange={(e) => setGoalDraft({ ...goalDraft, title: e.target.value })} placeholder="Goal title" style={inputStyle} />
          <div className="money-input"><span>Current</span><input value={goalDraft.current} onChange={(e) => setGoalDraft({ ...goalDraft, current: e.target.value })} inputMode="decimal" placeholder="0" /></div>
          <div className="money-input">
            <span>Target</span>
            <input value={goalDraft.target} onChange={(e) => setGoalDraft({ ...goalDraft, target: e.target.value })} inputMode="decimal" placeholder="100000" />
            <button onClick={onSaveGoal} aria-label="Save goal"><Save /></button>
          </div>
        </div>
      </div>

      <div className="glass-panel settings-tip">
        <GlassIcon tone="violet"><CreditCard /></GlassIcon>
        <div>
          <strong>All data is synced</strong>
          <p>Your accounts, notes, transactions and goals are saved to Supabase across all devices.</p>
        </div>
      </div>
    </section>
  )
}

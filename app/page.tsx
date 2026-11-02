'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { fmt } from '@/lib/supabase/db'
import {
  NoteDialog, AccountDialog, TxDialog,
} from '@/components/dashboard/dialogs'
import {
  NotificationsPanel, CategoryDetailsPanel, SpendingFlowPanel, HelpPanel,
} from '@/components/dashboard/panels'
import { GlassIcon, SectionTitle, toneColors, greeting } from '@/components/dashboard/ui'
import { useExpenseData } from '@/components/dashboard/useExpenseData'
import { InsightsView, NotesView, SettingsView } from '@/components/dashboard/views'
import {
  ArrowDownLeft, ArrowUpRight, Bell, ChevronLeft, ChevronRight,
  CircleHelp, CreditCard, Home, LogOut, Moon, MoreHorizontal, Pencil, Plus,
  Settings2, Sparkles, Sun, Target, Trash2, TrendingUp, WalletCards, X, Loader2,
} from 'lucide-react'

const navItems = [
  { label: 'Home', icon: Home },
  { label: 'Notes', icon: WalletCards },
  { label: 'Insights', icon: Sparkles },
  { label: 'Settings', icon: Settings2 },
]

export default function Page() {
  const {
    user, authLoading, signOut,
    active, setActive, dark, setDark, showBalance, setShowBalance, dataLoading,
    viewMonth, viewYear, viewPeriodLabel, showMonthPicker, setShowMonthPicker, shiftMonth, pickMonth,
    showNotifications, setShowNotifications, showHelp, setShowHelp,
    showCategoryDetails, setShowCategoryDetails, showSpendingFlow, setShowSpendingFlow,
    showAdd, setShowAdd,
    showNoteDialog, noteDraft, setNoteDraft, editingNote, openNote, closeNote, saveNote, removeNote,
    showAccountDialog, accountDraft, setAccountDraft, editingAccount, openAccount, closeAccount, saveAccount, removeAccount,
    showTxDialog, setShowTxDialog, txDraft, setTxDraft, openTx, saveTx,
    goalDraft, setGoalDraft, saveGoal, profileDraft, setProfileDraft, savingProfile, saveProfile,
    handleMarkRead, profile, accounts, transactions, notes, goal, notifications,
    stats, chart: { incLine, expLine, incArea, dayLabels }, netWorth, goalPercent, unreadCount,
  } = useExpenseData()

  if (authLoading || !user) return null

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
                            onClick={() => pickMonth(i)}
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
        <NoteDialog open={showNoteDialog} draft={noteDraft} setDraft={setNoteDraft} onSave={saveNote} onClose={closeNote} isEditing={editingNote !== null} />
        <AccountDialog open={showAccountDialog} draft={accountDraft} setDraft={setAccountDraft} onSave={saveAccount} onClose={closeAccount} isEditing={editingAccount !== null} />
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

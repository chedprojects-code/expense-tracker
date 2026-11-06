'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fmt } from '@/lib/supabase/db'
import {
  NoteDialog, AccountDialog, TxDialog, LenderDialog, FutureExpenseDialog,
} from '@/components/dashboard/dialogs'
import {
  NotificationsPanel, CategoryDetailsPanel, SpendingFlowPanel, HelpPanel,
} from '@/components/dashboard/panels'
import { GlassIcon, SectionTitle, toneColors } from '@/components/dashboard/ui'
import { useExpenseData } from '@/components/dashboard/useExpenseData'
import { BuyListView } from '@/components/dashboard/BuyListView'
import { InsightsView } from '@/components/dashboard/InsightsView'
import { NotesView } from '@/components/dashboard/NotesView'
import { SettingsView } from '@/components/dashboard/SettingsView'
import { DashboardBottomNavigation, DashboardHeader, QuickAddSheet } from '@/components/dashboard/navigation'
import { VaultView } from '@/components/vault/VaultView'
import type { DashboardSearchItem } from '@/components/dashboard/types'
import {
  ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, ChevronDown,
  CreditCard, Eye, EyeOff, MoreHorizontal, Pencil, Settings2, Sparkles, Target, Trash2,
  TrendingUp, WalletCards, Loader2, HandCoins, CalendarClock, ShieldCheck,
} from 'lucide-react'

export default function Page() {
  const {
    user, authLoading, signOut,
    active, setActive, dark, setDark, showBalance, setShowBalance, dataLoading,
    viewMonth, viewYear, viewPeriodLabel, showMonthPicker, setShowMonthPicker, shiftMonth, pickMonth, setViewPeriod,
    showNotifications, setShowNotifications, showHelp, setShowHelp,
    showCategoryDetails, setShowCategoryDetails, showSpendingFlow, setShowSpendingFlow,
    showAdd, setShowAdd,
    showNoteDialog, noteDraft, setNoteDraft, editingNote, openNote, closeNote, saveNote, removeNote, reorderNotes,
    showAccountDialog, accountDraft, setAccountDraft, editingAccount, openAccount, closeAccount, saveAccount, removeAccount,
    showTxDialog, setShowTxDialog, txDraft, setTxDraft, editingTx, openTx, saveTx, removeTx,
    goalDraft, setGoalDraft, saveGoal, profileDraft, setProfileDraft, savingProfile, saveProfile,
    handleMarkRead, profile, accounts, transactions, notes, goal, notifications,
    stats, chart: { incLine, expLine, incArea, dayLabels }, netWorth, netAfterFuture, spendableWorth, spendableAfterFuture, goalPercent, unreadCount,
    lenders, totalLent,
    showLenderDialog, lenderDraft, setLenderDraft, editingLender, openLender, closeLender, saveLender, removeLender,
    hideAccountAmounts, setHideAccountAmounts,
    hideLenderAmounts, setHideLenderAmounts,
    collapsed, toggleCollapse,
    excludedAccounts, toggleExcludeAccount, excludedLenders, toggleExcludeLender,
    hiddenLenders, toggleHideLender, hiddenLendersTotal,
    futureExpenses, totalFutureExpenses,
    showFutureExpenseDialog, futureExpenseDraft, setFutureExpenseDraft, editingFutureExpense,
    openFutureExpense, closeFutureExpense, saveFutureExpense, removeFutureExpense,
    plainNotes, savePlainNote, removePlainNote, reorderPlainNotes,
    buyListItems, addBuyListItem, toggleBuyListItem, editBuyListItem, removeBuyListItem, reorderBuyListItems,
    vaultAccounts, vaultTotal, hiddenVaultTotal, toggleVaultHidden,
    searchItems,
  } = useExpenseData()
  const hasSpendableExclusions = excludedAccounts.length > 0 || excludedLenders.length > 0

  const [notesTab, setNotesTab] = useState<'financial' | 'plain' | 'buylist'>('financial')
  const [buyTab, setBuyTab] = useState<'need' | 'want'>('need')

  const handleSelectSearchResult = (item: DashboardSearchItem) => {
    const sectionMap: Record<string, string> = {
      account: 'Home', transaction: 'Insights', financialNote: 'Notes', plainNote: 'Notes',
      buyListItem: 'Notes', lender: 'Home', futureExpense: 'Home', goal: 'Settings',
    }
    const tabMap: Record<string, 'financial' | 'plain' | 'buylist'> = {
      financialNote: 'financial', plainNote: 'plain', buyListItem: 'buylist',
    }
    if (tabMap[item.type]) setNotesTab(tabMap[item.type])
    if (item.date) {
      const date = new Date(`${item.date}T00:00:00`)
      setViewPeriod(date.getMonth(), date.getFullYear())
    }
    setActive(item.section ?? sectionMap[item.type] ?? 'Home')
    setTimeout(() => {
      document.getElementById(`search-result-${item.type}-${item.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 350)
  }

  if (authLoading || !user) return null

  return (
    <main className={`app-shell ${dark ? 'dark-mode' : ''}`}>
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <div className="floating-money money-one">₦</div>
      <div className="floating-money money-two">$</div>
      <div className="floating-money money-three">+</div>

      <section className="phone-frame">
        <DashboardHeader
          initials={profile?.initials ?? user.email?.[0]?.toUpperCase() ?? '?'}
          name={profile?.name ?? user.email?.split('@')[0] ?? ''}
          dark={dark}
          searchItems={searchItems}
          onSelectSearchResult={handleSelectSearchResult}
          onHelp={() => setShowHelp(true)}
          onToggleDark={() => setDark(!dark)}
          onSettings={() => setActive('Settings')}
        />

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
                      {hasSpendableExclusions && (
                        <div className="net-planned">
                          <span>spendable (excl. savings)</span>
                          <span style={{ color: '#8af0dc' }}>{showBalance ? fmt(spendableWorth) : '••••'}</span>
                        </div>
                      )}
                      {totalFutureExpenses > 0 && (
                        <div className="net-planned">
                          <span>after future expenses</span>
                          <span>{showBalance ? fmt(hasSpendableExclusions ? spendableAfterFuture : netAfterFuture) : '••••'}</span>
                        </div>
                      )}
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
                        <button className="icon-button" style={{ marginLeft: 2 }} onClick={() => toggleCollapse('overview')} aria-label="Collapse">
                          <ChevronDown style={{ width: 13, transform: collapsed['overview'] ? 'rotate(-90deg)' : 'none', transition: 'transform .2s' }} />
                        </button>
                      </div>
                    }
                  />

                  <AnimatePresence initial={false}>
                    {!collapsed['overview'] && <motion.div key="overview" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
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
                    </motion.div>}
                  </AnimatePresence>

                  {/* Spending Flow chart */}
                  <SectionTitle
                    eyebrow="SPENDING FLOW"
                    title="Your activity"
                    action={
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="icon-button" aria-label="View all activity" onClick={() => setShowSpendingFlow(true)}><MoreHorizontal /></button>
                        <button className="icon-button" onClick={() => toggleCollapse('flow')} aria-label="Collapse">
                          <ChevronDown style={{ width: 13, transform: collapsed['flow'] ? 'rotate(-90deg)' : 'none', transition: 'transform .2s' }} />
                        </button>
                      </div>
                    }
                  />
                  <AnimatePresence initial={false}>
                    {!collapsed['flow'] && <motion.div key="flow" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
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
                    </motion.div>}
                  </AnimatePresence>

                  {/* Accounts */}
                  <SectionTitle
                    eyebrow="YOUR ACCOUNTS"
                    title="Where your money lives"
                    action={
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <button className="icon-button" onClick={() => setHideAccountAmounts(!hideAccountAmounts)} aria-label="Toggle account amounts">
                          {hideAccountAmounts ? <EyeOff style={{ width: 13 }} /> : <Eye style={{ width: 13 }} />}
                        </button>
                        <button className="text-button" onClick={() => openAccount()}>+ Add <ChevronRight /></button>
                        <button className="icon-button" onClick={() => toggleCollapse('accounts')} aria-label="Collapse">
                          <ChevronDown style={{ width: 13, transform: collapsed['accounts'] ? 'rotate(-90deg)' : 'none', transition: 'transform .2s' }} />
                        </button>
                      </div>
                    }
                  />
                  <AnimatePresence initial={false}>
                    {!collapsed['accounts'] && <motion.div key="accounts" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                  {accounts.filter((a) => !a.is_vault).length === 0 ? (
                    <div className="glass-panel empty-notes" style={{ borderRadius: 20, padding: '24px 16px' }}>
                      <CreditCard style={{ width: 24, color: '#7168db' }} />
                      <p>No accounts yet</p>
                      <button className="text-button" onClick={() => openAccount()}>Add your first account</button>
                    </div>
                  ) : (
                    <div className="account-row">
                      {accounts.filter((a) => !a.is_vault).map((acc, i) => (
                        <motion.article whileHover={{ y: -5 }} className={`account-card ${excludedAccounts.includes(acc.id) ? 'account-excluded' : ''}`} key={acc.id} id={`search-result-account-${acc.id}`}>
                          <div className={`account-icon account-${acc.tone}`}>{acc.symbol}</div>
                          <p>{acc.name}</p>
                          <small>{acc.purpose}{acc.annual_interest > 0 ? ` · ${acc.annual_interest}% p.a.` : ''}</small>
                          <strong>{hideAccountAmounts || excludedAccounts.includes(acc.id) ? '••••' : fmt(acc.balance)}</strong>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 11 }}>
                            <div className="account-dots"><i /><i /><i /></div>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={() => toggleExcludeAccount(acc.id)} style={{ background: 'none', padding: 2 }} title={excludedAccounts.includes(acc.id) ? 'Include in total' : 'Exclude from total'}>
                                {excludedAccounts.includes(acc.id) ? <EyeOff style={{ width: 11, color: '#d878a1' }} /> : <Eye style={{ width: 11, color: 'var(--muted)' }} />}
                              </button>
                              <button onClick={() => openAccount(acc)} style={{ background: 'none', padding: 2 }}><Pencil style={{ width: 11, color: 'var(--muted)' }} /></button>
                              <button onClick={() => removeAccount(acc.id)} style={{ background: 'none', padding: 2 }}><Trash2 style={{ width: 11, color: 'var(--muted)' }} /></button>
                            </div>
                          </div>
                        </motion.article>
                      ))}
                    </div>
                  )}
                    </motion.div>}
                  </AnimatePresence>

                  {/* Future Expenses */}
                  <SectionTitle
                    eyebrow="FUTURE EXPENSES"
                    title="Planned spending"
                    action={<button className="text-button" onClick={() => openFutureExpense()}>+ Add <ChevronRight /></button>}
                  />
                  {futureExpenses.length === 0 ? (
                    <div className="glass-panel empty-notes" style={{ borderRadius: 20, padding: '24px 16px' }}>
                      <CalendarClock style={{ width: 24, color: '#7168db' }} />
                      <p>No future expenses yet</p>
                      <button className="text-button" onClick={() => openFutureExpense()}>Add a planned expense</button>
                    </div>
                  ) : (
                    <div className="glass-panel lenders-list">
                      <div className="lenders-total">
                        <span className="eyebrow">TOTAL PLANNED</span>
                        <strong style={{ color: '#d878a1' }}>{fmt(totalFutureExpenses)}</strong>
                      </div>
                      {futureExpenses.map((fe) => (
                        <motion.div layout key={fe.id} className="lender-row" id={`search-result-futureExpense-${fe.id}`}>
                          <div className="lender-avatar" style={{ background: 'linear-gradient(135deg,#d878a1,#f0a8c8)' }}>
                            <CalendarClock style={{ width: 14 }} />
                          </div>
                          <div className="lender-info">
                            <p>{fe.title}</p>
                            <small>{fe.category} · Due {fe.due_date}</small>
                          </div>
                          <strong className="lender-amount" style={{ color: '#d878a1' }}>{fmt(fe.amount)}</strong>
                          <div className="lender-actions">
                            <button onClick={() => openFutureExpense(fe)}><Pencil style={{ width: 11 }} /></button>
                            <button onClick={() => removeFutureExpense(fe.id)}><Trash2 style={{ width: 11 }} /></button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Lenders */}
                  <SectionTitle
                    eyebrow="MONEY OWED TO YOU"
                    title="Your lenders"
                    action={
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <button className="icon-button" onClick={() => setHideLenderAmounts(!hideLenderAmounts)} aria-label={hideLenderAmounts ? 'Show lender amounts' : 'Hide lender amounts'}>
                          {hideLenderAmounts ? <EyeOff style={{ width: 13 }} /> : <Eye style={{ width: 13 }} />}
                        </button>
                        <button className="text-button" onClick={() => openLender()}>+ Add <ChevronRight /></button>
                      </div>
                    }
                  />
                  {lenders.length === 0 ? (
                    <div className="glass-panel empty-notes" style={{ borderRadius: 20, padding: '24px 16px' }}>
                      <HandCoins style={{ width: 24, color: '#7168db' }} />
                      <p>No lenders yet</p>
                      <button className="text-button" onClick={() => openLender()}>Track who owes you</button>
                    </div>
                  ) : (
                    <div className="glass-panel lenders-list">
                      <div className="lenders-total">
                        <span className="eyebrow">TOTAL OWED</span>
                        <strong style={{ color: '#18ad99' }}>{hideLenderAmounts ? '••••' : fmt(totalLent - hiddenLendersTotal)}</strong>
                        {hiddenLendersTotal > 0 && (
                          <small style={{ color: 'var(--muted)', marginLeft: 6 }}>({fmt(hiddenLendersTotal)} hidden)</small>
                        )}
                      </div>
                      {lenders.map((lender) => (
                        <motion.div layout key={lender.id} className="lender-row" id={`search-result-lender-${lender.id}`}>
                          <div className="lender-avatar">{lender.name[0].toUpperCase()}</div>
                          <div className="lender-info">
                            <p>{lender.name}</p>
                            {lender.note && <small>{lender.note}</small>}
                          </div>
                          <strong className="lender-amount" style={{ color: hiddenLenders.includes(lender.id) ? 'var(--muted)' : undefined }}>
                            {hideLenderAmounts || hiddenLenders.includes(lender.id) ? '••••' : fmt(lender.amount)}
                          </strong>
                          <div className="lender-actions">
                            <button
                              onClick={() => toggleHideLender(lender.id)}
                              title={hiddenLenders.includes(lender.id) ? 'Reveal from net worth' : 'Hide from net worth'}
                              aria-label={hiddenLenders.includes(lender.id) ? `Reveal ${lender.name}` : `Hide ${lender.name} from net worth`}
                            >
                              {hiddenLenders.includes(lender.id)
                                ? <EyeOff style={{ width: 11, color: '#d878a1' }} />
                                : <Eye style={{ width: 11, color: 'var(--muted)' }} />}
                            </button>
                            <button onClick={() => openLender(lender)}><Pencil style={{ width: 11 }} /></button>
                            <button onClick={() => removeLender(lender.id)}><Trash2 style={{ width: 11 }} /></button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Spending Breakdown */}
                  <SectionTitle
                    eyebrow="SPENDING BREAKDOWN"
                    title="By category"
                    action={
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="text-button" onClick={() => setShowCategoryDetails(true)}>Details <ChevronRight /></button>
                        <button className="icon-button" onClick={() => toggleCollapse('breakdown')} aria-label="Collapse">
                          <ChevronDown style={{ width: 13, transform: collapsed['breakdown'] ? 'rotate(-90deg)' : 'none', transition: 'transform .2s' }} />
                        </button>
                      </div>
                    }
                  />
                  <AnimatePresence initial={false}>
                    {!collapsed['breakdown'] && <motion.div key="breakdown" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
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
                    </motion.div>}
                  </AnimatePresence>

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

                {/* ══ VAULT ══ */}
                {active === 'Vault' && (
                  <VaultView
                    accounts={accounts}
                    hideAmounts={hideAccountAmounts}
                    onToggleHideAmounts={() => setHideAccountAmounts(!hideAccountAmounts)}
                    onToggleVaultHidden={toggleVaultHidden}
                    onAdd={openAccount}
                    onEdit={openAccount}
                    onDelete={removeAccount}
                  />
                )}

                {/* ══ BUY LIST ══ */}
                {active === 'BuyList' && (
                  <BuyListView
                    items={buyListItems}
                    onAdd={(title, category) => addBuyListItem(title, category, null)}
                    onToggle={toggleBuyListItem}
                    onDelete={removeBuyListItem}
                  />
                )}

                {/* ══ NOTES ══ */}
                {active === 'Notes' && (
                  <NotesView
                    notes={notes}
                    onAdd={() => openNote()}
                    onEdit={openNote}
                    onDelete={removeNote}
                    onReorderNotes={reorderNotes}
                    plainNotes={plainNotes}
                    onSavePlainNote={savePlainNote}
                    onDeletePlainNote={removePlainNote}
                    onReorderPlainNotes={reorderPlainNotes}
                    buyListItems={buyListItems}
                    onAddBuyItem={addBuyListItem}
                    onToggleBuyItem={toggleBuyListItem}
                    onEditBuyItem={editBuyListItem}
                    onDeleteBuyItem={removeBuyListItem}
                    onReorderBuyItems={reorderBuyListItems}
                    tab={notesTab}
                    onTabChange={setNotesTab}
                    buyTab={buyTab}
                    onBuyTabChange={setBuyTab}
                  />
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
                    onSignOut={signOut}
                  />
                )}

              </motion.div>
            </AnimatePresence>
          )}
        </div>

        <DashboardBottomNavigation
          active={active}
          onNavigate={(section) => {
            if (section !== 'Notes') setNotesTab('financial')
            setActive(section)
          }}
          onOpenAdd={() => setShowAdd(true)}
        />
        <QuickAddSheet
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onIncome={() => { setShowAdd(false); openTx('income') }}
          onExpense={() => { setShowAdd(false); openTx('expense') }}
          onNote={() => { setShowAdd(false); setActive('Notes'); openNote() }}
          onAccount={() => { setShowAdd(false); openAccount() }}
          onLender={() => { setShowAdd(false); openLender() }}
          onFutureExpense={() => { setShowAdd(false); openFutureExpense() }}
          onVault={() => { setShowAdd(false); setActive('Vault'); openAccount() }}
        />

        {/* ── Dialogs ── */}
        <NoteDialog open={showNoteDialog} draft={noteDraft} setDraft={setNoteDraft} onSave={saveNote} onClose={closeNote} isEditing={editingNote !== null} />
        <AccountDialog open={showAccountDialog} draft={accountDraft} setDraft={setAccountDraft} onSave={saveAccount} onClose={closeAccount} isEditing={editingAccount !== null} />
        <TxDialog open={showTxDialog} draft={txDraft} setDraft={setTxDraft} onSave={saveTx} onClose={() => { setShowTxDialog(false) }} isEditing={editingTx !== null} />
        <FutureExpenseDialog open={showFutureExpenseDialog} draft={futureExpenseDraft} setDraft={setFutureExpenseDraft} onSave={saveFutureExpense} onClose={closeFutureExpense} isEditing={editingFutureExpense !== null} />
        <LenderDialog open={showLenderDialog} draft={lenderDraft} setDraft={setLenderDraft} onSave={saveLender} onClose={closeLender} isEditing={editingLender !== null} />

        {/* ── Panels ── */}
        <NotificationsPanel open={showNotifications} onClose={() => setShowNotifications(false)} notifications={notifications} onMarkRead={handleMarkRead} />
        <CategoryDetailsPanel open={showCategoryDetails} onClose={() => setShowCategoryDetails(false)} categories={stats.allCategories} transactions={transactions} month={viewMonth} year={viewYear} />
        <SpendingFlowPanel open={showSpendingFlow} onClose={() => setShowSpendingFlow(false)} transactions={transactions} month={viewMonth} year={viewYear} onEdit={(tx) => { setShowSpendingFlow(false); openTx(tx.type, tx) }} onDelete={removeTx} />
        <HelpPanel open={showHelp} onClose={() => setShowHelp(false)} />
      </section>
    </main>
  )
}

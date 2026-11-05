'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowDownLeft, ArrowUpRight, CalendarClock, CircleHelp, CreditCard,
  HandCoins, Home, Moon, Plus, Search, Settings2, ShieldCheck, Sparkles, Sun,
  WalletCards, X,
} from 'lucide-react'
import { GlassIcon, greeting } from './ui'
import type { DashboardSearchItem } from './types'

export function DashboardHeader({
  initials,
  name,
  dark,
  searchItems,
  onSelectSearchResult,
  onHelp,
  onToggleDark,
  onSettings,
}: {
  initials: string
  name: string
  dark: boolean
  searchItems: DashboardSearchItem[]
  onSelectSearchResult: (item: DashboardSearchItem) => void
  onHelp: () => void
  onToggleDark: () => void
  onSettings: () => void
}) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const results = normalizedQuery.length < 2
    ? []
    : searchItems.filter((item) =>
      `${item.title} ${item.detail} ${item.searchText ?? ''} ${item.type}`.toLocaleLowerCase().includes(normalizedQuery)
    ).slice(0, 8)

  const selectResult = (item: DashboardSearchItem) => {
    onSelectSearchResult(item)
    setQuery('')
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="avatar">{initials}</div>
        <div className="topbar-greeting">
          <div className="topbar-greeting-row">
            <p className="eyebrow">{greeting()}</p>
            <div className="top-actions">
              <button aria-label="Help" onClick={onHelp}><CircleHelp /></button>
              <button aria-label="Toggle dark mode" onClick={onToggleDark}>{dark ? <Sun /> : <Moon />}</button>
              {/* <button aria-label="Notifications" className="notification" onClick={() => setShowNotifications(true)}>
                <Bell />
                {unreadCount > 0 && <i />}
              </button> */}
              <button aria-label="Settings" onClick={onSettings}><Settings2 /></button>
            </div>
          </div>
          <h1 className="topbar-name">{name} <span className="wave">✦</span></h1>
          <div className="top-search">
            <Search aria-hidden="true" />
            <input
              aria-label="Search your data"
              placeholder="Search your data"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && results[0]) {
                  event.preventDefault()
                  selectResult(results[0])
                }
                if (event.key === 'Escape') setQuery('')
              }}
            />
            {normalizedQuery.length >= 2 && (
              <div className="top-search-results" role="listbox" aria-label="Search results">
                {results.length === 0 ? (
                  <p className="top-search-empty">No matching data found</p>
                ) : results.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    role="option"
                    aria-selected="false"
                    onClick={() => selectResult(item)}
                  >
                    <span>{item.title}</span>
                    <small>{item.detail || item.type}</small>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export function DashboardBottomNavigation({
  active,
  onNavigate,
  onOpenAdd,
}: {
  active: string
  onNavigate: (section: string) => void
  onOpenAdd: () => void
}) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      <button className={active === 'Home' ? 'nav-active' : ''} onClick={() => onNavigate('Home')}>
        <span><Home /></span><small>Home</small>
      </button>
      <button className={active === 'Notes' ? 'nav-active' : ''} onClick={() => onNavigate('Notes')}>
        <span><WalletCards /></span><small>Notes</small>
      </button>
      <button className="add-nav-btn" onClick={onOpenAdd}>
        <span className="add-button"><Plus /></span><small>Add</small>
      </button>
      <button className={active === 'Vault' ? 'nav-active' : ''} onClick={() => onNavigate('Vault')}>
        <span><ShieldCheck /></span><small>Vault</small>
      </button>
      <button className={active === 'Insights' ? 'nav-active' : ''} onClick={() => onNavigate('Insights')}>
        <span><Sparkles /></span><small>Insights</small>
      </button>
    </nav>
  )
}

export function QuickAddSheet({
  open,
  onClose,
  onIncome,
  onExpense,
  onNote,
  onAccount,
  onLender,
  onFutureExpense,
  onVault,
}: {
  open: boolean
  onClose: () => void
  onIncome: () => void
  onExpense: () => void
  onNote: () => void
  onAccount: () => void
  onLender: () => void
  onFutureExpense: () => void
  onVault: () => void
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="add-sheet glass-panel" initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={onClose}><X /></button>
            <p className="eyebrow">QUICK ACTION</p>
            <h2>What would you like to add?</h2>
            <div className="quick-actions">
              <button onClick={onIncome}>
                <GlassIcon tone="teal"><ArrowDownLeft /></GlassIcon>
                <span>Income<small>Money received</small></span>
              </button>
              <button onClick={onExpense}>
                <GlassIcon tone="pink"><ArrowUpRight /></GlassIcon>
                <span>Expense<small>Money spent</small></span>
              </button>
              <button onClick={onNote}>
                <GlassIcon tone="violet"><WalletCards /></GlassIcon>
                <span>Note<small>Plan a purchase</small></span>
              </button>
              <button onClick={onAccount}>
                <GlassIcon tone="gold"><CreditCard /></GlassIcon>
                <span>Account<small>Add a wallet</small></span>
              </button>
              <button onClick={onLender}>
                <GlassIcon tone="teal"><HandCoins /></GlassIcon>
                <span>Lender<small>Track who owes you</small></span>
              </button>
              <button onClick={onFutureExpense}>
                <GlassIcon tone="pink"><CalendarClock /></GlassIcon>
                <span>Future Exp.<small>Plan ahead</small></span>
              </button>
              <button onClick={onVault}>
                <GlassIcon tone="violet"><ShieldCheck /></GlassIcon>
                <span>Vault<small>Precious savings</small></span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

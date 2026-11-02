'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCheck, ChevronRight, CircleHelp, X } from 'lucide-react'
import { toneColors, GlassIcon } from './ui'
import { fmt, type Notification, type Transaction } from '@/lib/supabase/db'

const slide = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
  transition: { type: 'spring', stiffness: 340, damping: 32 },
}

function Panel({ open, onClose, title, eyebrow, children }: {
  open: boolean; onClose: () => void; title: string; eyebrow: string; children: React.ReactNode
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-backdrop" style={{ alignItems: 'stretch', padding: 0 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            {...slide}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 420, background: 'var(--surface, #fff)', backdropFilter: 'blur(24px)', overflowY: 'auto', padding: '28px 20px 40px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div><p className="eyebrow">{eyebrow}</p><h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2></div>
              <button className="close-button" style={{ position: 'static' }} onClick={onClose}><X /></button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Notifications Panel ──────────────────────────────────────────────────────
export function NotificationsPanel({ open, onClose, notifications, onMarkRead }: {
  open: boolean
  onClose: () => void
  notifications: Notification[]
  onMarkRead: () => void
}) {
  return (
    <Panel open={open} onClose={onClose} eyebrow="INBOX" title="Notifications">
      {notifications.length === 0 ? (
        <div className="empty-notes glass-panel" style={{ marginTop: 20 }}>
          <Bell style={{ width: 22, color: '#7168db' }} />
          <p>No notifications yet</p>
        </div>
      ) : (
        <>
          <button className="primary-button small" style={{ marginBottom: 14 }} onClick={onMarkRead}>
            <CheckCheck style={{ width: 13 }} /> Mark all read
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notifications.map((n) => (
              <div key={n.id} className="glass-panel" style={{ padding: '12px 14px', borderRadius: 16, opacity: n.read ? 0.55 : 1 }}>
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5 }}>{n.message}</p>
                <small style={{ color: 'var(--muted)', fontSize: 9 }}>
                  {new Date(n.created_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                </small>
              </div>
            ))}
          </div>
        </>
      )}
    </Panel>
  )
}

// ─── Category Details Panel ───────────────────────────────────────────────────
export function CategoryDetailsPanel({ open, onClose, categories, transactions, month, year }: {
  open: boolean
  onClose: () => void
  categories: { label: string; value: string; rawValue: number; percent: number; tone: string }[]
  transactions: Transaction[]
  month: number
  year: number
}) {
  const expenseTxns = transactions.filter((t) => {
    const d = new Date(t.date)
    return t.type === 'expense' && d.getMonth() === month && d.getFullYear() === year
  })

  return (
    <Panel open={open} onClose={onClose} eyebrow="BREAKDOWN" title="Category Details">
      {categories.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 20 }}>No expenses recorded this month.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {categories.map((cat) => {
            const txns = expenseTxns.filter((t) => t.category === cat.label)
            return (
              <div key={cat.label} className="glass-panel" style={{ padding: '14px', borderRadius: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <GlassIcon tone={cat.tone}><span style={{ fontSize: 10, fontWeight: 800 }}>{cat.percent}%</span></GlassIcon>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>{cat.label}</p>
                    <p style={{ margin: 0, color: 'var(--muted)', fontSize: 10 }}>{txns.length} transaction{txns.length !== 1 ? 's' : ''}</p>
                  </div>
                  <strong style={{ fontSize: 13 }}>{cat.value}</strong>
                </div>
                <div className="category-bar" style={{ marginBottom: 10 }}>
                  <motion.i initial={{ width: 0 }} animate={{ width: `${cat.percent}%` }} transition={{ duration: .8 }} style={{ background: toneColors[cat.tone], display: 'block', height: '100%', borderRadius: 10 }} />
                </div>
                {txns.slice(0, 4).map((t) => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', padding: '4px 0', borderTop: '1px solid var(--line)' }}>
                    <span>{t.description || t.category}</span>
                    <span style={{ color: 'var(--ink)', fontWeight: 700 }}>{fmt(t.amount)}</span>
                  </div>
                ))}
                {txns.length > 4 && <p style={{ fontSize: 9, color: 'var(--muted)', margin: '6px 0 0' }}>+{txns.length - 4} more</p>}
              </div>
            )
          })}
        </div>
      )}
    </Panel>
  )
}

// ─── Spending Flow Details Panel ──────────────────────────────────────────────
export function SpendingFlowPanel({ open, onClose, transactions, month, year }: {
  open: boolean
  onClose: () => void
  transactions: Transaction[]
  month: number
  year: number
}) {
  const monthTxns = transactions
    .filter((t) => { const d = new Date(t.date); return d.getMonth() === month && d.getFullYear() === year })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const income = monthTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = monthTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  return (
    <Panel open={open} onClose={onClose} eyebrow="SPENDING FLOW" title="All Activity">
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <div className="glass-panel" style={{ flex: 1, padding: '10px 12px', borderRadius: 14, textAlign: 'center' }}>
          <p style={{ margin: '0 0 4px', fontSize: 9, color: 'var(--muted)' }}>INCOME</p>
          <strong style={{ fontSize: 13, color: '#18ad99' }}>{fmt(income)}</strong>
        </div>
        <div className="glass-panel" style={{ flex: 1, padding: '10px 12px', borderRadius: 14, textAlign: 'center' }}>
          <p style={{ margin: '0 0 4px', fontSize: 9, color: 'var(--muted)' }}>EXPENSES</p>
          <strong style={{ fontSize: 13, color: '#d878a1' }}>{fmt(expenses)}</strong>
        </div>
      </div>
      {monthTxns.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: 12 }}>No transactions this month.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {monthTxns.map((t) => (
            <div key={t.id} className="glass-panel" style={{ padding: '10px 14px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 11, display: 'grid', placeItems: 'center', background: t.type === 'income' ? '#d7f8f0' : '#fae3f0', color: t.type === 'income' ? '#18ad99' : '#d878a1', fontSize: 14 }}>
                {t.type === 'income' ? '↓' : '↑'}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>{t.description || t.category}</p>
                <p style={{ margin: 0, fontSize: 9, color: 'var(--muted)' }}>{t.category} · {t.date}</p>
              </div>
              <strong style={{ fontSize: 12, color: t.type === 'income' ? '#18ad99' : '#d878a1' }}>
                {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
              </strong>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

// ─── Help Panel ───────────────────────────────────────────────────────────────
export function HelpPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const items = [
    { q: 'How do I add a transaction?', a: 'Tap the + button at the bottom, then choose Income or Expense.' },
    { q: 'How do I add an account?', a: 'Tap + → Account, or use the "+ Add" button next to "Your accounts".' },
    { q: 'How do I set a savings goal?', a: 'Go to Settings tab and fill in the Savings Goal section.' },
    { q: 'Why is my net worth 0?', a: 'Add your accounts with their current balances. Net worth is the sum of all account balances.' },
    { q: 'How does the spending chart work?', a: 'The chart shows cumulative income vs expenses day-by-day for the selected month.' },
    { q: 'Can I filter by month?', a: 'Yes — tap "This month" on the Overview section to pick any month.' },
  ]
  return (
    <Panel open={open} onClose={onClose} eyebrow="SUPPORT" title="Help & FAQ">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item) => (
          <div key={item.q} className="glass-panel" style={{ padding: '12px 14px', borderRadius: 16 }}>
            <p style={{ margin: '0 0 5px', fontWeight: 700, fontSize: 12 }}>{item.q}</p>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>{item.a}</p>
          </div>
        ))}
      </div>
    </Panel>
  )
}

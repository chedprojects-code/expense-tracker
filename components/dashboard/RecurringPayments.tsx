'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarClock, ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react'
import { fmt, type Account, type RecurringTransaction } from '@/lib/supabase/db'
import { formatLocalDate } from '@/lib/date-utils'
import { SectionTitle } from './ui'

export function RecurringPayments({ rules, accounts, collapsed, onToggleCollapse, onAdd, onEdit, onDelete, onRecord }: {
  rules: RecurringTransaction[]
  accounts: Account[]
  collapsed: boolean
  onToggleCollapse: () => void
  onAdd: () => void
  onEdit: (rule: RecurringTransaction) => void
  onDelete: (id: string) => void
  onRecord: (id: string) => void
}) {
  const today = formatLocalDate()
  const [recordingId, setRecordingId] = useState('')

  const record = async (id: string) => {
    setRecordingId(id)
    try {
      await onRecord(id)
    } finally {
      setRecordingId('')
    }
  }

  return (
    <section>
      <SectionTitle
        eyebrow="RECURRING"
        title="Income & bills"
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button className="text-button" onClick={onAdd}><Plus style={{ width: 13 }} /> Add</button>
            <button className="icon-button" onClick={onToggleCollapse} aria-label={collapsed ? 'Expand recurring reminders' : 'Collapse recurring reminders'}>
              <ChevronDown style={{ width: 13, transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform .2s' }} />
            </button>
          </div>
        }
      />
      <AnimatePresence initial={false}>
        {!collapsed && <motion.div key="recurring" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
          {rules.length === 0 ? (
            <div className="glass-panel empty-notes" style={{ borderRadius: 18, padding: '18px 12px' }}>
              <CalendarClock style={{ width: 20, color: '#7168db' }} />
              <p>Set reminders for regular income or bills.</p>
            </div>
          ) : (
            <div className="glass-panel lenders-list">
              {rules.map((rule) => {
                const due = rule.next_date <= today
                const account = accounts.find((item) => item.id === rule.account_id)
                return (
                  <div key={rule.id} className="lender-row">
                    <div className="lender-avatar" style={{ background: rule.type === 'income' ? 'linear-gradient(135deg,#18ad99,#68dbce)' : 'linear-gradient(135deg,#d878a1,#f0a8c8)' }}>
                      <CalendarClock style={{ width: 14 }} />
                    </div>
                    <div className="lender-info">
                      <p>{rule.description || rule.category}</p>
                      <small>{rule.frequency} · {due ? 'Due' : 'Next'} {rule.next_date}{account ? ` · ${account.name}` : ''}</small>
                    </div>
                    <strong className="lender-amount" style={{ color: rule.type === 'income' ? '#18ad99' : '#d878a1' }}>
                      {rule.type === 'income' ? '+' : '-'}{fmt(rule.amount)}
                    </strong>
                    <div className="lender-actions">
                      <button aria-label={`Record ${rule.description || rule.category}`} disabled={!due || recordingId === rule.id} onClick={() => record(rule.id)} title={due ? 'Record this occurrence' : 'Not due yet'} style={{ color: due ? '#18ad99' : 'var(--muted)', fontSize: 9, fontWeight: 700, width: 'auto', padding: '0 6px', opacity: due && recordingId !== rule.id ? 1 : .55, cursor: due ? 'pointer' : 'not-allowed' }}>
                        {recordingId === rule.id ? 'Saving' : due ? 'Record' : 'Upcoming'}
                      </button>
                      <button aria-label="Edit recurring reminder" onClick={() => onEdit(rule)}><Pencil style={{ width: 11 }} /></button>
                      <button aria-label="Delete recurring reminder" onClick={() => onDelete(rule.id)}><Trash2 style={{ width: 11 }} /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>}
      </AnimatePresence>
    </section>
  )
}

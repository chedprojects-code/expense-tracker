'use client'

import type { Dispatch, SetStateAction } from 'react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, CreditCard, Loader2, Pencil, Plus, Save, Sparkles, Trash2, WalletCards, FileText, X, StickyNote,
} from 'lucide-react'
import { calcStats, fmt, type Note, type SavingsGoal, type Transaction } from '@/lib/supabase/db'
import type { GoalDraft, NoteDraft } from '@/components/dashboard/types'
import { GlassIcon, SectionTitle, toneColors } from './ui'

type PlainNote = { id: string; title: string; body: string; createdAt: string }

function usePlainNotes() {
  const [items, setItems] = useState<PlainNote[]>(() => {
    try { return JSON.parse(localStorage.getItem('plain-notes') || '[]') } catch { return [] }
  })
  const save = (next: PlainNote[]) => { setItems(next); localStorage.setItem('plain-notes', JSON.stringify(next)) }
  const add = (title: string, body: string) => save([{ id: Date.now().toString(), title, body, createdAt: new Date().toISOString() }, ...items])
  const edit = (id: string, title: string, body: string) => save(items.map(n => n.id === id ? { ...n, title, body } : n))
  const remove = (id: string) => save(items.filter(n => n.id !== id))
  return { items, add, edit, remove }
}

export function NotesView({ notes, onAdd, onEdit, onDelete }: {
  notes: Note[]
  onAdd: () => void
  onEdit: (note: Note) => void
  onDelete: (id: string) => void
}) {
  const plain = usePlainNotes()
  const [tab, setTab] = useState<'financial' | 'plain'>('financial')
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<PlainNote | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftBody, setDraftBody] = useState('')

  const openAdd = () => { setEditing(null); setDraftTitle(''); setDraftBody(''); setShowDialog(true) }
  const openEdit = (n: PlainNote) => { setEditing(n); setDraftTitle(n.title); setDraftBody(n.body); setShowDialog(true) }
  const handleSave = () => {
    if (!draftTitle.trim()) return
    editing ? plain.edit(editing.id, draftTitle, draftBody) : plain.add(draftTitle, draftBody)
    setShowDialog(false)
  }

  return (
    <section className="notes-page">
      <SectionTitle
        eyebrow="NOTES"
        title="Your notes"
        action={
          tab === 'financial'
            ? <button className="primary-button small" onClick={onAdd}><Plus /> Add note</button>
            : <button className="primary-button small" onClick={openAdd}><Plus /> Add note</button>
        }
      />

      {/* Tab switcher */}
      <div className="notes-tabs">
        <button className={tab === 'financial' ? 'notes-tab active' : 'notes-tab'} onClick={() => setTab('financial')}>
          <WalletCards style={{ width: 13 }} /> Financial
        </button>
        <button className={tab === 'plain' ? 'notes-tab active' : 'notes-tab'} onClick={() => setTab('plain')}>
          <StickyNote style={{ width: 13 }} /> Plain Notes
        </button>
      </div>

      {tab === 'financial' && (
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
              <p>No financial notes yet</p>
              <button className="text-button" onClick={onAdd}>Add your first note</button>
            </div>
          )}
        </div>
      )}

      {tab === 'plain' && (
        <div className="notes-list">
          <AnimatePresence>
            {plain.items.map((n) => (
              <motion.article layout key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-panel note-card plain-note-card">
                <div className="note-card-top">
                  <GlassIcon tone="violet"><FileText /></GlassIcon>
                  <span className="note-tag" style={{ background: '#e7e4ff', color: '#7168db' }}>Note</span>
                  <div className="note-actions">
                    <button onClick={() => openEdit(n)}><Pencil /></button>
                    <button onClick={() => plain.remove(n.id)}><Trash2 /></button>
                  </div>
                </div>
                <h3>{n.title}</h3>
                {n.body && <p className="plain-note-body">{n.body}</p>}
                <div className="note-meta">
                  <small>{new Date(n.createdAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</small>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
          {plain.items.length === 0 && (
            <div className="empty-notes glass-panel">
              <StickyNote style={{ width: 25, color: '#7168db' }} />
              <p>No plain notes yet</p>
              <button className="text-button" onClick={openAdd}>Write your first note</button>
            </div>
          )}
        </div>
      )}

      {/* Plain note dialog */}
      <AnimatePresence>
        {showDialog && (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDialog(false)}>
            <motion.div className="note-dialog glass-panel" initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <button className="close-button" onClick={() => setShowDialog(false)}><X /></button>
              <h2>{editing ? 'Edit Note' : 'New Note'}</h2>
              <label>Title
                <input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} placeholder="Note title" autoFocus />
              </label>
              <label style={{ marginTop: 12 }}>Content
                <textarea
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                  placeholder="Write anything..."
                  rows={5}
                  style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 12, padding: 11, background: 'var(--surface)', color: 'var(--ink)', outline: 0, font: 'inherit', fontSize: 12, resize: 'vertical' }}
                />
              </label>
              <button className="primary-button" onClick={handleSave} disabled={!draftTitle.trim()} style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Save style={{ width: 14 }} />{editing ? 'Update Note' : 'Save Note'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export function InsightsView({ stats, transactions, month, year }: {
  stats: ReturnType<typeof calcStats>
  transactions: Transaction[]
  month: number
  year: number
}) {
  const monthTxns = transactions.filter((transaction) => {
    const date = new Date(transaction.date)
    return date.getMonth() === month && date.getFullYear() === year
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
            : stats.allCategories.map((category) => (
              <div key={category.label} className="category-item">
                <span className="category-name"><i style={{ background: toneColors[category.tone] }} />{category.label}</span>
                <strong>{category.value}</strong>
                <div className="category-bar">
                  <motion.i initial={{ width: 0 }} animate={{ width: `${category.percent}%` }} transition={{ duration: .8 }} style={{ background: toneColors[category.tone], display: 'block', height: '100%', borderRadius: 10 }} />
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </section>
  )
}

export function SettingsView({ profileDraft, setProfileDraft, onSaveProfile, savingProfile, goalDraft, setGoalDraft, onSaveGoal, goal, goalPercent }: {
  profileDraft: { name: string; initials: string }
  setProfileDraft: Dispatch<SetStateAction<{ name: string; initials: string }>>
  onSaveProfile: () => void
  savingProfile: boolean
  goalDraft: GoalDraft
  setGoalDraft: Dispatch<SetStateAction<GoalDraft>>
  onSaveGoal: () => void
  goal: SavingsGoal | null
  goalPercent: number
}) {
  const inputStyle = { border: '1px solid var(--line)', borderRadius: 10, padding: '9px 11px', background: 'var(--surface)', color: 'var(--ink)', font: 'inherit', fontSize: 12, width: '100%' }

  return (
    <section className="settings-page">
      <SectionTitle eyebrow="SETTINGS" title="Your profile & money" />

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

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, FileText, Eye, Pencil, Plus, Save, ShoppingCart, StickyNote,
  Trash2, WalletCards, X,
} from 'lucide-react'
import { fmt, type BuyListItem, type Note, type PlainNote } from '@/lib/supabase/db'
import { GlassIcon, SectionTitle } from './ui'
import { BuyListContent } from './BuyListContent'

export function NotesView({
  notes,
  onAdd,
  onEdit,
  onDelete,
  plainNotes,
  onSavePlainNote,
  onDeletePlainNote,
  buyListItems,
  onAddBuyItem,
  onToggleBuyItem,
  onEditBuyItem,
  onDeleteBuyItem,
  initialTab,
}: {
  notes: Note[]
  onAdd: () => void
  onEdit: (note: Note) => void
  onDelete: (id: string) => void
  plainNotes: PlainNote[]
  onSavePlainNote: (id: string | null, title: string, body: string) => Promise<void>
  onDeletePlainNote: (id: string) => Promise<void>
  buyListItems: BuyListItem[]
  onAddBuyItem: (title: string, category: 'need' | 'want', price: number | null) => Promise<void>
  onToggleBuyItem: (id: string, bought: boolean) => Promise<void>
  onEditBuyItem: (id: string, title: string, price: number | null, category: 'need' | 'want') => Promise<void>
  onDeleteBuyItem: (id: string) => Promise<void>
  initialTab?: 'financial' | 'plain' | 'buylist'
}) {
  const [tab, setTab] = useState<'financial' | 'plain' | 'buylist'>(initialTab ?? 'financial')

  useEffect(() => { if (initialTab) setTab(initialTab) }, [initialTab])
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<PlainNote | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftBody, setDraftBody] = useState('')
  const [viewing, setViewing] = useState<PlainNote | null>(null)

  const openAdd = () => { setEditing(null); setDraftTitle(''); setDraftBody(''); setShowDialog(true) }
  const openEdit = (note: PlainNote) => { setEditing(note); setDraftTitle(note.title); setDraftBody(note.body); setShowDialog(true) }
  const handleSave = async () => {
    if (!draftTitle.trim()) return
    await onSavePlainNote(editing?.id ?? null, draftTitle, draftBody)
    setShowDialog(false)
  }

  const notesTotal = notes.reduce((sum, note) => sum + note.amount, 0)
  const truncate = (str: string, max = 50) => str.length > max ? str.slice(0, max) + '…' : str

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

      <div className="notes-tabs">
        <button className={tab === 'financial' ? 'notes-tab active' : 'notes-tab'} onClick={() => setTab('financial')}>
          <WalletCards style={{ width: 15 }} /> Financial
        </button>
        <button className={tab === 'plain' ? 'notes-tab active' : 'notes-tab'} onClick={() => setTab('plain')}>
          <StickyNote style={{ width: 15 }} /> Plain
        </button>
        <button className={tab === 'buylist' ? 'notes-tab active' : 'notes-tab'} onClick={() => setTab('buylist')}>
          <ShoppingCart style={{ width: 15 }} /> Buy List
        </button>
      </div>

      {tab === 'financial' && (
        <div className="notes-list">
          {notes.length > 0 && (
            <div className="glass-panel" style={{ padding: '10px 14px', borderRadius: 16, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="eyebrow">TOTAL</span>
              <strong style={{ fontSize: 14, color: '#18ad99' }}>{fmt(notesTotal)}</strong>
            </div>
          )}
          {notes.map((note) => (
            <motion.article layout key={note.id} className="glass-panel note-card" id={`search-result-financialNote-${note.id}`}>
              <div className="note-card-top">
                <GlassIcon tone={note.category === 'Pay' ? 'pink' : 'teal'}><Calendar /></GlassIcon>
                <span className={`note-tag ${note.category.toLowerCase()}`}>{note.category}</span>
                <div className="note-actions">
                  <button onClick={() => onEdit(note)}><Pencil /></button>
                  <button onClick={() => onDelete(note.id)}><Trash2 /></button>
                </div>
              </div>
              <h3>{note.title}</h3>
              <strong>
                {note.amount_max != null
                  ? `${fmt(note.amount)} – ${fmt(note.amount_max)}`
                  : fmt(note.amount)}
              </strong>
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
            {plainNotes.map((note) => (
              <motion.article
                layout key={note.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel note-card plain-note-card"
                style={{ cursor: 'pointer' }}
                id={`search-result-plainNote-${note.id}`}
                onClick={() => setViewing(note)}
              >
                <div className="note-card-top">
                  <GlassIcon tone="violet"><FileText /></GlassIcon>
                  <span className="note-tag" style={{ background: '#e7e4ff', color: '#7168db' }}>Note</span>
                  <div className="note-actions" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openEdit(note)}><Pencil /></button>
                    <button onClick={() => onDeletePlainNote(note.id)}><Trash2 /></button>
                  </div>
                </div>
                <h3>{note.title}</h3>
                {note.body && (
                  <p className="plain-note-body" style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                    {truncate(note.body)}
                  </p>
                )}
                <div className="note-meta" style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <small>{new Date(note.created_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</small>
                  {note.body && note.body.length > 50 && (
                    <span style={{ fontSize: 9, color: '#7168db', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Eye style={{ width: 9 }} /> Read more
                    </span>
                  )}
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
          {plainNotes.length === 0 && (
            <div className="empty-notes glass-panel">
              <StickyNote style={{ width: 25, color: '#7168db' }} />
              <p>No plain notes yet</p>
              <button className="text-button" onClick={openAdd}>Write your first note</button>
            </div>
          )}
        </div>
      )}

      {tab === 'buylist' && (
        <BuyListContent
          items={buyListItems}
          onAdd={onAddBuyItem}
          onToggle={onToggleBuyItem}
          onEdit={onEditBuyItem}
          onDelete={onDeleteBuyItem}
        />
      )}

      <AnimatePresence>
        {viewing && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setViewing(null)}
          >
            <motion.div
              className="note-dialog glass-panel"
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ maxHeight: '80vh', overflowY: 'auto' }}
            >
              <button className="close-button" onClick={() => setViewing(null)}><X /></button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <GlassIcon tone="violet"><FileText /></GlassIcon>
                <div>
                  <p style={{ margin: 0, fontSize: 9, color: 'var(--muted)', fontWeight: 700, letterSpacing: '.06em' }}>PLAIN NOTE</p>
                  <h2 style={{ margin: 0, fontSize: 17, lineHeight: 1.3 }}>{viewing.title}</h2>
                </div>
              </div>
              {viewing.body ? (
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.75, color: 'var(--ink)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {viewing.body}
                </p>
              ) : (
                <p style={{ color: 'var(--muted)', fontSize: 12, fontStyle: 'italic' }}>No content.</p>
              )}
              <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <small style={{ color: 'var(--muted)', fontSize: 10 }}>
                  {new Date(viewing.created_at).toLocaleString('en-NG', { dateStyle: 'long', timeStyle: 'short' })}
                </small>
                <button
                  className="primary-button small"
                  onClick={() => { openEdit(viewing); setViewing(null) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <Pencil style={{ width: 12 }} /> Edit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

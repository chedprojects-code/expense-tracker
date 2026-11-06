'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, FileText, GripVertical, Pencil, Plus, Save, StickyNote, Trash2, X } from 'lucide-react'
import { type PlainNote } from '@/lib/supabase/db'
import { GlassIcon } from './ui'
import { useDragSort } from '@/hooks/useDragSort'

const truncate = (str: string, max = 50) => str.length > max ? str.slice(0, max) + '…' : str

export function PlainNotes({
  plainNotes,
  onSavePlainNote,
  onDeletePlainNote,
  onReorder,
}: {
  plainNotes: PlainNote[]
  onSavePlainNote: (id: string | null, title: string, body: string) => Promise<void>
  onDeletePlainNote: (id: string) => Promise<void>
  onReorder: (reordered: PlainNote[]) => void
}) {
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<PlainNote | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftBody, setDraftBody] = useState('')
  const [viewing, setViewing] = useState<PlainNote | null>(null)
  const { onDragStart, onDragOver, onDrop, onDragEnd, dragId } = useDragSort(plainNotes, onReorder)

  const openAdd = () => { setEditing(null); setDraftTitle(''); setDraftBody(''); setShowDialog(true) }
  const openEdit = (note: PlainNote) => { setEditing(note); setDraftTitle(note.title); setDraftBody(note.body); setShowDialog(true) }
  const handleSave = async () => {
    if (!draftTitle.trim()) return
    await onSavePlainNote(editing?.id ?? null, draftTitle, draftBody)
    setShowDialog(false)
  }

  return (
    <div className='mt-8'>
      <div className="notes-module-header">
        <h3>Plain notes</h3>
        <button className="primary-button small" onClick={openAdd}><Plus /> Add note</button>
      </div>
      <div className="notes-list">
        <AnimatePresence>
          {plainNotes.map((note) => (
            <motion.article
              layout key={note.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className={`glass-panel note-card plain-note-card${dragId.current === note.id ? ' dragging' : ''}`}
              style={{ cursor: 'grab' }}
              id={`search-result-plainNote-${note.id}`}
              draggable
              onDragStart={() => onDragStart(note.id)}
              onDragOver={(e) => onDragOver(e, note.id)}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
            >
              <div className="note-card-top">
                <GlassIcon tone="violet"><FileText /></GlassIcon>
                <span className="note-tag" style={{ background: '#e7e4ff', color: '#7168db' }}>Note</span>
                <div className="note-actions" onClick={(e) => e.stopPropagation()}>
                  <GripVertical style={{ width: 13, color: 'var(--muted)', cursor: 'grab' }} />
                  <button onClick={() => openEdit(note)}><Pencil /></button>
                  <button onClick={() => onDeletePlainNote(note.id)}><Trash2 /></button>
                </div>
              </div>
              <h3 style={{ cursor: 'pointer' }} onClick={() => setViewing(note)}>{note.title}</h3>
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
          </div>
        )}
      </div>

      {/* View modal */}
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

      {/* Edit/Add dialog */}
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
    </div>
  )
}

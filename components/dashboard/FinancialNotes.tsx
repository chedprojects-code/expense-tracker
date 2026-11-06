'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Calendar, GripVertical, Pencil, Plus, Trash2, WalletCards } from 'lucide-react'
import { fmt, type Note } from '@/lib/supabase/db'
import { GlassIcon } from './ui'
import { useDragSort } from '@/hooks/useDragSort'

export function FinancialNotes({
  notes,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
}: {
  notes: Note[]
  onAdd: () => void
  onEdit: (note: Note) => void
  onDelete: (id: string) => void
  onReorder: (reordered: Note[]) => void
}) {
  const notesTotal = notes.reduce((sum, note) => sum + note.amount, 0)
  const { onDragStart, onDragOver, onDrop, onDragEnd, dragId } = useDragSort(notes, onReorder)

  return (
    <div className='mt-8'>
      <div className="notes-module-header">
        <h3>Financial notes</h3>
        <button className="primary-button small" onClick={onAdd}><Plus /> Add note</button>
      </div>
      <div className="notes-list">
        {notes.length > 0 && (
          <div className="glass-panel" style={{ padding: '10px 14px', borderRadius: 16, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="eyebrow">TOTAL</span>
            <strong style={{ fontSize: 14, color: '#18ad99' }}>{fmt(notesTotal)}</strong>
          </div>
        )}
        {notes.map((note) => (
          <motion.article
            layout key={note.id}
            className={`glass-panel note-card${dragId.current === note.id ? ' dragging' : ''}`}
            id={`search-result-financialNote-${note.id}`}
            draggable
            onDragStart={() => onDragStart(note.id)}
            onDragOver={(e) => onDragOver(e, note.id)}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
            style={{ cursor: 'grab' }}
          >
            <div className="note-card-top">
              <GlassIcon tone={note.category === 'Pay' ? 'pink' : 'teal'}><Calendar /></GlassIcon>
              <span className={`note-tag ${note.category.toLowerCase()}`}>{note.category}</span>
              <div className="note-actions">
                <GripVertical style={{ width: 13, color: 'var(--muted)', cursor: 'grab' }} />
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
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Archive, ArchiveRestore, ArrowDown, ArrowUp, Calendar, GripVertical, Pencil, Pin, Plus, Trash2, WalletCards } from 'lucide-react'
import { fmt, type Note } from '@/lib/supabase/db'
import { getNoteDueLabel, getNoteDueStatus } from '@/lib/notes-utils'
import { GlassIcon } from './ui'
import { useDragSort } from '@/hooks/useDragSort'
import { CopyToClipboardButton } from './CopyToClipboardButton'

function getNoteCopyText(note: Note) {
  const amount = note.amount_max != null
    ? `${fmt(note.amount)} – ${fmt(note.amount_max)}`
    : fmt(note.amount)
  return `${note.title}\nCategory: ${note.category}\nAmount: ${amount}\nDue: ${note.due_date}`
}

export function FinancialNotes({
  notes,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
  onTogglePinned,
  onToggleArchived,
  emptyMessage,
}: {
  notes: Note[]
  onAdd: () => void
  onEdit: (note: Note) => void
  onDelete: (id: string) => void
  onReorder: (reordered: Note[]) => void
  onTogglePinned: (id: string, pinned: boolean) => void
  onToggleArchived: (id: string, archived: boolean) => void
  emptyMessage?: string
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
        {notes.map((note, index) => (
          <motion.article
            layout key={note.id}
            className={`glass-panel note-card financial-note-card${dragId.current === note.id ? ' dragging' : ''}`}
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
              {note.archived && <span className="note-tag archived">Archived</span>}
              <div className="note-actions">
                <GripVertical style={{ width: 13, color: 'var(--muted)', cursor: 'grab' }} />
                <button type="button" aria-label={`Move ${note.title} up`} title="Move up" disabled={index === 0} onClick={() => {
                  if (index === 0) return
                  const reordered = [...notes]
                  ;[reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]]
                  onReorder(reordered)
                }}><ArrowUp /></button>
                <button type="button" aria-label={`Move ${note.title} down`} title="Move down" disabled={index === notes.length - 1} onClick={() => {
                  if (index === notes.length - 1) return
                  const reordered = [...notes]
                  ;[reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]]
                  onReorder(reordered)
                }}><ArrowDown /></button>
                <button type="button" className={note.pinned ? 'note-flag active' : 'note-flag'} aria-label={note.pinned ? 'Unpin note' : 'Pin note'} title={note.pinned ? 'Unpin note' : 'Pin note'} onClick={() => onTogglePinned(note.id, !note.pinned)}><Pin /></button>
                <button type="button" aria-label={note.archived ? 'Restore note' : 'Archive note'} title={note.archived ? 'Restore note' : 'Archive note'} onClick={() => onToggleArchived(note.id, !note.archived)}>{note.archived ? <ArchiveRestore /> : <Archive />}</button>
                <button type="button" aria-label="Edit note" onClick={() => onEdit(note)}><Pencil /></button>
                <button type="button" aria-label="Delete note" onClick={() => onDelete(note.id)}><Trash2 /></button>
              </div>
            </div>
            <h3>{note.title}</h3>
            <strong>
              {note.amount_max != null
                ? `${fmt(note.amount)} – ${fmt(note.amount_max)}`
                : fmt(note.amount)}
            </strong>
            {note.tags?.length > 0 && <div className="note-custom-tags">{note.tags.map((tag) => <span className="note-custom-tag" key={tag}>{tag}</span>)}</div>}
            <div className="note-meta">
              <span className={`note-due ${getNoteDueStatus(note.due_date)}`}><Calendar /> {getNoteDueLabel(note.due_date)}</span>
              <small>Edited {new Date(note.updated_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</small>
            </div>
            <div className="note-card-copy-row"><CopyToClipboardButton text={getNoteCopyText(note)} label="financial note" showLabel /></div>
          </motion.article>
        ))}
        {notes.length === 0 && (
          <div className="empty-notes glass-panel">
            <WalletCards />
            <p>{emptyMessage ?? 'No financial notes yet'}</p>
          </div>
        )}
      </div>
    </div>
  )
}

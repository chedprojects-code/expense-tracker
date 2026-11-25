'use client'

import { useMemo, useState } from 'react'
import { AlarmClock, Search, ShoppingCart, StickyNote, WalletCards } from 'lucide-react'
import { type BuyListItem, type Note, type PlainNote } from '@/lib/supabase/db'
import { getNoteDueStatus } from '@/lib/notes-utils'
import { SectionTitle } from './ui'
import { BuyListContent } from './BuyListContent'
import { FinancialNotes } from './FinancialNotes'
import { PlainNotes } from './PlainNotes'

export function NotesView({
  notes,
  onAdd,
  onEdit,
  onDelete,
  onReorderNotes,
  onSetFinancialNoteFlags,
  plainNotes,
  onSavePlainNote,
  onDeletePlainNote,
  onReorderPlainNotes,
  onSetPlainNoteFlags,
  buyListItems,
  onAddBuyItem,
  onToggleBuyItem,
  onEditBuyItem,
  onDeleteBuyItem,
  onReorderBuyItems,
  tab,
  onTabChange,
  buyTab,
  onBuyTabChange,
}: {
  notes: Note[]
  onAdd: () => void
  onEdit: (note: Note) => void
  onDelete: (id: string) => void
  onReorderNotes: (reordered: Note[]) => void
  onSetFinancialNoteFlags: (id: string, updates: { pinned?: boolean; archived?: boolean }) => void
  plainNotes: PlainNote[]
  onSavePlainNote: (id: string | null, title: string, body: string, tags: string[], dueDate: string | null) => Promise<void>
  onDeletePlainNote: (id: string) => Promise<void>
  onReorderPlainNotes: (reordered: PlainNote[]) => void
  onSetPlainNoteFlags: (id: string, updates: { pinned?: boolean; archived?: boolean }) => void
  buyListItems: BuyListItem[]
  onAddBuyItem: (title: string, category: 'need' | 'want', price: number | null) => Promise<void>
  onToggleBuyItem: (id: string, bought: boolean) => Promise<void>
  onEditBuyItem: (id: string, title: string, price: number | null, category: 'need' | 'want') => Promise<void>
  onDeleteBuyItem: (id: string) => Promise<void>
  onReorderBuyItems: (reordered: BuyListItem[]) => void
  tab: 'financial' | 'plain' | 'buylist'
  onTabChange: (tab: 'financial' | 'plain' | 'buylist') => void
  buyTab: 'need' | 'want'
  onBuyTabChange: (tab: 'need' | 'want') => void
}) {
  const [query, setQuery] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'pinned' | 'archived' | 'all'>('active')
  const [dueFilter, setDueFilter] = useState<'all' | 'overdue' | 'soon'>('all')
  const allTags = useMemo(
    () => [...new Set([...notes.flatMap((note) => note.tags ?? []), ...plainNotes.flatMap((note) => note.tags ?? [])])]
      .sort((a, b) => a.localeCompare(b)),
    [notes, plainNotes]
  )
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const matchesFilters = (note: Note | PlainNote) => {
    if (statusFilter === 'active' && note.archived) return false
    if (statusFilter === 'archived' && !note.archived) return false
    if (statusFilter === 'pinned' && (!note.pinned || note.archived)) return false
    if (tagFilter && !(note.tags ?? []).some((tag) => tag.toLocaleLowerCase() === tagFilter.toLocaleLowerCase())) return false
    if (dueFilter === 'overdue' && getNoteDueStatus(note.due_date) !== 'overdue') return false
    if (dueFilter === 'soon' && !['today', 'soon'].includes(getNoteDueStatus(note.due_date))) return false
    if (!normalizedQuery) return true
    const text = 'amount' in note
      ? `${note.title} ${note.category} ${note.tags?.join(' ') ?? ''} ${note.amount} ${note.amount_max ?? ''} ${note.due_date}`
      : `${note.title} ${note.body} ${note.tags?.join(' ') ?? ''} ${note.due_date ?? ''}`
    return text.toLocaleLowerCase().includes(normalizedQuery)
  }
  const filteredNotes = notes.filter(matchesFilters).sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.sort_order - b.sort_order)
  const filteredPlainNotes = plainNotes.filter(matchesFilters).sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.sort_order - b.sort_order)
  const mergeVisibleOrder = <T extends { id: string }>(reorderedVisible: T[], allItems: T[]) => {
    const visibleIds = new Set(reorderedVisible.map((item) => item.id))
    let visibleIndex = 0
    return allItems.map((item) => visibleIds.has(item.id) ? reorderedVisible[visibleIndex++] : item)
  }
  const activeDueNotes = [...notes.filter((note) => !note.archived), ...plainNotes.filter((note) => !note.archived)]
  const overdueCount = activeDueNotes.filter((note) => getNoteDueStatus(note.due_date) === 'overdue').length
  const upcomingCount = activeDueNotes.filter((note) => ['today', 'soon'].includes(getNoteDueStatus(note.due_date))).length
  const reminderFilter = overdueCount ? 'overdue' : 'soon'
  const hasFinancialReminder = notes.some((note) => !note.archived && (
    reminderFilter === 'overdue'
      ? getNoteDueStatus(note.due_date) === 'overdue'
      : ['today', 'soon'].includes(getNoteDueStatus(note.due_date))
  ))
  const emptyMessage = notes.length + plainNotes.length > 0 ? 'No notes match these filters.' : undefined
  const showNoteFilters = tab !== 'buylist'

  return (
    <section className="notes-page">
      <SectionTitle eyebrow="NOTES" title="Your notes" />
      {showNoteFilters && (overdueCount > 0 || upcomingCount > 0) && (
        <div className="notes-reminder-banner" role="status">
          <AlarmClock />
          <div>
            <strong>In-app due reminders</strong>
            <span>{overdueCount} overdue · {upcomingCount} due in the next 7 days</span>
          </div>
          <button type="button" onClick={() => {
            setStatusFilter('active')
            setDueFilter(reminderFilter)
            onTabChange(hasFinancialReminder ? 'financial' : 'plain')
          }}>Review</button>
        </div>
      )}

      <div className="notes-tabs">
        <button className={tab === 'financial' ? 'notes-tab active' : 'notes-tab'} onClick={() => onTabChange('financial')}>
          <WalletCards style={{ width: 15 }} /> Financial
        </button>
        <button className={tab === 'buylist' ? 'notes-tab active' : 'notes-tab'} onClick={() => onTabChange('buylist')}>
          <ShoppingCart style={{ width: 15 }} /> Buy List
        </button>
        <button className={tab === 'plain' ? 'notes-tab active' : 'notes-tab'} onClick={() => onTabChange('plain')} style={{ marginLeft: 'auto' }}>
          <StickyNote style={{ width: 15 }} /> Plain
        </button>
      </div>

      {showNoteFilters && (
        <div className="notes-filter-bar">
          <label className="notes-search">
            <Search />
            <input aria-label="Search notes" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title, content, or tags" />
          </label>
          <select aria-label="Filter notes by tag" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
            <option value="">All tags</option>
            {allTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
          </select>
          <select aria-label="Filter notes by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
            <option value="active">Active</option>
            <option value="pinned">Pinned</option>
            <option value="archived">Archived</option>
            <option value="all">All notes</option>
          </select>
          <select aria-label="Filter notes by due date" value={dueFilter} onChange={(e) => setDueFilter(e.target.value as typeof dueFilter)}>
            <option value="all">Any due date</option>
            <option value="soon">Due in 7 days</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      )}

      {tab === 'financial' && (
        <FinancialNotes
          notes={filteredNotes}
          onAdd={onAdd}
          onEdit={onEdit}
          onDelete={onDelete}
          onReorder={(reordered) => onReorderNotes(mergeVisibleOrder(reordered, notes))}
          onTogglePinned={(id, pinned) => onSetFinancialNoteFlags(id, { pinned })}
          onToggleArchived={(id, archived) => onSetFinancialNoteFlags(id, { archived })}
          emptyMessage={emptyMessage}
        />
      )}

      {tab === 'plain' && (
        <PlainNotes
          plainNotes={filteredPlainNotes}
          onSavePlainNote={onSavePlainNote}
          onDeletePlainNote={onDeletePlainNote}
          onReorder={(reordered) => onReorderPlainNotes(mergeVisibleOrder(reordered, plainNotes))}
          onTogglePinned={(id, pinned) => onSetPlainNoteFlags(id, { pinned })}
          onToggleArchived={(id, archived) => onSetPlainNoteFlags(id, { archived })}
          emptyMessage={emptyMessage}
        />
      )}

      {tab === 'buylist' && (
        <BuyListContent
          items={buyListItems}
          onAdd={onAddBuyItem}
          onToggle={onToggleBuyItem}
          onEdit={onEditBuyItem}
          onDelete={onDeleteBuyItem}
          onReorder={onReorderBuyItems}
          buyTab={buyTab}
          onBuyTabChange={onBuyTabChange}
        />
      )}
    </section>
  )
}

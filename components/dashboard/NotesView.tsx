'use client'

import { ShoppingCart, StickyNote, WalletCards } from 'lucide-react'
import { type BuyListItem, type Note, type PlainNote } from '@/lib/supabase/db'
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
  plainNotes,
  onSavePlainNote,
  onDeletePlainNote,
  onReorderPlainNotes,
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
  plainNotes: PlainNote[]
  onSavePlainNote: (id: string | null, title: string, body: string) => Promise<void>
  onDeletePlainNote: (id: string) => Promise<void>
  onReorderPlainNotes: (reordered: PlainNote[]) => void
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
  return (
    <section className="notes-page">
      <SectionTitle eyebrow="NOTES" title="Your notes" />

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

      {tab === 'financial' && (
        <FinancialNotes notes={notes} onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} onReorder={onReorderNotes} />
      )}

      {tab === 'plain' && (
        <PlainNotes plainNotes={plainNotes} onSavePlainNote={onSavePlainNote} onDeletePlainNote={onDeletePlainNote} onReorder={onReorderPlainNotes} />
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

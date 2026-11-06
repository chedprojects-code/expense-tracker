'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Circle, GripVertical, Pencil, ShoppingCart, Trash2 } from 'lucide-react'
import { fmt, type BuyListItem } from '@/lib/supabase/db'
import { useDragSort } from '@/hooks/useDragSort'

export function BuyListItems({
  items,
  category,
  onToggle,
  onEdit,
  onDelete,
  onReorder,
}: {
  items: BuyListItem[]
  category: 'need' | 'want'
  onToggle: (id: string, bought: boolean) => Promise<void>
  onEdit: (item: BuyListItem) => void
  onDelete: (id: string) => Promise<void>
  onReorder: (reordered: BuyListItem[]) => void
}) {
  const total = items.reduce((sum, i) => sum + (i.price ?? 0), 0)
  const boughtTotal = items.filter((i) => i.bought).reduce((sum, i) => sum + (i.price ?? 0), 0)
  const { onDragStart, onDragOver, onDrop, onDragEnd, dragId } = useDragSort(items, onReorder)

  return (
    <>
      {items.length > 0 && (
        <div className="buy-totals glass-panel">
          <div className="buy-totals-row">
            <span className="eyebrow">LEFT TO SPEND</span>
            <strong style={{ color: '#7168db' }}>{total > 0 ? fmt(total - boughtTotal) : '—'}</strong>
          </div>
          <div className="buy-totals-row">
            <span className="eyebrow">BOUGHT</span>
            <strong style={{ color: '#18ad99' }}>{boughtTotal > 0 ? fmt(boughtTotal) : '—'}</strong>
          </div>
          <div className="buy-totals-row">
            <span className="eyebrow">PROGRESS</span>
            <strong>{items.filter((i) => i.bought).length}/{items.length} items</strong>
          </div>
        </div>
      )}

      <div className="notes-list">
        {items.length === 0 && (
          <div className="empty-notes glass-panel">
            <ShoppingCart style={{ width: 25, color: '#7168db' }} />
            <p>No {category}s yet</p>
          </div>
        )}
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              layout key={item.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className={`buy-item glass-panel${item.bought ? ' bought' : ''}${dragId.current === item.id ? ' dragging' : ''}`}
              id={`search-result-buyListItem-${item.id}`}
              draggable
              onDragStart={() => onDragStart(item.id)}
              onDragOver={(e) => onDragOver(e, item.id)}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
            >
              <GripVertical style={{ width: 13, color: 'var(--muted)', cursor: 'grab', flexShrink: 0 }} />
              <button className="buy-check" onClick={() => onToggle(item.id, item.bought)}>
                {item.bought
                  ? <CheckCircle2 style={{ width: 18, color: '#18ad99' }} />
                  : <Circle style={{ width: 18, color: 'var(--muted)' }} />}
              </button>
              <div className="buy-info">
                <span className="buy-title">{item.title}</span>
                {item.price != null && <span className="buy-price">{fmt(item.price)}</span>}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="buy-delete" onClick={() => onEdit(item)}><Pencil style={{ width: 12 }} /></button>
                <button className="buy-delete" onClick={() => onDelete(item.id)}><Trash2 style={{ width: 13 }} /></button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  )
}

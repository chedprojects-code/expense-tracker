'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Circle, Pencil, Plus, Save, ShoppingCart, Sparkles, Trash2, X } from 'lucide-react'
import { fmt, type BuyListItem } from '@/lib/supabase/db'

export function BuyListContent({ items, onAdd, onToggle, onEdit, onDelete }: {
  items: BuyListItem[]
  onAdd: (title: string, category: 'need' | 'want', price: number | null) => Promise<void>
  onToggle: (id: string, bought: boolean) => Promise<void>
  onEdit: (id: string, title: string, price: number | null, category: 'need' | 'want') => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [buyTab, setBuyTab] = useState<'need' | 'want'>('need')
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [editingItem, setEditingItem] = useState<BuyListItem | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editCategory, setEditCategory] = useState<'need' | 'want'>('need')

  const filtered = items.filter((item) => item.category === buyTab)
  const boughtCount = filtered.filter((item) => item.bought).length
  const total = filtered.reduce((sum, item) => sum + (item.price ?? 0), 0)
  const boughtTotal = filtered.filter((item) => item.bought).reduce((sum, item) => sum + (item.price ?? 0), 0)

  const handleAdd = async () => {
    if (!title.trim()) return
    await onAdd(title.trim(), buyTab, price ? parseFloat(price) : null)
    setTitle('')
    setPrice('')
  }

  const openEdit = (item: BuyListItem) => {
    setEditingItem(item)
    setEditTitle(item.title)
    setEditPrice(item.price != null ? String(item.price) : '')
    setEditCategory(item.category)
  }

  const handleSaveEdit = async () => {
    if (!editingItem || !editTitle.trim()) return
    await onEdit(editingItem.id, editTitle.trim(), editPrice ? parseFloat(editPrice) : null, editCategory)
    setEditingItem(null)
  }

  return (
    <div>
      <div className="notes-tabs" style={{ marginBottom: 12 }}>
        <button className={buyTab === 'need' ? 'notes-tab active' : 'notes-tab'} onClick={() => setBuyTab('need')}>
          <ShoppingCart style={{ width: 13 }} /> Needs
        </button>
        <button className={buyTab === 'want' ? 'notes-tab active' : 'notes-tab'} onClick={() => setBuyTab('want')}>
          <Sparkles style={{ width: 13 }} /> Wants
        </button>
      </div>

      <div className="buy-add-row">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={`Add a ${buyTab}...`}
          className="buy-input"
        />
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price"
          inputMode="decimal"
          className="buy-input buy-price-input"
        />
        <button className="buy-add-btn" onClick={handleAdd} disabled={!title.trim()}>
          <Plus style={{ width: 15 }} />
        </button>
      </div>

      {filtered.length > 0 && (
        <div className="buy-totals glass-panel">
          <div className="buy-totals-row">
            <span className="eyebrow">TOTAL</span>
            <strong style={{ color: '#7168db' }}>{total > 0 ? fmt(total) : '—'}</strong>
          </div>
          <div className="buy-totals-row">
            <span className="eyebrow">BOUGHT</span>
            <strong style={{ color: '#18ad99' }}>{boughtTotal > 0 ? fmt(boughtTotal) : '—'}</strong>
          </div>
          <div className="buy-totals-row">
            <span className="eyebrow">PROGRESS</span>
            <strong>{boughtCount}/{filtered.length} items</strong>
          </div>
        </div>
      )}

      <div className="notes-list">
        {filtered.length === 0 && (
          <div className="empty-notes glass-panel">
            <ShoppingCart style={{ width: 25, color: '#7168db' }} />
            <p>No {buyTab}s yet</p>
          </div>
        )}
        <AnimatePresence>
          {filtered.map((item) => (
            <motion.div
              layout key={item.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className={`buy-item glass-panel${item.bought ? ' bought' : ''}`}
            >
              <button className="buy-check" onClick={() => onToggle(item.id, item.bought)}>
                {item.bought ? <CheckCircle2 style={{ width: 18, color: '#18ad99' }} /> : <Circle style={{ width: 18, color: 'var(--muted)' }} />}
              </button>
              <div className="buy-info">
                <span className="buy-title">{item.title}</span>
                {item.price != null && <span className="buy-price">{fmt(item.price)}</span>}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="buy-delete" onClick={() => openEdit(item)}><Pencil style={{ width: 12 }} /></button>
                <button className="buy-delete" onClick={() => onDelete(item.id)}><Trash2 style={{ width: 13 }} /></button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {editingItem && (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingItem(null)}>
            <motion.div className="note-dialog glass-panel" initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <button className="close-button" onClick={() => setEditingItem(null)}><X /></button>
              <h2>Edit Item</h2>
              <label>Item name
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Item name" autoFocus />
              </label>
              <label style={{ marginTop: 12 }}>Price (optional)
                <input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} placeholder="0" inputMode="decimal" />
              </label>
              <label style={{ marginTop: 12 }}>Category
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value as 'need' | 'want')}>
                  <option value="need">Need</option>
                  <option value="want">Want</option>
                </select>
              </label>
              <button className="primary-button" onClick={handleSaveEdit} disabled={!editTitle.trim()} style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Save style={{ width: 14 }} /> Save Changes
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

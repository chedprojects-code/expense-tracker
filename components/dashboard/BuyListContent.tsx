'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Save, ShoppingCart, Sparkles, X } from 'lucide-react'
import { type BuyListItem } from '@/lib/supabase/db'
import { NeedsTab } from './NeedsTab'
import { WantsTab } from './WantsTab'

export function BuyListContent({ items, onAdd, onToggle, onEdit, onDelete, buyTab, onBuyTabChange }: {
  items: BuyListItem[]
  onAdd: (title: string, category: 'need' | 'want', price: number | null) => Promise<void>
  onToggle: (id: string, bought: boolean) => Promise<void>
  onEdit: (id: string, title: string, price: number | null, category: 'need' | 'want') => Promise<void>
  onDelete: (id: string) => Promise<void>
  buyTab: 'need' | 'want'
  onBuyTabChange: (tab: 'need' | 'want') => void
}) {
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [editingItem, setEditingItem] = useState<BuyListItem | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editCategory, setEditCategory] = useState<'need' | 'want'>('need')

  const handleAdd = async () => {
    if (!title.trim()) return
    await onAdd(title.trim(), buyTab, price ? parseFloat(price) : null)
    setTitle(''); setPrice('')
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
    <div className='mt-8'>
      <div className="notes-tabs" style={{ marginBottom: 12 }}>
        <button className={buyTab === 'need' ? 'notes-tab active' : 'notes-tab'} onClick={() => onBuyTabChange('need')}>
          <ShoppingCart style={{ width: 13 }} /> Needs
        </button>
        <button className={buyTab === 'want' ? 'notes-tab active' : 'notes-tab'} onClick={() => onBuyTabChange('want')}>
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

      {buyTab === 'need'
        ? <NeedsTab items={items} onToggle={onToggle} onEdit={openEdit} onDelete={onDelete} />
        : <WantsTab items={items} onToggle={onToggle} onEdit={openEdit} onDelete={onDelete} />
      }

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

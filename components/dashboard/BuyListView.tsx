'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Plus, ShoppingCart, Sparkles, Trash2 } from 'lucide-react'
import type { BuyListItem } from '@/lib/supabase/db'
import { SectionTitle } from './ui'

export function BuyListView({ items, onAdd, onToggle, onDelete }: {
  items: BuyListItem[]
  onAdd: (title: string, category: 'need' | 'want') => Promise<void>
  onToggle: (id: string, bought: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [tab, setTab] = useState<'need' | 'want'>('need')
  const [input, setInput] = useState('')

  const filtered = items.filter((item) => item.category === tab)
  const bought = filtered.filter((item) => item.bought).length

  const handleAdd = async () => {
    if (!input.trim()) return
    await onAdd(input.trim(), tab)
    setInput('')
  }

  return (
    <section className="notes-page">
      <SectionTitle eyebrow="BUY LIST" title="Things to buy" />

      <div className="notes-tabs">
        <button className={tab === 'need' ? 'notes-tab active' : 'notes-tab'} onClick={() => setTab('need')}>
          <ShoppingCart style={{ width: 13 }} /> Needs
        </button>
        <button className={tab === 'want' ? 'notes-tab active' : 'notes-tab'} onClick={() => setTab('want')}>
          <Sparkles style={{ width: 13 }} /> Wants
        </button>
      </div>

      <div className="buy-add-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={`Add a ${tab}...`}
          className="buy-input"
        />
        <button className="buy-add-btn" onClick={handleAdd} disabled={!input.trim()}>
          <Plus style={{ width: 15 }} />
        </button>
      </div>

      {filtered.length > 0 && (
        <p className="buy-progress-label">{bought}/{filtered.length} bought</p>
      )}

      <div className="notes-list">
        {filtered.length === 0 && (
          <div className="empty-notes glass-panel">
            <ShoppingCart style={{ width: 25, color: '#7168db' }} />
            <p>No {tab}s yet</p>
          </div>
        )}
        {filtered.map((item) => (
          <motion.div
            layout key={item.id}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            className={`buy-item glass-panel${item.bought ? ' bought' : ''}`}
          >
            <button className="buy-check" onClick={() => onToggle(item.id, item.bought)}>
              {item.bought ? <CheckCircle2 style={{ width: 18, color: '#18ad99' }} /> : <Circle style={{ width: 18, color: 'var(--muted)' }} />}
            </button>
            <span className="buy-title">{item.title}</span>
            <button className="buy-delete" onClick={() => onDelete(item.id)}><Trash2 style={{ width: 13 }} /></button>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

'use client'
import { motion } from 'framer-motion'
import { Save, X } from 'lucide-react'
import type { NoteDraft, AccountDraft, TxDraft } from './types'

const CATEGORIES = ['Food & snacks', 'Transport', 'Outings', 'Data & airtime', 'Utilities', 'Shopping', 'Health', 'Other']

// ─── Note Dialog ─────────────────────────────────────────────────────────────
export function NoteDialog({ open, draft, setDraft, onSave, onClose, isEditing }: {
  open: boolean
  draft: NoteDraft
  setDraft: (d: NoteDraft) => void
  onSave: () => void
  onClose: () => void
  isEditing: boolean
}) {
  if (!open) return null
  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .18 }}>
      <motion.form
        className="note-dialog glass-panel"
        initial={{ y: 40 }} animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        onSubmit={(e) => { e.preventDefault(); onSave() }}
      >
        <button type="button" className="close-button" onClick={onClose}><X /></button>
        <p className="eyebrow">{isEditing ? 'EDIT NOTE' : 'NEW NOTE'}</p>
        <h2>{isEditing ? 'Update your note' : 'What do you need to remember?'}</h2>
        <label>Title<input required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Flight tickets" /></label>
        <label>Amount (NGN)<input required value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} placeholder="85000" inputMode="decimal" /></label>
        <label>Due Date<input required type="date" value={draft.due_date} onChange={(e) => setDraft({ ...draft, due_date: e.target.value })} /></label>
        <label>Type
          <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
            <option>Want</option>
            <option>Pay</option>
          </select>
        </label>
        <button className="primary-button" type="submit"><Save /> Save note</button>
      </motion.form>
    </motion.div>
  )
}

// ─── Account Dialog ───────────────────────────────────────────────────────────
export function AccountDialog({ open, draft, setDraft, onSave, onClose, isEditing }: {
  open: boolean
  draft: AccountDraft
  setDraft: (d: AccountDraft) => void
  onSave: () => void
  onClose: () => void
  isEditing: boolean
}) {
  if (!open) return null
  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .18 }}>
      <motion.form
        className="note-dialog glass-panel"
        initial={{ y: 40 }} animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        onSubmit={(e) => { e.preventDefault(); onSave() }}
      >
        <button type="button" className="close-button" onClick={onClose}><X /></button>
        <p className="eyebrow">{isEditing ? 'EDIT ACCOUNT' : 'NEW ACCOUNT'}</p>
        <h2>{isEditing ? 'Update account' : 'Add an account'}</h2>
        <label>Account name<input required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. OPay" /></label>
        <label>Purpose<input value={draft.purpose} onChange={(e) => setDraft({ ...draft, purpose: e.target.value })} placeholder="e.g. Airtime & Bills" /></label>
        <label>Balance (NGN)<input required value={draft.balance} onChange={(e) => setDraft({ ...draft, balance: e.target.value })} placeholder="0" inputMode="decimal" /></label>
        <label>Symbol<input value={draft.symbol} onChange={(e) => setDraft({ ...draft, symbol: e.target.value })} placeholder="₦" maxLength={2} /></label>
        <label>Color
          <select value={draft.tone} onChange={(e) => setDraft({ ...draft, tone: e.target.value })}>
            <option value="violet">Violet</option>
            <option value="teal">Teal</option>
            <option value="gold">Gold</option>
            <option value="pink">Pink</option>
          </select>
        </label>
        <button className="primary-button" type="submit"><Save /> Save account</button>
      </motion.form>
    </motion.div>
  )
}

// ─── Transaction Dialog ───────────────────────────────────────────────────────
export function TxDialog({ open, draft, setDraft, onSave, onClose }: {
  open: boolean
  draft: TxDraft
  setDraft: (d: TxDraft) => void
  onSave: () => void
  onClose: () => void
}) {
  if (!open) return null
  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .18 }}>
      <motion.form
        className="note-dialog glass-panel"
        initial={{ y: 40 }} animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        onSubmit={(e) => { e.preventDefault(); onSave() }}
      >
        <button type="button" className="close-button" onClick={onClose}><X /></button>
        <p className="eyebrow">NEW TRANSACTION</p>
        <h2>Record money in or out</h2>
        <label>Type
          <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as 'income' | 'expense' })}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </label>
        <label>Amount (NGN)<input required value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} placeholder="0" inputMode="decimal" /></label>
        <label>Category
          <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
            {draft.type === 'income'
              ? ['Salary', 'Freelance', 'Gift', 'Investment', 'Other'].map((c) => <option key={c}>{c}</option>)
              : CATEGORIES.map((c) => <option key={c}>{c}</option>)
            }
          </select>
        </label>
        <label>Description<input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Optional note" /></label>
        <label>Date<input required type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></label>
        <button className="primary-button" type="submit"><Save /> Save transaction</button>
      </motion.form>
    </motion.div>
  )
}

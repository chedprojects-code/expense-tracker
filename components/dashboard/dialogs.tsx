'use client'
import { motion } from 'framer-motion'
import { Save, X } from 'lucide-react'
import type { NoteDraft, AccountDraft, TxDraft, LenderDraft, FutureExpenseDraft } from './types'

const CATEGORIES = ['Food & snacks', 'Transport', 'Outings', 'Data & airtime', 'Utilities', 'Shopping', 'Health', 'Other']
const TONE_COLORS: Record<string, string> = { violet: '#7c6cff', teal: '#59d5c9', gold: '#f6b86c', pink: '#ed8fbb' }

// ─── Note Dialog ──────────────────────────────────────────────────────────────
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
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            {(Object.keys(TONE_COLORS) as string[]).map((t) => (
              <button
                key={t} type="button"
                onClick={() => setDraft({ ...draft, tone: t })}
                style={{
                  width: 30, height: 30, borderRadius: 10, padding: 0, cursor: 'pointer',
                  background: TONE_COLORS[t],
                  border: draft.tone === t ? '3px solid var(--ink)' : '3px solid transparent',
                  boxShadow: draft.tone === t ? `0 0 0 2px ${TONE_COLORS[t]}55` : 'none',
                  outline: 'none',
                }}
              />
            ))}
          </div>
        </label>
        <button className="primary-button" type="submit"><Save /> Save account</button>
      </motion.form>
    </motion.div>
  )
}

// ─── Transaction Dialog ───────────────────────────────────────────────────────
export function TxDialog({ open, draft, setDraft, onSave, onClose, isEditing }: {
  open: boolean
  draft: TxDraft
  setDraft: (d: TxDraft) => void
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
        <p className="eyebrow">{isEditing ? 'EDIT TRANSACTION' : 'NEW TRANSACTION'}</p>
        <h2>{isEditing ? 'Update transaction' : 'Record money in or out'}</h2>
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

// ─── Lender Dialog ────────────────────────────────────────────────────────────
export function LenderDialog({ open, draft, setDraft, onSave, onClose, isEditing }: {
  open: boolean
  draft: LenderDraft
  setDraft: (d: LenderDraft) => void
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
        <p className="eyebrow">{isEditing ? 'EDIT LENDER' : 'NEW LENDER'}</p>
        <h2>{isEditing ? 'Update lender' : 'Who owes you?'}</h2>
        <label>Name<input required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. John Doe" /></label>
        <label>Amount Owed (NGN)<input required value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} placeholder="0" inputMode="decimal" /></label>
        <label>Note (optional)<input value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="e.g. Borrowed for rent" /></label>
        <button className="primary-button" type="submit"><Save /> Save lender</button>
      </motion.form>
    </motion.div>
  )
}

// ─── Future Expense Dialog ────────────────────────────────────────────────────
export function FutureExpenseDialog({ open, draft, setDraft, onSave, onClose, isEditing }: {
  open: boolean
  draft: FutureExpenseDraft
  setDraft: (d: FutureExpenseDraft) => void
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
        <p className="eyebrow">{isEditing ? 'EDIT FUTURE EXPENSE' : 'NEW FUTURE EXPENSE'}</p>
        <h2>{isEditing ? 'Update planned expense' : 'What will you spend on?'}</h2>
        <label>Title<input required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Rent, Electricity" /></label>
        <label>Amount (NGN)<input required value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} placeholder="0" inputMode="decimal" /></label>
        <label>Due Date<input required type="date" value={draft.due_date} onChange={(e) => setDraft({ ...draft, due_date: e.target.value })} /></label>
        <label>Category
          <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
            {['Rent', 'Utilities', 'Food & snacks', 'Transport', 'Data & airtime', 'Health', 'Shopping', 'Other'].map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <button className="primary-button" type="submit"><Save /> Save</button>
      </motion.form>
    </motion.div>
  )
}

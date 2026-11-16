'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Save, X } from 'lucide-react'
import type { NoteDraft, AccountDraft, TxDraft, LenderDraft, FutureExpenseDraft, RecurringDraft } from './types'
import type { Account, BuyListItem, FutureExpense } from '@/lib/supabase/db'

const CATEGORIES = ['Food & snacks', 'Transport', 'Outings', 'Data & airtime', 'Utilities', 'Shopping', 'Health', 'Other']
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Gift', 'Investment', 'Other']
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
        <label>Min Amount (NGN)<input required type="number" min="0.01" step="0.01" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} placeholder="85000" inputMode="decimal" /></label>
        <label style={{ color: 'var(--muted)', fontSize: 11 }}>Max Amount — optional, if unsure of exact price
          <input type="number" min={draft.amount || '0.01'} step="0.01" value={draft.amount_max} onChange={(e) => setDraft({ ...draft, amount_max: e.target.value })} placeholder="e.g. 100000" inputMode="decimal" />
        </label>
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
        <label>Balance (NGN)<input required type="number" step="0.01" value={draft.balance} onChange={(e) => setDraft({ ...draft, balance: e.target.value })} placeholder="0" inputMode="decimal" /></label>
        <label>Annual Interest Rate (%)<input type="number" min="0" step="0.01" value={draft.annual_interest} onChange={(e) => setDraft({ ...draft, annual_interest: e.target.value })} placeholder="e.g. 12.5" inputMode="decimal" /></label>
        <label>Symbol<input value={draft.symbol} onChange={(e) => setDraft({ ...draft, symbol: e.target.value })} placeholder="₦" maxLength={2} /></label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={draft.is_vault} onChange={(e) => setDraft({ ...draft, is_vault: e.target.checked })} style={{ width: 16, height: 16 }} />
          <span>Mark as Vault account <small style={{ color: 'var(--muted)', fontSize: 10 }}>(most precious savings)</small></span>
        </label>
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
export function TxDialog({ open, draft, setDraft, onSave, onClose, isEditing, accounts }: {
  open: boolean
  draft: TxDraft
  setDraft: (d: TxDraft) => void
  onSave: () => void
  onClose: () => void
  isEditing: boolean
  accounts: Account[]
}) {
  if (!open) return null
  const baselineAccountIds = draft.type === 'transfer'
    ? [draft.account_id, draft.transfer_to_account_id]
    : [draft.account_id]
  const backdatedAccounts = accounts.filter((account) =>
    baselineAccountIds.includes(account.id) && draft.date < account.balance_as_of
  )
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
          <select value={draft.type} onChange={(e) => {
            const type = e.target.value as TxDraft['type']
            setDraft({
              ...draft,
              type,
              category: type === 'transfer' ? 'Transfer' : type === 'income' ? 'Salary' : 'Food & snacks',
              transfer_to_account_id: type === 'transfer'
                ? (draft.transfer_to_account_id || accounts.find((account) => account.id !== draft.account_id)?.id || '')
                : '',
            })
          }}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="transfer" disabled={accounts.length < 2}>Transfer{accounts.length < 2 ? ' (add two accounts first)' : ''}</option>
          </select>
        </label>
        <label>Amount (NGN)<input required type="number" min="0.01" step="0.01" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} placeholder="0" inputMode="decimal" /></label>
        {draft.type === 'transfer' ? (
          <>
            <label>From account
              <select required value={draft.account_id} onChange={(e) => setDraft({ ...draft, account_id: e.target.value, transfer_to_account_id: draft.transfer_to_account_id === e.target.value ? '' : draft.transfer_to_account_id })}>
                <option value="">Choose account</option>
                {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
              </select>
            </label>
            <label>To account
              <select required value={draft.transfer_to_account_id} onChange={(e) => setDraft({ ...draft, transfer_to_account_id: e.target.value })}>
                <option value="">Choose account</option>
                {accounts.filter((account) => account.id !== draft.account_id).map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
              </select>
            </label>
          </>
        ) : (
          <label>Account
            <select value={draft.account_id} onChange={(e) => setDraft({ ...draft, account_id: e.target.value })}>
              <option value="">Unassigned — no balance change</option>
              {accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.balance.toLocaleString('en-NG')}</option>)}
            </select>
          </label>
        )}
        {draft.type !== 'transfer' && <label>Category
          <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
            {draft.type === 'income'
              ? INCOME_CATEGORIES.map((c) => <option key={c}>{c}</option>)
              : CATEGORIES.map((c) => <option key={c}>{c}</option>)
            }
          </select>
        </label>}
        <label>Description<input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Optional note" /></label>
        <label>Date<input required type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></label>
        {backdatedAccounts.length > 0 && (
          <p style={{ color: 'var(--muted)', fontSize: 10, lineHeight: 1.4 }}>
            This date is before {backdatedAccounts.map((account) => `${account.name}’s starting balance`).join(' and ')}. Those balances will not change.
          </p>
        )}
        <button className="primary-button" type="submit"><Save /> Save {draft.type === 'transfer' ? 'transfer' : 'transaction'}</button>
      </motion.form>
    </motion.div>
  )
}

export function PurchaseDialog({ open, item, accounts, initialAccountId, onSave, onClose }: {
  open: boolean
  item: BuyListItem | null
  accounts: Account[]
  initialAccountId: string
  onSave: (amount: number, accountId: string | null) => Promise<void>
  onClose: () => void
}) {
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setAmount(item?.price != null ? String(item.price) : '')
    setAccountId(initialAccountId)
    setError('')
  }, [open, item?.id, initialAccountId, item?.price])

  if (!open || !item) return null

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const parsedAmount = Number(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Enter the amount you actually paid.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave(parsedAmount, accountId || null)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not record this purchase.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.form className="note-dialog glass-panel" onSubmit={submit} initial={{ y: 40 }} animate={{ y: 0 }}>
        <button type="button" className="close-button" onClick={onClose}><X /></button>
        <p className="eyebrow">RECORD PURCHASE</p>
        <h2>{item.title}</h2>
        <label>Amount paid (NGN)
          <input required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
        </label>
        <label>Paid from
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">Unassigned — no balance change</option>
            {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
          </select>
        </label>
        {error && <p role="alert" style={{ color: '#c44', fontSize: 11 }}>{error}</p>}
        <button className="primary-button" type="submit" disabled={saving}><Save /> {saving ? 'Saving…' : 'Save purchase'}</button>
      </motion.form>
    </motion.div>
  )
}

export function FutureExpensePaymentDialog({ open, item, accounts, initialAccountId, onSave, onClose }: {
  open: boolean
  item: FutureExpense | null
  accounts: Account[]
  initialAccountId: string
  onSave: (amount: number, accountId: string | null) => Promise<void>
  onClose: () => void
}) {
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setAmount(item ? String(item.amount) : '')
    setAccountId(initialAccountId)
    setError('')
  }, [open, item?.id, item?.amount, initialAccountId])

  if (!open || !item) return null

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const parsedAmount = Number(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Enter the amount actually paid.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave(parsedAmount, accountId || null)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not record this payment.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.form className="note-dialog glass-panel" onSubmit={submit} initial={{ y: 40 }} animate={{ y: 0 }}>
        <button type="button" className="close-button" onClick={onClose}><X /></button>
        <p className="eyebrow">PAY PLANNED EXPENSE</p>
        <h2>{item.title}</h2>
        <label>Amount paid (NGN)
          <input required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
        </label>
        <label>Paid from
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">Unassigned — no balance change</option>
            {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
          </select>
        </label>
        {error && <p role="alert" style={{ color: '#c44', fontSize: 11 }}>{error}</p>}
        <button className="primary-button" type="submit" disabled={saving}><Save /> {saving ? 'Saving…' : 'Record payment'}</button>
      </motion.form>
    </motion.div>
  )
}

export function RecurringDialog({ open, draft, setDraft, accounts, onSave, onClose, isEditing }: {
  open: boolean
  draft: RecurringDraft
  setDraft: (draft: RecurringDraft) => void
  accounts: Account[]
  onSave: () => void
  onClose: () => void
  isEditing: boolean
}) {
  if (!open) return null
  const categories = draft.type === 'income' ? INCOME_CATEGORIES : CATEGORIES
  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.form className="note-dialog glass-panel recurring-dialog" onSubmit={(event) => { event.preventDefault(); onSave() }} initial={{ y: 40 }} animate={{ y: 0 }}>
        <button type="button" className="close-button" onClick={onClose}><X /></button>
        <p className="eyebrow">{isEditing ? 'EDIT RECURRING' : 'NEW RECURRING'}</p>
        <h2>{isEditing ? 'Update reminder' : 'Add a recurring reminder'}</h2>
        <div className="recurring-dialog-fields">
          <label>Type
            <select value={draft.type} onChange={(e) => {
              const type = e.target.value as RecurringDraft['type']
              setDraft({ ...draft, type, category: type === 'income' ? 'Salary' : 'Other' })
            }}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </label>
          <label>Amount (NGN)
            <input required type="number" min="0.01" step="0.01" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} inputMode="decimal" />
          </label>
          <label>Category
            <select required value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
              {!categories.includes(draft.category) && <option value={draft.category}>{draft.category}</option>}
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label>Description
            <input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="e.g. Internet subscription" />
          </label>
          <label>Account
            <select value={draft.account_id} onChange={(e) => setDraft({ ...draft, account_id: e.target.value })}>
              <option value="">Unassigned — no balance change</option>
              {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
            </select>
          </label>
          <label>Frequency
            <select value={draft.frequency} onChange={(e) => setDraft({ ...draft, frequency: e.target.value as RecurringDraft['frequency'] })}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          <label>Next due date
            <input required type="date" value={draft.next_date} onChange={(e) => setDraft({ ...draft, next_date: e.target.value })} />
          </label>
        </div>
        <button className="primary-button" type="submit"><Save /> Save reminder</button>
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
        <label>Amount Owed (NGN)<input required type="number" min="0.01" step="0.01" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} placeholder="0" inputMode="decimal" /></label>
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
        <label>Amount (NGN)<input required type="number" min="0.01" step="0.01" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} placeholder="0" inputMode="decimal" /></label>
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

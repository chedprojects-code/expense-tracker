'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, Banknote, X, Loader2 } from 'lucide-react'

type BankAccount = {
  id: string
  name: string
  purpose: string
  balance: string
  tone: 'violet' | 'teal' | 'gold' | 'pink'
  symbol: string
  note?: string
  createdAt: string
  updatedAt: string
}

interface BankAccountManagerProps {
  initialBanks: BankAccount[]
  onBanksUpdated: (banks: BankAccount[]) => void
}

const toneColors: Record<BankAccount['tone'], string> = {
  violet: '#8b5cf6',
  teal: '#14b8a6',
  gold: '#f59e0b',
  pink: '#ec4899',
}

export function BankAccountManager({ initialBanks, onBanksUpdated }: BankAccountManagerProps) {
  const [banks, setBanks] = useState<BankAccount[]>(initialBanks)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [name, setName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [balance, setBalance] = useState('')
  const [tone, setTone] = useState<BankAccount['tone']>('violet')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()

  const getTotalBalance = useCallback((): string => {
    return banks.reduce((sum, bank) => {
      const numeric = parseFloat(bank.balance.replace(/[^0-9.-]/g, '') || '0')
      return sum + numeric
    }, 0).toFixed(2)
  }, [banks])

  const loadBanks = useCallback(async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
      if (error) throw error
      if (data && data.length > 0) {
        setBanks(data)
      } else {
        setBanks(initialBanks)
      }
      onBanksUpdated(data || initialBanks)
    } catch (err: any) {
      console.error('Error loading banks:', err)
      setBanks(initialBanks)
    }
  }, [user, initialBanks, onBanksUpdated, supabase])

  const saveBank = async (isEditing: boolean = false) => {
    if (!name.trim() || !balance.trim()) return
    if (!user) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const now = new Date().toISOString()
      const balanceNumber = parseFloat(balance.replace(/[^0-9.-]/g, '')) || 0

      if (isEditing && editingBank) {
        const { error } = await supabase
          .from('accounts')
          .update({
            name: name.trim(),
            purpose: purpose.trim(),
            balance: balanceNumber.toString(),
            tone,
            note: note.trim() || null,
            updatedAt: now,
          })
          .eq('id', editingBank.id)

        if (error) throw error

        setBanks(prev => prev.map(bank =>
          bank.id === editingBank.id
            ? { ...bank, name: name.trim(), purpose: purpose.trim(), balance: balanceNumber.toString(), tone, note: note.trim() || undefined, updatedAt: now }
            : bank
        ))

        setEditingBank(null)
        setShowEditDialog(false)
        setSuccess('Bank updated successfully!')
      } else {
        const { error } = await supabase.from('accounts').insert({
          user_id: user.id,
          name: name.trim(),
          purpose: purpose.trim(),
          balance: balanceNumber.toString(),
          tone,
          note: note.trim() || null,
          createdAt: now,
          updatedAt: now,
        })

        if (error) throw error

        setBanks(prev => [
          {
            id: Math.random().toString(36).substr(2, 9),
            name: name.trim(),
            purpose: purpose.trim(),
            balance: balanceNumber.toString(),
            tone,
            symbol: name.trim()[0]?.toUpperCase() || 'B',
            note: note.trim() || undefined,
            createdAt: now,
            updatedAt: now,
          },
          ...prev,
        ])

        setSuccess('Bank added successfully!')
      }

      setShowAddDialog(false)
      setName('')
      setPurpose('')
      setBalance('')
      setNote('')
      onBanksUpdated([...banks])
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const deleteBank = async (id: string) => {
    if (!user) return
    if (!confirm('Are you sure you want to delete this bank account?')) return

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id)

      if (error) throw error

      setBanks(prev => prev.filter(bank => bank.id !== id))
      onBanksUpdated([...banks.filter(bank => bank.id !== id)])
      setSuccess('Bank deleted successfully!')
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (bank: BankAccount) => {
    setEditingBank(bank)
    setName(bank.name)
    setPurpose(bank.purpose)
    setBalance(bank.balance)
    setTone(bank.tone)
    setNote(bank.note || '')
    setShowEditDialog(true)
  }

  const cancelEdit = () => {
    setEditingBank(null)
    setShowEditDialog(false)
    setName('')
    setPurpose('')
    setBalance('')
    setNote('')
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Banks</h2>
        <button
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Bank
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg">
          {success}
        </div>
      )}

      {banks.length === 0 ? (
        <div className="text-center py-12">
          <Banknote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No bank accounts yet</p>
          <button
            onClick={() => setShowAddDialog(true)}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg"
          >
            Add Your First Bank
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banks.map((bank) => (
            <motion.div
              key={bank.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel rounded-xl p-5"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: toneColors[bank.tone] }}
                  >
                    {bank.symbol}
                  </div>
                  <div>
                    <h3 className="font-semibold">{bank.name}</h3>
                    <p className="text-sm text-gray-500">{bank.purpose}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(bank)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteBank(bank.id)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-800 rounded-lg text-red-500"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-500">Balance</p>
                <p className="text-2xl font-bold">{bank.balance}</p>
              </div>

              {bank.note && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400">{bank.note}</p>
                </div>
              )}

              <div className="text-xs text-gray-400">
                Last updated: {new Date(bank.updatedAt).toLocaleDateString()}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <AnimatePresence>
        {showAddDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => {
              setShowAddDialog(false)
              setName('')
              setPurpose('')
              setBalance('')
              setNote('')
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-panel rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Add Bank Account</h3>
                <button
                  onClick={() => {
                    setShowAddDialog(false)
                    setName('')
                    setPurpose('')
                    setBalance('')
                    setNote('')
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. OPay"
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Purpose</label>
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g. Daily spending"
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Balance</label>
                  <input
                    type="text"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    placeholder="0"
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Note (Optional)</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Any additional notes..."
                    rows={3}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => saveBank()}
                    disabled={loading}
                    className="flex-1 p-3 bg-indigo-500 text-white rounded-lg disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setShowAddDialog(false)
                      setName('')
                      setPurpose('')
                      setBalance('')
                      setNote('')
                    }}
                    className="p-3 border rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Dialog */}
      <AnimatePresence>
        {showEditDialog && editingBank && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={cancelEdit}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-panel rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Edit Bank Account</h3>
                <button
                  onClick={cancelEdit}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Purpose</label>
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Balance</label>
                  <input
                    type="text"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Note (Optional)</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => saveBank(true)}
                    disabled={loading}
                    className="flex-1 p-3 bg-indigo-500 text-white rounded-lg disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Pencil className="w-5 h-5" />}
                    Update
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-3 border rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

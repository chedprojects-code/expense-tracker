'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, Calendar, Clock, ArrowRightLeft, X, Loader2, FileText } from 'lucide-react'

type Note = {
  id: string
  title: string
  amount: string
  dueDate: string
  category: 'Want' | 'Pay' | 'Income' | 'Expense'
  note?: string
  createdAt: string
  updatedAt: string
}

type DateFilter = 'all' | 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'twoWeeks' | 'lastMonth' | 'thisMonth'

interface NotesWithFiltersProps {
  initialNotes: Note[]
  onNotesUpdated: (notes: Note[]) => void
}

export function NotesWithFilters({ initialNotes, onNotesUpdated }: NotesWithFiltersProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [category, setCategory] = useState<Note['category']>('Want')
  const [note, setNoteText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const { user } = useAuth()
  const supabase = createClient()

  const getFilteredNotes = useCallback((): Note[] => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    const startOfLastWeek = new Date(startOfWeek)
    startOfLastWeek.setDate(startOfWeek.getDate() - 7)

    const endOfLastWeek = new Date(startOfWeek)
    endOfLastWeek.setDate(startOfWeek.getDate() - 1)

    const startOfTwoWeeksAgo = new Date(today)
    startOfTwoWeeksAgo.setDate(today.getDate() - 14)

    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    return notes.filter((note) => {
      const dueDateStr = note.dueDate

      switch (dateFilter) {
        case 'today':
          return dueDateStr >= today.toISOString().split('T')[0] &&
                 dueDateStr <= new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString().split('T')[0]
        case 'yesterday':
          return dueDateStr >= yesterday.toISOString().split('T')[0] &&
                 dueDateStr <= new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1).toISOString().split('T')[0]
        case 'thisWeek':
          return dueDateStr >= startOfWeek.toISOString().split('T')[0] &&
                 dueDateStr <= endOfWeek.toISOString().split('T')[0]
        case 'lastWeek':
          return dueDateStr >= startOfLastWeek.toISOString().split('T')[0] &&
                 dueDateStr <= endOfLastWeek.toISOString().split('T')[0]
        case 'twoWeeks':
          return dueDateStr >= startOfTwoWeeksAgo.toISOString().split('T')[0] &&
                 dueDateStr <= today.toISOString().split('T')[0]
        case 'lastMonth':
          return dueDateStr >= startOfLastMonth.toISOString().split('T')[0] &&
                 dueDateStr <= endOfLastMonth.toISOString().split('T')[0]
        case 'thisMonth':
          return dueDateStr >= startOfMonth.toISOString().split('T')[0] &&
                 dueDateStr <= endOfMonth.toISOString().split('T')[0]
        default:
          return true
      }
    })
  }, [notes, dateFilter])

  const saveNote = async (isEditing: boolean = false) => {
    if (!title.trim() || !amount.trim() || !dueDate.trim()) return
    if (!user) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const now = new Date().toISOString()

      if (isEditing && editingNote) {
        const { error } = await supabase
          .from('notes')
          .update({
            title: title.trim(),
            amount: amount.trim(),
            dueDate,
            category,
            note: note.trim() || null,
            updatedAt: now,
          })
          .eq('id', editingNote.id)

        if (error) throw error

        setNotes(prev => prev.map(n =>
          n.id === editingNote.id
            ? { ...n, title: title.trim(), amount: amount.trim(), dueDate, category, note: note.trim() || undefined, updatedAt: now }
            : n
        ))

        setEditingNote(null)
        setShowEditDialog(false)
        setSuccess('Note updated successfully!')
      } else {
        const { error } = await supabase.from('notes').insert({
          user_id: user.id,
          title: title.trim(),
          amount: amount.trim(),
          dueDate,
          category,
          note: note.trim() || null,
          createdAt: now,
          updatedAt: now,
        })

        if (error) throw error

        setNotes(prev => [
          {
            id: Math.random().toString(36).substr(2, 9),
            title: title.trim(),
            amount: amount.trim(),
            dueDate,
            category,
            note: note.trim() || undefined,
            createdAt: now,
            updatedAt: now,
          },
          ...prev,
        ])

        setSuccess('Note added successfully!')
      }

      setShowAddDialog(false)
      setTitle('')
      setAmount('')
      setDueDate('')
      setNoteText('')
      onNotesUpdated([...notes])
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const deleteNote = async (id: string) => {
    if (!user) return
    if (!confirm('Are you sure you want to delete this note?')) return

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.from('notes').delete().eq('id', id)
      if (error) throw error

      setNotes(prev => prev.filter(n => n.id !== id))
      onNotesUpdated([...notes.filter(n => n.id !== id)])
      setSuccess('Note deleted successfully!')
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (n: Note) => {
    setEditingNote(n)
    setTitle(n.title)
    setAmount(n.amount)
    setDueDate(n.dueDate)
    setCategory(n.category)
    setNoteText(n.note || '')
    setShowEditDialog(true)
  }

  const cancelEdit = () => {
    setEditingNote(null)
    setShowEditDialog(false)
    setTitle('')
    setAmount('')
    setDueDate('')
    setNoteText('')
  }

  const filteredNotes = getFilteredNotes()

  const categoryColors: Record<Note['category'], string> = {
    Want: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    Pay: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    Income: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    Expense: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  }

  const filterLabels: Record<DateFilter, string> = {
    all: 'All',
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'This Week',
    lastWeek: 'Last Week',
    twoWeeks: 'Last 2 Weeks',
    lastMonth: 'Last Month',
    thisMonth: 'This Month',
  }

  const NoteForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Rent payment"
          className="w-full p-3 border rounded-lg"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Amount</label>
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="w-full p-3 border rounded-lg"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Due Date</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full p-3 border rounded-lg"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Note['category'])}
          className="w-full p-3 border rounded-lg"
        >
          <option value="Want">Want</option>
          <option value="Pay">Pay</option>
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Note (Optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Any additional notes..."
          rows={3}
          className="w-full p-3 border rounded-lg"
        />
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Notes</h2>
        <button
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Note
        </button>
      </div>

      {/* Date Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(Object.keys(filterLabels) as DateFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setDateFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              dateFilter === f
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {filterLabels[f]}
          </button>
        ))}
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

      {filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No notes found</p>
          <button
            onClick={() => setShowAddDialog(true)}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg"
          >
            Add Your First Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel rounded-xl p-5"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold">{n.title}</h3>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[n.category]}`}>
                    {n.category}
                  </span>
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => startEdit(n)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteNote(n.id)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-800 rounded-lg text-red-500"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-sm text-gray-500">Amount</p>
                <p className="text-xl font-bold">{n.amount}</p>
              </div>

              <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                <Calendar className="w-4 h-4" />
                <span>Due: {new Date(n.dueDate).toLocaleDateString()}</span>
              </div>

              {n.note && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400">{n.note}</p>
                </div>
              )}
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
            onClick={() => setShowAddDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-panel rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Add Note</h3>
                <button onClick={() => setShowAddDialog(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <NoteForm />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => saveNote()}
                  disabled={loading}
                  className="flex-1 p-3 bg-indigo-500 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Save
                </button>
                <button onClick={() => setShowAddDialog(false)} className="p-3 border rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Dialog */}
      <AnimatePresence>
        {showEditDialog && editingNote && (
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
              className="glass-panel rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Edit Note</h3>
                <button onClick={cancelEdit} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <NoteForm />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => saveNote(true)}
                  disabled={loading}
                  className="flex-1 p-3 bg-indigo-500 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Pencil className="w-5 h-5" />}
                  Update
                </button>
                <button onClick={cancelEdit} className="p-3 border rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

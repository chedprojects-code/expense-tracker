'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import data from '@/data/dashboard.json'
import { ArrowDownLeft, ArrowUpRight, Bell, Calendar, ChevronRight, CircleHelp, CreditCard, Home, Moon, MoreHorizontal, Pencil, Plus, Save, Settings2, Sparkles, Sun, Target, Trash2, TrendingUp, WalletCards, X } from 'lucide-react'

type Note = { id: number; title: string; amount: string; dueDate: string; category: string; updatedAt: string }

const navItems = [{ label: 'Home', icon: Home }, { label: 'Notes', icon: WalletCards }, { label: 'Insights', icon: Sparkles }, { label: 'Settings', icon: Settings2 }]
const toneColors: Record<string, string> = { violet: '#7c6cff', teal: '#59d5c9', gold: '#f6b86c', pink: '#ed8fbb' }
const initialNotes: Note[] = [
  { id: 1, title: 'New running shoes', amount: 'NGN 85,000', dueDate: '2026-11-14', category: 'Want', updatedAt: 'Nov 2, 2026 · 9:14 AM' },
  { id: 2, title: 'Electricity bill', amount: 'NGN 32,500', dueDate: '2026-11-08', category: 'Pay', updatedAt: 'Nov 1, 2026 · 6:40 PM' },
]

function GlassIcon({ children, tone = 'violet' }: { children: React.ReactNode; tone?: string }) { return <div className={`glass-icon tone-${tone}`}>{children}</div> }
function SectionTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) { return <div className="section-head"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{action}</div> }

export default function Page() {
  const [active, setActive] = useState('Home')
  const [showAdd, setShowAdd] = useState(false)
  const [dark, setDark] = useState(false)
  const [showBalance, setShowBalance] = useState(true)
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [noteDraft, setNoteDraft] = useState({ title: '', amount: '', dueDate: '', category: 'Want' })
  const [balance, setBalance] = useState(data.netWorth)
  const [balanceDraft, setBalanceDraft] = useState(data.netWorth.replace('NGN ', ''))
  const [balanceEditedAt, setBalanceEditedAt] = useState('Not edited yet')

  const openNote = (note?: Note) => {
    setEditingNote(note ?? null)
    setShowNoteDialog(true)
    setNoteDraft(note ? { title: note.title, amount: note.amount.replace('NGN ', ''), dueDate: note.dueDate, category: note.category } : { title: '', amount: '', dueDate: '', category: 'Want' })
  }
  const saveNote = () => {
    if (!noteDraft.title.trim() || !noteDraft.amount.trim() || !noteDraft.dueDate) return
    const updatedAt = new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())
    const next = { ...noteDraft, amount: `NGN ${noteDraft.amount}`, updatedAt }
    setNotes((current) => editingNote ? current.map((note) => note.id === editingNote.id ? { ...note, ...next } : note) : [{ id: Date.now(), ...next }, ...current])
    setEditingNote(null)
    setShowNoteDialog(false)
  }
  const saveBalance = () => {
    if (!balanceDraft.trim()) return
    setBalance(`NGN ${balanceDraft}`)
    setBalanceEditedAt(new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date()))
  }

  return (
    <main className={`app-shell ${dark ? 'dark-mode' : ''}`}>
      <div className="ambient ambient-one" /><div className="ambient ambient-two" /><div className="floating-money money-one">₦</div><div className="floating-money money-two">$</div><div className="floating-money money-three">+</div>
      <section className="phone-frame">
        <header className="topbar"><div className="profile-wrap"><div className="avatar">{data.user.initials}</div><div><p className="eyebrow">Good morning,</p><h1>{data.user.name} <span className="wave">✦</span></h1></div></div><div className="top-actions"><button aria-label="Help"><CircleHelp /></button><button aria-label="Toggle dark mode" onClick={() => setDark(!dark)}>{dark ? <Sun /> : <Moon />}</button><button aria-label="Notifications" className="notification"><Bell /><i /></button></div></header>
        <div className="content-scroll">
          <AnimatePresence mode="wait"><motion.div key={active} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }}>
            {active === 'Home' && <>
              <motion.section className="net-worth glass-panel" initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }}><div className="net-copy"><p className="eyebrow light">TOTAL NET WORTH <button className="eye" onClick={() => setShowBalance(!showBalance)} aria-label="Toggle balance visibility">{showBalance ? '◉' : '○'}</button></p><div className="net-value">{showBalance ? balance : '••••••••'}</div><div className="trend"><TrendingUp /> <strong>+8.4%</strong><span>vs last month</span></div></div><div className="orb-wrap"><motion.div className="orb" animate={{ scale: [1, 1.13, 1], opacity: [.55, .95, .55] }} transition={{ duration: 2.8, repeat: Infinity }}><span>✦</span></motion.div><div className="orb-value">NGN <small>+</small></div></div></motion.section>
              <SectionTitle eyebrow="OVERVIEW" title={data.period} action={<button className="month-button">This month <ChevronRight /></button>} />
              <section className="stat-grid"><motion.div className="glass-panel stat-card" whileHover={{ y: -4 }}><div className="stat-top"><GlassIcon tone="teal"><ArrowDownLeft /></GlassIcon><span className="positive">{data.income.change}</span></div><p>Income</p><strong>{data.income.amount}</strong><div className="mini-bars"><i /><i /><i /><i /><i /><i /><i /></div></motion.div><motion.div className="glass-panel stat-card" whileHover={{ y: -4 }}><div className="stat-top"><GlassIcon tone="pink"><ArrowUpRight /></GlassIcon><span className="negative">{data.expenses.change}</span></div><p>Expenses</p><strong>{data.expenses.amount}</strong><div className="mini-bars expense"><i /><i /><i /><i /><i /><i /><i /></div></motion.div></section>
              <SectionTitle eyebrow="SPENDING FLOW" title="Your activity" action={<button className="icon-button" aria-label="More activity options"><MoreHorizontal /></button>} /><section className="glass-panel chart-card"><div className="chart-labels"><span><i className="dot income-dot" /> Income</span><span><i className="dot expense-dot" /> Expenses</span></div><div className="chart"><div className="grid-lines"><i /><i /><i /><i /></div><svg viewBox="0 0 500 150" preserveAspectRatio="none" aria-label="Income and expenses chart"><path className="area" d="M0 125 C50 112 62 90 104 99 S158 42 206 72 S254 88 300 47 S350 69 390 35 S452 74 500 18 L500 150 L0 150Z" /><path className="line income-line" d="M0 125 C50 112 62 90 104 99 S158 42 206 72 S254 88 300 47 S350 69 390 35 S452 74 500 18" /><path className="line expense-line" d="M0 138 C53 132 73 119 110 125 S162 89 207 111 S262 95 310 110 S365 83 404 99 S454 77 500 83" /></svg></div><div className="chart-days"><span>01</span><span>05</span><span>10</span><span>15</span><span>20</span><span>25</span><span>30</span></div></section>
              <SectionTitle eyebrow="YOUR ACCOUNTS" title="Where your money lives" action={<button className="text-button">View all <ChevronRight /></button>} /><div className="account-row">{data.accounts.map((account, index) => <motion.article whileHover={{ y: -5 }} className={`account-card ${index === 0 ? 'active-account' : ''}`} key={account.name}><div className={`account-icon account-${account.tone}`}>{account.symbol}</div><p>{account.name}</p><small>{account.purpose}</small><strong>{account.balance}</strong><div className="account-dots"><i /><i /><i /></div></motion.article>)}</div>
              <SectionTitle eyebrow="SPENDING BREAKDOWN" title="By category" action={<button className="text-button">Details <ChevronRight /></button>} /><section className="glass-panel categories-card"><div className="donut"><div className="donut-hole"><strong>NGN 97k</strong><span>spent</span></div></div><div className="category-list">{data.categories.map((item) => <div className="category-item" key={item.label}><span className="category-name"><i style={{ background: toneColors[item.tone] }} />{item.label}</span><strong>{item.value}</strong><div className="category-bar"><motion.i initial={{ width: 0 }} animate={{ width: `${item.percent}%` }} transition={{ duration: .8 }} style={{ background: toneColors[item.tone] }} /></div></div>)}</div></section>
              <section className="glass-panel goal-card"><div className="goal-icon"><Target /></div><div className="goal-copy"><p className="eyebrow">MONTHLY SAVINGS GOAL</p><h3>{data.goal.title}</h3><div className="goal-line"><span>{data.goal.current} of {data.goal.target}</span><strong>{data.goal.percent}%</strong></div><div className="progress"><motion.i initial={{ width: 0 }} animate={{ width: `${data.goal.percent}%` }} /></div></div><ChevronRight className="goal-arrow" /></section>
            </>}
            {active === 'Notes' && <NotesView notes={notes} onAdd={() => openNote()} onEdit={openNote} onDelete={(id) => setNotes((current) => current.filter((note) => note.id !== id))} />}
            {active === 'Insights' && <section className="empty-page glass-panel"><div className="empty-icon"><Sparkles /></div><p className="eyebrow">INSIGHTS</p><h2>See your patterns</h2><p>Your spending insights will appear here as you add more activity.</p><button className="primary-button" onClick={() => setActive('Home')}>Back to dashboard</button></section>}
            {active === 'Settings' && <section className="settings-page"><SectionTitle eyebrow="SETTINGS" title="Your money" /><div className="glass-panel balance-editor"><div><p className="eyebrow">EDIT NET WORTH</p><h3>How much do you have?</h3><small>Last saved: {balanceEditedAt}</small></div><div className="money-input"><span>NGN</span><input value={balanceDraft} onChange={(event) => setBalanceDraft(event.target.value)} inputMode="decimal" aria-label="Net worth amount" /><button onClick={saveBalance} aria-label="Save balance"><Save /></button></div></div><div className="glass-panel settings-tip"><GlassIcon tone="violet"><CreditCard /></GlassIcon><div><strong>Your updates are timestamped</strong><p>Every balance edit is saved with the date and time it was made.</p></div></div></section>}
          </motion.div></AnimatePresence>
        </div>
        <nav className="bottom-nav" aria-label="Primary navigation">{navItems.map(({ label, icon: Icon }) => <button key={label} className={active === label ? 'nav-active' : ''} onClick={() => setActive(label)}><span><Icon /></span><small>{label}</small></button>)}<button onClick={() => setShowAdd(true)}><span className="add-button"><Plus /></span><small>Add</small></button></nav>
        <AnimatePresence>{showAdd && <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdd(false)}><motion.div className="add-sheet glass-panel" initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setShowAdd(false)} aria-label="Close"><X /></button><p className="eyebrow">QUICK ACTION</p><h2>What would you like to add?</h2><div className="quick-actions"><button onClick={() => { setShowAdd(false); setActive('Notes'); openNote() }}><GlassIcon tone="violet"><WalletCards /></GlassIcon><span>Note<small>Add a purchase or bill</small></span></button><button><GlassIcon tone="teal"><ArrowDownLeft /></GlassIcon><span>Income<small>Money in</small></span></button><button><GlassIcon tone="pink"><ArrowUpRight /></GlassIcon><span>Expense<small>Money out</small></span></button></div></motion.div></motion.div>}</AnimatePresence>
        <NoteDialog open={showNoteDialog} draft={noteDraft} setDraft={setNoteDraft} onSave={saveNote} onClose={() => { setShowNoteDialog(false); setEditingNote(null) }} isEditing={editingNote !== null} />
      </section>
    </main>
  )
}

function NotesView({ notes, onAdd, onEdit, onDelete }: { notes: Note[]; onAdd: () => void; onEdit: (note: Note) => void; onDelete: (id: number) => void }) {
  return <section className="notes-page"><SectionTitle eyebrow="PLANNED SPENDING" title="Your notes" action={<button className="primary-button small" onClick={onAdd}><Plus /> Add note</button>} /><p className="notes-intro">Keep the things you want to buy and bills you need to pay in one calm place.</p><div className="notes-list">{notes.map((note) => <motion.article layout key={note.id} className="glass-panel note-card"><div className="note-card-top"><GlassIcon tone={note.category === 'Pay' ? 'pink' : 'teal'}><Calendar /></GlassIcon><span className={`note-tag ${note.category.toLowerCase()}`}>{note.category}</span><div className="note-actions"><button onClick={() => onEdit(note)} aria-label={`Edit ${note.title}`}><Pencil /></button><button onClick={() => onDelete(note.id)} aria-label={`Delete ${note.title}`}><Trash2 /></button></div></div><h3>{note.title}</h3><strong>{note.amount}</strong><div className="note-meta"><span><Calendar /> Due {note.dueDate}</span><small>Edited {note.updatedAt}</small></div></motion.article>)}{notes.length === 0 && <div className="empty-notes glass-panel"><WalletCards /><p>No notes yet</p><button className="text-button" onClick={onAdd}>Add your first note</button></div>}</div><div className="glass-panel local-notice"><CircleHelp /><p><strong>Preview storage</strong> Notes are working in this preview. Connect Supabase to keep them across devices and sessions.</p></div></section>
}

function NoteDialog({ open, draft, setDraft, onSave, onClose, isEditing }: { open: boolean; draft: { title: string; amount: string; dueDate: string; category: string }; setDraft: (draft: { title: string; amount: string; dueDate: string; category: string }) => void; onSave: () => void; onClose: () => void; isEditing: boolean }) {
  if (!open) return null
  return <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .18 }}><motion.form className="note-dialog glass-panel" initial={{ y: 40 }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 30 }} onSubmit={(event) => { event.preventDefault(); onSave() }}><button type="button" className="close-button" onClick={onClose} aria-label="Close"><X /></button><p className="eyebrow">{isEditing ? 'EDIT NOTE' : 'NEW NOTE'}</p><h2>{isEditing ? 'Update your note' : 'What do you need to remember?'}</h2><label>Title<input required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="e.g. Flight tickets" /></label><label>Amount<input required value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: event.target.value })} placeholder="85,000" inputMode="decimal" /></label><label>Date<input required type="date" value={draft.dueDate} onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })} /></label><label>Type<select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}><option>Want</option><option>Pay</option></select></label><button className="primary-button" type="submit"><Save /> Save note</button></motion.form></motion.div>
}

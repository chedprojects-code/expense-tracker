'use client'

import type { Dispatch, SetStateAction } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Loader2, LogOut, Save } from 'lucide-react'
import { type SavingsGoal } from '@/lib/supabase/db'
import type { GoalDraft } from '@/components/dashboard/types'
import { GlassIcon, SectionTitle } from './ui'

export function SettingsView({ profileDraft, setProfileDraft, onSaveProfile, savingProfile, goalDraft, setGoalDraft, onSaveGoal, goal, goalPercent, onSignOut }: {
  profileDraft: { name: string; initials: string }
  setProfileDraft: Dispatch<SetStateAction<{ name: string; initials: string }>>
  onSaveProfile: () => void
  savingProfile: boolean
  goalDraft: GoalDraft
  setGoalDraft: Dispatch<SetStateAction<GoalDraft>>
  onSaveGoal: () => void
  goal: SavingsGoal | null
  goalPercent: number
  onSignOut: () => void
}) {
  const inputStyle = { border: '1px solid var(--line)', borderRadius: 10, padding: '9px 11px', background: 'var(--surface)', color: 'var(--ink)', font: 'inherit', fontSize: 12, width: '100%' }

  return (
    <section className="settings-page">
      <SectionTitle eyebrow="SETTINGS" title="Your profile & money" />

      <div className="glass-panel balance-editor" style={{ marginBottom: 12 }}>
        <p className="eyebrow">YOUR PROFILE</p>
        <h3 style={{ margin: '4px 0 12px' }}>Update your name</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input value={profileDraft.name} onChange={(e) => setProfileDraft({ ...profileDraft, name: e.target.value })} placeholder="Your name" style={inputStyle} />
          <input value={profileDraft.initials} onChange={(e) => setProfileDraft({ ...profileDraft, initials: e.target.value })} placeholder="Initials (e.g. AJ)" maxLength={3} style={inputStyle} />
          <div className="money-input" style={{ justifyContent: 'flex-end' }}>
            <button onClick={onSaveProfile} aria-label="Save profile" disabled={savingProfile}>
              {savingProfile ? <Loader2 style={{ width: 14 }} className="animate-spin" /> : <Save style={{ width: 14 }} />}
            </button>
          </div>
        </div>
      </div>

      <div id={goal ? `search-result-goal-${goal.id}` : undefined} className="glass-panel balance-editor" style={{ marginBottom: 12 }}>
        <p className="eyebrow">SAVINGS GOAL</p>
        <h3 style={{ margin: '4px 0 12px' }}>{goal?.title || 'Set a goal'}</h3>
        {goal && (
          <div className="progress" style={{ marginBottom: 12 }}>
            <motion.i initial={{ width: 0 }} animate={{ width: `${goalPercent}%` }} />
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input value={goalDraft.title} onChange={(e) => setGoalDraft({ ...goalDraft, title: e.target.value })} placeholder="Goal title" style={inputStyle} />
          <div className="money-input"><span>Current</span><input value={goalDraft.current} onChange={(e) => setGoalDraft({ ...goalDraft, current: e.target.value })} inputMode="decimal" placeholder="0" /></div>
          <div className="money-input">
            <span>Target</span>
            <input value={goalDraft.target} onChange={(e) => setGoalDraft({ ...goalDraft, target: e.target.value })} inputMode="decimal" placeholder="100000" />
            <button onClick={onSaveGoal} aria-label="Save goal"><Save /></button>
          </div>
        </div>
      </div>

      <div className="glass-panel settings-tip">
        <GlassIcon tone="violet"><CreditCard /></GlassIcon>
        <div>
          <strong>All data is synced</strong>
          <p>Your accounts, notes, transactions and goals are saved to Supabase across all devices.</p>
        </div>
      </div>

      <button className="settings-signout" onClick={onSignOut}>
        <LogOut style={{ width: 15 }} /> Sign out
      </button>
    </section>
  )
}

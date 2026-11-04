'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Pencil, Plus, ShieldCheck, Trash2, Lock, Unlock } from 'lucide-react'
import { fmt, type Account } from '@/lib/supabase/db'
import { SectionTitle } from '@/components/dashboard/ui'

interface VaultViewProps {
  accounts: Account[]
  hideAmounts: boolean
  onToggleHideAmounts: () => void
  onToggleVaultHidden: (id: string, current: boolean) => void
  onAdd: () => void
  onEdit: (acc: Account) => void
  onDelete: (id: string) => void
}

export function VaultView({
  accounts,
  hideAmounts,
  onToggleHideAmounts,
  onToggleVaultHidden,
  onAdd,
  onEdit,
  onDelete,
}: VaultViewProps) {
  const vaultAccounts = accounts.filter((a) => a.is_vault)
  const total = vaultAccounts.reduce((s, a) => s + a.balance, 0)
  const visibleTotal = vaultAccounts.filter((a) => !a.vault_hidden).reduce((s, a) => s + a.balance, 0)
  const hiddenTotal = vaultAccounts.filter((a) => a.vault_hidden).reduce((s, a) => s + a.balance, 0)

  return (
    <section className="notes-page">
      <SectionTitle
        eyebrow="VAULT"
        title="Your precious savings"
        action={
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button className="icon-button" onClick={onToggleHideAmounts} aria-label="Toggle amounts">
              {hideAmounts ? <EyeOff style={{ width: 13 }} /> : <Eye style={{ width: 13 }} />}
            </button>
            <button className="text-button" onClick={onAdd}>
              <Plus style={{ width: 12 }} /> Add
            </button>
          </div>
        }
      />

      {/* Summary card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel"
        style={{
          borderRadius: 22,
          padding: '18px 18px 14px',
          marginBottom: 14,
          background: 'linear-gradient(135deg, rgba(113,104,219,.13) 0%, rgba(169,156,245,.08) 100%)',
          border: '1px solid rgba(113,104,219,.18)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 13,
            background: 'linear-gradient(135deg,#7168db,#a99cf5)',
            display: 'grid', placeItems: 'center', flexShrink: 0,
            boxShadow: '0 6px 16px rgba(113,104,219,.35)',
          }}>
            <ShieldCheck style={{ width: 18, color: '#fff' }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 9, color: 'var(--muted)', fontWeight: 700, letterSpacing: '.06em' }}>TOTAL VAULT</p>
            <strong style={{ fontSize: 18, color: '#7168db', letterSpacing: '-.02em' }}>
              {hideAmounts ? '••••••••' : fmt(total)}
            </strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, background: 'rgba(113,104,219,.08)', borderRadius: 12, padding: '8px 10px' }}>
            <p style={{ margin: '0 0 2px', fontSize: 9, color: 'var(--muted)' }}>VISIBLE IN DASHBOARD</p>
            <strong style={{ fontSize: 12, color: '#7168db' }}>{hideAmounts ? '••••' : fmt(visibleTotal)}</strong>
          </div>
          <div style={{ flex: 1, background: 'rgba(216,120,161,.08)', borderRadius: 12, padding: '8px 10px' }}>
            <p style={{ margin: '0 0 2px', fontSize: 9, color: 'var(--muted)' }}>HIDDEN FROM DASHBOARD</p>
            <strong style={{ fontSize: 12, color: '#d878a1' }}>{hideAmounts ? '••••' : fmt(hiddenTotal)}</strong>
          </div>
        </div>
      </motion.div>

      {vaultAccounts.length === 0 ? (
        <div className="glass-panel empty-notes" style={{ borderRadius: 20, padding: '32px 16px' }}>
          <ShieldCheck style={{ width: 28, color: '#7168db' }} />
          <p>No vault accounts yet</p>
          <button className="text-button" onClick={onAdd}>Add your first vault account</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <AnimatePresence>
            {vaultAccounts.map((acc) => (
              <motion.div
                key={acc.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel"
                style={{
                  borderRadius: 20,
                  padding: '14px 16px',
                  border: acc.vault_hidden
                    ? '1px solid rgba(216,120,161,.2)'
                    : '1px solid rgba(113,104,219,.18)',
                  opacity: acc.vault_hidden ? 0.72 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 14, flexShrink: 0,
                    background: 'linear-gradient(135deg,#7168db,#a99cf5)',
                    display: 'grid', placeItems: 'center',
                    fontSize: 16, fontWeight: 800, color: '#fff',
                    boxShadow: '0 4px 12px rgba(113,104,219,.3)',
                  }}>
                    {acc.symbol}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {acc.name}
                      </p>
                      {acc.vault_hidden && (
                        <span style={{ fontSize: 9, background: 'rgba(216,120,161,.15)', color: '#d878a1', borderRadius: 6, padding: '1px 5px', fontWeight: 700, flexShrink: 0 }}>
                          HIDDEN
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--muted)' }}>
                      {acc.purpose}{acc.annual_interest > 0 ? ` · ${acc.annual_interest}% p.a.` : ''}
                    </p>
                  </div>

                  <strong style={{ fontSize: 13, color: acc.vault_hidden ? 'var(--muted)' : '#7168db', flexShrink: 0 }}>
                    {hideAmounts || acc.vault_hidden ? '••••' : fmt(acc.balance)}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
                  <button
                    onClick={() => onToggleVaultHidden(acc.id, acc.vault_hidden)}
                    title={acc.vault_hidden ? 'Show in dashboard total' : 'Hide from dashboard total'}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '4px 9px', borderRadius: 8, background: acc.vault_hidden ? 'rgba(216,120,161,.12)' : 'rgba(113,104,219,.1)', color: acc.vault_hidden ? '#d878a1' : '#7168db', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                  >
                    {acc.vault_hidden
                      ? <><Unlock style={{ width: 10 }} /> Reveal</>
                      : <><Lock style={{ width: 10 }} /> Hide</>}
                  </button>
                  <button
                    onClick={() => onEdit(acc)}
                    style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 9, background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--muted)', cursor: 'pointer' }}
                  >
                    <Pencil style={{ width: 11 }} />
                  </button>
                  <button
                    onClick={() => onDelete(acc.id)}
                    style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 9, background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--muted)', cursor: 'pointer' }}
                  >
                    <Trash2 style={{ width: 11 }} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  )
}

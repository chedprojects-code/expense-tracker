'use client'

import { useState } from 'react'
import { AlertCircle, Check, Copy } from 'lucide-react'

export function CopyToClipboardButton({ text, label, showLabel = false }: {
  text: string
  label: string
  showLabel?: boolean
}) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle')

  const handleCopy = async () => {
    setStatus('idle')
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard access is unavailable in this browser context.')
      }
      await navigator.clipboard.writeText(text)
      setStatus('copied')
    } catch (error) {
      console.error('[copyToClipboard]', error)
      setStatus('error')
    }
  }

  return (
    <>
      <button
        type="button"
        className={`note-copy-button${status === 'copied' ? ' copied' : ''}${showLabel ? ' labeled' : ''}`}
        onClick={handleCopy}
        aria-label={status === 'copied' ? `${label} copied` : status === 'error' ? `Could not copy ${label}` : `Copy ${label}`}
        title={status === 'copied' ? 'Copied' : status === 'error' ? 'Copy failed. Check clipboard permissions.' : `Copy ${label}`}
      >
        {status === 'copied' ? <Check /> : status === 'error' ? <AlertCircle /> : <Copy />}
        {showLabel && <span>{status === 'copied' ? 'Copied' : status === 'error' ? 'Try again' : 'Copy'}</span>}
      </button>
      <span className="copy-live-region" role={status === 'error' ? 'alert' : 'status'}>
        {status === 'copied' ? `${label} copied to clipboard.` : status === 'error' ? `Could not copy ${label}. Check clipboard permissions.` : ''}
      </span>
    </>
  )
}

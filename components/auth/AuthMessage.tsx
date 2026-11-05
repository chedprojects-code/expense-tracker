'use client'

import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

export function AuthMessage({
  type,
  message,
}: {
  type: 'success' | 'error'
  message: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`auth-alert auth-alert-${type}`}
    >
      {type === 'success'
        ? <><CheckCircle2 className="w-4 h-4" /><span>{message}</span></>
        : <><span className="auth-alert-dot">!</span><span>{message}</span></>}
    </motion.div>
  )
}

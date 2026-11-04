'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Mail, Lock, Sparkles, User } from 'lucide-react'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const { signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    if (password !== confirmPassword) { setError('Passwords do not match'); setLoading(false); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return }
    try {
      const { success, error: err } = await signUp(email, password, name)
      if (!success) { setError(err || 'Sign up failed'); setLoading(false); return }
      setSuccess('Account created! Please check your email to verify.')
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />
      <div className="auth-blob auth-blob-3" />

      <div className="auth-center">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="auth-card"
        >
          <div className="auth-header">
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="auth-icon-wrap"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="auth-title">Create your account</h1>
            <p className="auth-subtitle">Start tracking your finances today</p>
          </div>

          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="auth-alert auth-alert-success">
              <CheckCircle2 className="w-4 h-4" /><span>{success}</span>
            </motion.div>
          )}
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="auth-alert auth-alert-error">
              <span className="auth-alert-dot">!</span><span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <User className="auth-field-icon" />
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="auth-input" />
            </div>
            <div className="auth-field">
              <Mail className="auth-field-icon" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="auth-input" />
            </div>
            <div className="auth-field">
              <Lock className="auth-field-icon" />
              <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 6 characters)" className="auth-input auth-input-pr" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="auth-eye">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="auth-field">
              <Lock className="auth-field-icon" />
              <input type={showPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" className="auth-input" />
            </div>
            <button type="submit" className="auth-btn-primary" disabled={loading}>
              <span className="auth-btn-shine" />
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              Create Account
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{' '}
            <button onClick={() => { setError(''); setSuccess(''); router.push('/login') }} className="auth-switch-link">
              Sign in
            </button>
          </p>
        </motion.div>
      </div>
    </main>
  )
}

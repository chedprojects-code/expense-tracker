'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { AuthMessage } from '@/components/auth/AuthMessage'
import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { ArrowRight, Eye, EyeOff, Loader2, Mail, Lock, User } from 'lucide-react'

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
    <AuthPageShell title="Create your account" description="Start tracking your finances today">
          {success && <AuthMessage type="success" message={success} />}
          {error && <AuthMessage type="error" message={error} />}
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
    </AuthPageShell>
  )
}

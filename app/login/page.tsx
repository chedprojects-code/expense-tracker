'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { AuthMessage } from '@/components/auth/AuthMessage'
import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { ArrowRight, Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()
  const { signIn, signUp, signInWithGoogle } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      if (isSignUp) {
        const { success, error: err } = await signUp(email, password, email.split('@')[0])
        if (!success) { setError(err || 'Sign up failed'); setLoading(false); return }
        setSuccess('Check your email for verification!')
      } else {
        const { success, error: err } = await signIn(email, password)
        if (!success) { setError(err || 'Login failed'); setLoading(false); return }
        router.push('/')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try { await signInWithGoogle() }
    catch (error: any) { setError(error.message || 'Google sign in failed') }
    finally { setLoading(false) }
  }

  return (
    <AuthPageShell
      title={isSignUp ? 'Create Account' : 'Welcome Back'}
      description={isSignUp ? 'Start tracking your finances today' : 'Sign in to manage your accounts and notes'}
    >
          {success && <AuthMessage type="success" message={success} />}
          {error && <AuthMessage type="error" message={error} />}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <Mail className="auth-field-icon" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="auth-input" />
            </div>
            <div className="auth-field">
              <Lock className="auth-field-icon" />
              <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="auth-input auth-input-pr" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="auth-eye">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <button type="submit" className="auth-btn-primary" disabled={loading}>
              <span className="auth-btn-shine" />
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="auth-divider"><span>Or continue with</span></div>

          <button onClick={handleGoogleSignIn} disabled={loading} className="auth-btn-google">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <p className="auth-switch">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess('') }} className="auth-switch-link">
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
    </AuthPageShell>
  )
}

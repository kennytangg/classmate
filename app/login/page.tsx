'use client'

import { useState } from 'react'
import { GraduationCap, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ModeToggle } from '@/components/mode-toggle'
import { auth } from '@/lib/firebase'
import { authClient } from '@/lib/auth-client'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const router = useRouter()

  const createSession = async (idToken: string) => {
    const res = await fetch('/api/auth/firebase', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    })

    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After')
      const mins = Math.ceil((retryAfter ? parseInt(retryAfter) : 900) / 60)
      throw new Error(`rate_limited:${mins}`)
    }

    if (!res.ok) {
      throw new Error('Failed to create session')
    }
  }

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError('Email and password are required')
      return
    }
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await authClient.signIn.email({
        email: email.trim(),
        password,
        callbackURL: '/dashboard',
      })

      if (error) {
        const next = failedAttempts + 1
        setFailedAttempts(next)
        if (next >= 5) {
          setError('Too many failed login attempts. Please wait a few minutes before trying again.')
        } else if (
          error.message?.toLowerCase().includes('invalid credentials') ||
          error.message?.toLowerCase().includes('invalid email or password')
        ) {
          setError('Invalid email or password.')
        } else if (error.message?.toLowerCase().includes('user not found')) {
          setError('No account found with this email. Please sign up first.')
        } else {
          setError(error.message ?? 'Sign-in failed. Please try again.')
        }
        return
      }

      if (data) {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const idToken = await result.user.getIdToken()

      await createSession(idToken)

      router.push('/')
      router.refresh()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : ''
      if (msg.startsWith('rate_limited:')) {
        const mins = msg.slice('rate_limited:'.length)
        setError(
          `Too many login attempts. Please try again in ${mins} minute${mins === '1' ? '' : 's'}.`
        )
      } else {
        setError(msg || 'Google sign in failed')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-background flex min-h-screen flex-col lg:flex-row">
      {/* Left Panel — same as landing page */}
      <div className="relative hidden overflow-hidden bg-[#0F0E17] lg:flex lg:w-1/2">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url('/hero-classmate.webp')`, filter: 'brightness(0.7)' }}
        />
        <div className="relative z-10 mt-auto w-full max-w-2xl p-12">
          <blockquote className="mb-6 font-serif text-4xl leading-tight font-medium text-white md:text-5xl">
            &quot;Education is the passport to the future, for tomorrow belongs to those who prepare
            for it today.&quot;
          </blockquote>
          <div className="flex items-center font-medium text-white/80">
            <div className="mr-3 h-px w-8 bg-white/50"></div>
            ClassMate Community
          </div>
        </div>
      </div>

      {/* Right Panel — the modal form, now a full page */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-8 py-10 lg:px-24">
        <div className="absolute top-4 right-4">
          <ModeToggle />
        </div>
        <div className="w-full max-w-[420px]">
          {/* Logo */}
          <div className="mb-6 flex items-center gap-2.5">
            <div className="bg-primary rounded-lg p-2">
              <GraduationCap className="text-primary-foreground h-5 w-5" />
            </div>
            <span
              className="text-foreground text-xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-outfit)' }}
            >
              ClassMate
            </span>
          </div>

          <h2 className="text-foreground mb-1 text-lg font-bold">Welcome back</h2>
          <p className="text-muted-foreground mb-6 text-sm">Sign in to your account to continue</p>

          {error && (
            <div className="text-semantic-error bg-semantic-error/10 border-semantic-error/30 mb-4 rounded-xl border p-3 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Google */}
            <Button
              variant="outline"
              className="bg-card text-foreground hover:bg-muted border-border flex h-9 w-full items-center justify-center gap-2.5 rounded-lg text-sm font-medium"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="flex items-center gap-3 py-1">
              <div className="bg-border h-px flex-1"></div>
              <span className="text-muted-foreground text-sm">or</span>
              <div className="bg-border h-px flex-1"></div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-foreground text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="border-border bg-card text-foreground focus:ring-ring w-full rounded-xl border py-2.5 pr-3 pl-10 text-sm focus:ring-2 focus:outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-foreground text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="border-border bg-card text-foreground focus:ring-ring w-full rounded-xl border py-2.5 pr-10 pl-10 text-sm focus:ring-2 focus:outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleEmailLogin}
              disabled={isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all disabled:opacity-50"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign In
            </button>

            {/* Switch to register */}
            <p className="text-muted-foreground text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

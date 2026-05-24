'use client'

import { useState } from 'react'
import { GraduationCap, User, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ModeToggle } from '@/components/mode-toggle'
import { authClient } from '@/lib/auth-client'
import { getAvatarUrl } from '@/lib/avatar'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validate = (): string | null => {
    if (!name.trim()) return 'Name is required.'
    if (!email.trim()) return 'Email is required.'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return 'Please enter a valid email address.'
    if (password.length < 8) return 'Password must be at least 8 characters.'
    if (password !== confirmPassword) return 'Passwords do not match.'
    return null
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const image = getAvatarUrl(name)
      const { data, error } = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim(),
        password,
        image,
        callbackURL: '/dashboard',
      })

      if (error) {
        toast.error(error.message ?? 'Registration failed.')
        return
      }
      if (data) {
        toast.success('Account created! Welcome to ClassMate.')
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-background flex min-h-screen flex-col lg:flex-row">
      {/* Left Panel — Form */}
      <div className="relative flex min-h-screen flex-col lg:w-1/2">
        <div className="absolute top-4 right-4">
          <ModeToggle />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-8 pb-10 lg:px-16">
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

            <h2 className="text-foreground mb-1 text-lg font-bold">Create your account</h2>
            <p className="text-muted-foreground mb-6 text-sm">Start your learning journey today</p>

            {error && (
              <div className="text-semantic-error bg-semantic-error/10 border-semantic-error/30 mb-4 rounded-xl border p-3 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-foreground text-sm font-medium">Full Name</label>
                <div className="relative">
                  <User className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    className="border-border bg-card text-foreground focus:ring-ring w-full rounded-xl border py-2.5 pr-3 pl-10 text-sm focus:ring-2 focus:outline-none"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  />
                </div>
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
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
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
                    placeholder="At least 8 characters"
                    className="border-border bg-card text-foreground focus:ring-ring w-full rounded-xl border py-2.5 pr-10 pl-10 text-sm focus:ring-2 focus:outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
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

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-foreground text-sm font-medium">Confirm Password</label>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    className="border-border bg-card text-foreground focus:ring-ring w-full rounded-xl border py-2.5 pr-10 pl-10 text-sm focus:ring-2 focus:outline-none"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={() => handleSubmit()}
                disabled={loading}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Account
              </button>

              <p className="text-muted-foreground text-xs leading-normal">
                By signing up, you agree to the{' '}
                <a href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </a>
                .
              </p>

              <p className="text-muted-foreground pt-2 text-center text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Image (flipped from login) */}
      <div className="relative hidden overflow-hidden bg-[#0F0E17] lg:flex lg:w-1/2">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url('/hero-classmate.webp')`, filter: 'brightness(0.7)' }}
        />
        <div className="relative z-10 mt-auto w-full p-12">
          <blockquote className="mb-6 font-serif text-4xl leading-tight font-medium text-white md:text-5xl">
            &quot;The beautiful thing about learning is that nobody can take it away from you.&quot;
          </blockquote>
          <div className="flex items-center font-medium text-white/80">
            <div className="mr-3 h-px w-8 bg-white/50"></div>
            ClassMate Community
          </div>
        </div>
      </div>
    </div>
  )
}

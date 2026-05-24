import Link from 'next/link'
import { GraduationCap } from 'lucide-react'
import { ModeToggle } from 'components/mode-toggle'
import { PublicFooter } from 'components/public/PublicFooter'
import { getSession } from '@/lib/auth'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ClassMate',
  description: 'Connect, learn, and grow together with students worldwide.',
}

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSession()

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <header className="border-border bg-background/95 sticky top-0 z-50 border-b backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-6 md:px-12">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary flex items-center justify-center rounded-lg p-1.5">
              <GraduationCap className="text-primary-foreground h-5 w-5" />
            </div>
            <span
              className="text-foreground text-base font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-outfit)' }}
            >
              ClassMate
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <ModeToggle />
            {session ? (
              <Link
                href="/dashboard"
                className="text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
              >
                ← Back to App
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <PublicFooter />
    </div>
  )
}

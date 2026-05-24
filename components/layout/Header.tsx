'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { User, Menu, GraduationCap, LogOut, Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/mode-toggle'
import { authClient } from '@/lib/auth-client'
import { getNavigationByGroup, type UserRole } from '@/lib/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

interface HeaderProps {
  onLogout?: () => void
}

export function Header({ onLogout }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = authClient.useSession()
  const userId = session?.user?.id
  const name = session?.user?.name ?? session?.user?.email?.split('@')[0] ?? 'User'
  const email = session?.user?.email ?? ''
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const { core: coreNavItems } = getNavigationByGroup(userRole)

  useEffect(() => {
    if (!userId) return
    fetch(`/api/user/profile?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.profile?.role) setUserRole(data.profile.role as UserRole)
      })
      .catch(console.error)
  }, [userId])

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await authClient.signOut()

      const res = await fetch('/api/logout', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to clear session')

      onLogout?.()
      toast.success('Successfully signed out')
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsLoggingOut(false)
    }
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <header className="border-border bg-background text-foreground sticky top-0 z-50 w-full border-b transition-colors duration-300">
      <div className="container mx-auto flex h-16 items-center justify-between px-6 md:px-12">
        {/* Logo */}
        <div className="flex items-center gap-8 md:gap-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary flex items-center justify-center rounded-lg p-1.5">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span
              className="text-foreground text-base font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-outfit)' }}
            >
              ClassMate
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="hidden items-center gap-1 text-sm md:flex">
          {coreNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative rounded-md px-3 py-1.5 transition-colors ${
                isActive(item.href)
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground font-normal'
              }`}
            >
              {item.label}
              {isActive(item.href) && (
                <span className="bg-primary absolute inset-x-3 -bottom-[18px] h-[2px] rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-4">
          <ModeToggle />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="group focus-visible:ring-ring rounded-full transition-all outline-none focus-visible:ring-2">
                <div className="bg-primary h-9 w-9 cursor-pointer rounded-full p-[2px] transition-transform group-hover:scale-105">
                  <div className="bg-background flex h-full w-full items-center justify-center rounded-full">
                    <User className="text-muted-foreground h-5 w-5" />
                  </div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm leading-none font-medium">{name}</p>
                  <p className="text-muted-foreground text-xs leading-none">{email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Account</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/schedule" className="cursor-pointer">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span>My Schedule</span>
                </Link>
              </DropdownMenuItem>

              {/* Sign Out */}
              <DropdownMenuItem
                className="text-semantic-error cursor-pointer"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground rounded-lg md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-background w-72 p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex h-full flex-col">
                {/* Brand header */}
                <div className="border-border flex items-center gap-3 border-b px-5 py-4 pr-12">
                  <div className="bg-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                    <GraduationCap className="h-4 w-4 text-white" />
                  </div>
                  <span
                    className="text-foreground text-sm font-bold"
                    style={{ fontFamily: 'var(--font-outfit)' }}
                  >
                    ClassMate
                  </span>
                </div>

                {/* Nav links */}
                <nav className="flex flex-col gap-1 px-3 py-4">
                  {coreNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? 'bg-accent text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, User, LogOut, Sun, Moon, Loader2, BookOpen, Shield, UserCog } from 'lucide-react'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'
import { useUserRole } from '@/lib/contexts/user-role-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotificationDropdown } from '@/components/features/notifications/NotificationDropdown'

const AVATAR_COLORS = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-fuchsia-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-indigo-500',
]

function getAvatarColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] as string
}

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  OWNER: {
    label: 'Owner',
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  },
  ADMIN: {
    label: 'Admin',
    className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  },
  MODERATOR: {
    label: 'Moderator',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
}

interface TopNavbarProps {
  onMobileMenuOpen: () => void
}

export function TopNavbar({ onMobileMenuOpen }: TopNavbarProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { role, userName, userEmail, userImage } = useUserRole()

  useEffect(() => {
    setMounted(true)
  }, [])

  const name = userName ?? userEmail?.split('@')[0] ?? 'User'
  const email = userEmail ?? ''
  const avatarColor = getAvatarColor(userEmail ?? userName ?? 'user')
  const roleBadge = role ? ROLE_BADGE[role] : null

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await authClient.signOut()
      const res = await fetch('/api/logout', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to clear session')
      toast.success('Successfully signed out')
      router.push('/login')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="bg-background sticky top-0 z-40 flex h-16 items-center gap-4 px-4">
      {/* Mobile hamburger — leftmost on mobile only */}
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground rounded-lg md:hidden"
        onClick={onMobileMenuOpen}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open navigation</span>
      </Button>

      {/* Logo — desktop only (sidebar handles branding on mobile) */}
      <div className="hidden items-center gap-3 md:flex">
        <div className="bg-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
          <BookOpen className="h-4 w-4 text-white" />
        </div>
        <span className="text-foreground text-base font-bold tracking-tight">ClassMate</span>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        {/* Notification bell */}
        <NotificationDropdown />

        {/* Role badge — only visible to elevated roles */}
        {roleBadge && (
          <span
            className={`hidden items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold sm:flex ${roleBadge.className}`}
          >
            <Shield className="h-3 w-3" />
            {roleBadge.label}
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              data-testid="avatar-dropdown-trigger"
              className="group focus-visible:ring-ring rounded-full outline-none focus-visible:ring-2"
            >
              <div className="bg-primary h-9 w-9 cursor-pointer rounded-full p-[2px] transition-transform group-hover:scale-105">
                {userImage ? (
                  <Image
                    src={userImage}
                    alt={userName ?? 'User avatar'}
                    width={36}
                    height={36}
                    className="h-full w-full rounded-full object-cover"
                    unoptimized
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <div
                    className={`flex h-full w-full items-center justify-center rounded-full ${avatarColor}`}
                  >
                    {name !== 'User' ? (
                      <span className="text-sm font-semibold text-white">
                        {name.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <User className="h-4 w-4 text-white" />
                    )}
                  </div>
                )}
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
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="cursor-pointer"
            >
              {mounted && theme === 'dark' ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Moon className="mr-2 h-4 w-4" />
              )}
              <span>Dark Mode</span>
            </DropdownMenuItem>

            {/* Moderation Queue — visible to MODERATOR, ADMIN, and OWNER */}
            {(role === 'MODERATOR' || role === 'ADMIN' || role === 'OWNER') && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/moderation" className="cursor-pointer">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Moderation Queue</span>
                  </Link>
                </DropdownMenuItem>
              </>
            )}

            {/* Admin/Owner shortcuts */}
            {(role === 'ADMIN' || role === 'OWNER') && (
              <DropdownMenuItem asChild>
                <Link href="/admin/users" className="cursor-pointer">
                  <UserCog className="mr-2 h-4 w-4" />
                  <span>Users</span>
                </Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
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
      </div>
    </header>
  )
}

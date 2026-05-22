'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  MessageSquare,
  MessagesSquare,
  Users,
  Calendar,
  Bot,
  User,
  Shield,
  UserCog,
  Menu,
  Compass,
  BookOpen,
  LogOut,
  Bell,
  type LucideIcon,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { getNavigationBySection, type NavigationItem, type SidebarSection } from '@/lib/navigation'
import { useUserRole } from '@/lib/contexts/user-role-context'
import { cn } from '@/lib/utils'
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  MessageSquare,
  MessagesSquare,
  Users,
  Calendar,
  Bot,
  User,
  Shield,
  UserCog,
  Compass,
  BookOpen,
  Bell,
}

// Duration that matches the sidebar width transition — keep these in sync.
const FADE = 'transition-opacity duration-[220ms]'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

function NavGroup({
  section,
  items,
  isActive,
  collapsed,
  onNavigate,
  badgeHref,
  badgeCount,
}: {
  section: SidebarSection
  items: NavigationItem[]
  isActive: (href: string) => boolean
  collapsed: boolean
  onNavigate?: () => void
  badgeHref?: string
  badgeCount?: number
}) {
  if (items.length === 0) return null

  return (
    <div className={cn('transition-[margin-bottom] duration-[220ms]', collapsed ? 'mb-0' : 'mb-4')}>
      {/* Section header — collapses in height + fades, no snap */}
      <p
        className={cn(
          'text-sidebar-foreground/40 overflow-hidden px-3 text-[10px] font-semibold tracking-widest whitespace-nowrap uppercase transition-all duration-[220ms]',
          collapsed ? 'mb-0 h-0 opacity-0' : 'mb-1.5 h-4 opacity-100'
        )}
      >
        {section}
      </p>

      {/* No flex gap — wrapper divs collapse to max-h-0 so hidden items leave zero space */}
      <div className="flex flex-col">
        {items.map((item) => {
          const Icon = ICON_MAP[item.icon] ?? User
          const active = isActive(item.href)
          const hasDot = badgeHref === item.href && typeof badgeCount === 'number' && badgeCount > 0
          const hideInCollapsed = collapsed && !item.pinned
          return (
            <div
              key={item.href}
              className={cn(
                'overflow-hidden transition-[max-height,opacity] duration-[220ms] ease-in-out',
                hideInCollapsed ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100'
              )}
            >
              <Link
                href={item.href}
                onClick={onNavigate}
                title={item.label}
                className={cn(
                  'mb-0.5 flex h-8 items-center gap-2.5 rounded-md px-3 text-[13px] transition-colors duration-150',
                  active
                    ? 'text-sidebar-foreground bg-black/25 font-medium'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground font-normal'
                )}
              >
                <Icon className="h-[15px] w-[15px] shrink-0" />
                <span
                  className={cn(
                    'flex min-w-0 flex-1 items-center gap-2',
                    FADE,
                    collapsed ? 'pointer-events-none opacity-0' : 'opacity-100'
                  )}
                >
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                  {hasDot && <span className="bg-primary ml-auto h-2 w-2 rounded-full" />}
                </span>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SidebarLogout({ collapsed }: { collapsed: boolean }) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

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
    <div className="px-2 pb-2">
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        title="Sign out"
        className="text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground flex h-8 w-full items-center gap-2.5 rounded-md px-3 text-[13px] transition-colors duration-150 disabled:opacity-50"
      >
        <LogOut className="h-[15px] w-[15px] shrink-0" />
        <span
          className={cn(
            'text-[13px] font-normal whitespace-nowrap',
            FADE,
            collapsed ? 'pointer-events-none opacity-0' : 'opacity-100'
          )}
        >
          Sign out
        </span>
      </button>
    </div>
  )
}

function SidebarContent({
  collapsed,
  onToggleCollapse,
  isActive,
  onNavigate,
}: {
  collapsed: boolean
  onToggleCollapse?: () => void
  isActive: (href: string) => boolean
  onNavigate?: () => void
}) {
  const { role } = useUserRole()
  const sections = getNavigationBySection(role)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    fetch('/api/connections/count')
      .then((r) => r.json())
      .then((data: { pending?: number }) => {
        if (typeof data.pending === 'number') setPendingCount(data.pending)
      })
      .catch(() => undefined)
  }, [])

  return (
    <div className="flex h-full flex-col">
      {/* Hamburger — fixed in viewport so it never moves during the sidebar width transition */}
      {onToggleCollapse && (
        <>
          {/* Spacer keeps the nav content from starting at the very top */}
          <div className="h-14 shrink-0" />
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground fixed top-3 left-3 z-40 hidden h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 md:flex"
          >
            <Menu className="h-4 w-4 shrink-0" />
          </button>
        </>
      )}

      {/* Nav groups */}
      <nav className={cn('flex-1 overflow-y-auto px-2 py-2', !onToggleCollapse && 'pt-6')}>
        {(['Learn', 'Connect', 'Account'] as SidebarSection[]).map((section) => (
          <NavGroup
            key={section}
            section={section}
            items={sections[section]}
            isActive={isActive}
            collapsed={collapsed}
            onNavigate={onNavigate}
            badgeHref={section === 'Connect' ? '/discover' : undefined}
            badgeCount={section === 'Connect' ? pendingCount : undefined}
          />
        ))}
      </nav>

      {/* Logout */}
      <SidebarLogout collapsed={collapsed} />
    </div>
  )
}

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href === '/profile') return pathname === '/profile'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Desktop sidebar — overflow-hidden lets the width transition act as a reveal mask */}
      <aside
        className={cn(
          'border-border bg-card fixed top-0 left-0 z-30 hidden h-full flex-col overflow-hidden border-r transition-all duration-[300ms] md:flex',
          collapsed ? 'w-14' : 'w-64'
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
          isActive={isActive}
        />
      </aside>

      {/* Mobile sidebar — Sheet */}
      <Sheet open={mobileOpen} onOpenChange={(open) => !open && onMobileClose()}>
        <SheetContent side="left" className="bg-card w-64 p-0">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SidebarContent collapsed={false} isActive={isActive} onNavigate={onMobileClose} />
        </SheetContent>
      </Sheet>
    </>
  )
}

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  MessageCircle,
  Calendar,
  Bot,
  User,
  Shield,
  UserCog,
  Menu,
  Compass,
  BookOpen,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { getNavigationBySection, type NavigationItem, type SidebarSection } from '@/lib/navigation'
import { useUserRole } from '@/lib/contexts/user-role-context'
import { cn } from '@/lib/utils'
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  MessageSquare,
  Users,
  MessageCircle,
  Calendar,
  Bot,
  User,
  Shield,
  UserCog,
  Compass,
  BookOpen,
}

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
}: {
  section: SidebarSection
  items: NavigationItem[]
  isActive: (href: string) => boolean
  collapsed: boolean
  onNavigate?: () => void
}) {
  if (items.length === 0) return null

  return (
    <div className="mb-4">
      {/* Section header — fades out when collapsed, takes no space */}
      <p
        className={cn(
          'text-sidebar-foreground/40 mb-1.5 overflow-hidden px-2 text-[10px] font-semibold tracking-widest whitespace-nowrap uppercase transition-all duration-200 ease-in-out',
          collapsed ? 'max-h-0 opacity-0' : 'max-h-6 opacity-100'
        )}
      >
        {section}
      </p>

      <div className="flex flex-col gap-0.5">
        {items.map((item) => {
          const Icon = ICON_MAP[item.icon] ?? User
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className="relative flex h-10 items-center"
            >
              {/* Collapsed view — centered 40×40 pill, crossfades in */}
              <span
                className={cn(
                  'absolute inset-0 flex items-center justify-center transition-opacity duration-200',
                  collapsed ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
                )}
              >
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-150',
                    active
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
              </span>

              {/* Expanded view — full-width row with label, crossfades in */}
              <span
                className={cn(
                  'absolute inset-0 flex items-center gap-2 rounded-lg px-2 text-sm font-medium transition-opacity duration-200',
                  collapsed ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100',
                  active
                    ? 'bg-sidebar-accent text-sidebar-primary border-sidebar-primary border-l-2'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </span>
            </Link>
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
    <div className="px-2 pb-3">
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        title="Sign out"
        className={cn(
          'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground flex h-10 w-full items-center rounded-lg transition-colors duration-150 disabled:opacity-50',
          collapsed ? 'justify-center' : 'gap-2 px-2'
        )}
      >
        <LogOut className="h-5 w-5 shrink-0" />
        {!collapsed && <span className="text-sm font-medium">Sign out</span>}
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

  return (
    <div className="flex h-full flex-col">
      {/* Hamburger toggle (desktop only) — always at same position */}
      {onToggleCollapse && (
        <div className="flex h-14 items-center px-2">
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-150"
          >
            <Menu className="h-5 w-5 shrink-0" />
          </button>
        </div>
      )}

      {/* Nav groups */}
      <nav className={cn('flex-1 overflow-y-auto px-2 py-2', !onToggleCollapse && 'pt-6')}>
        {(['Main', 'Account'] as SidebarSection[]).map((section) => (
          <NavGroup
            key={section}
            section={section}
            items={sections[section]}
            isActive={isActive}
            collapsed={collapsed}
            onNavigate={onNavigate}
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
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Desktop sidebar — fixed */}
      <aside
        className={cn(
          'border-border bg-card fixed top-0 left-0 z-30 hidden h-full flex-col border-r transition-all duration-300 md:flex',
          collapsed ? 'w-16' : 'w-64'
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

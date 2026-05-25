export type UserRole = 'STUDENT' | 'MODERATOR' | 'ADMIN' | 'OWNER'

type NavigationGroup = 'core' | 'more'
export type SidebarSection = 'Learn' | 'Connect' | 'Account'

export interface NavigationItem {
  href: string
  label: string
  group: NavigationGroup
  icon: string
  section: SidebarSection
  roles?: UserRole[]
  pinned?: boolean
}

export const navigationItems: NavigationItem[] = [
  // Learn — ordered by importance
  {
    href: '/dashboard',
    label: 'Home',
    group: 'core',
    icon: 'LayoutDashboard',
    section: 'Learn',
    pinned: true,
  },
  {
    href: '/ai-tutor',
    label: 'Learn with AI',
    group: 'core',
    icon: 'Bot',
    section: 'Learn',
    pinned: true,
  },
  {
    href: '/materials',
    label: 'Materials',
    group: 'core',
    icon: 'BookOpen',
    section: 'Learn',
    pinned: true,
  },
  { href: '/schedule', label: 'Schedule', group: 'core', icon: 'Calendar', section: 'Learn' },
  // Connect — ordered by importance; MessagesSquare (Chat) vs MessageSquare (Forums) are now visually distinct
  {
    href: '/forums',
    label: 'Forums',
    group: 'core',
    icon: 'MessageSquare',
    section: 'Connect',
    pinned: true,
  },
  {
    href: '/groups',
    label: 'Study Groups',
    group: 'core',
    icon: 'Users',
    section: 'Connect',
    pinned: true,
  },
  {
    href: '/chat',
    label: 'Direct Messages',
    group: 'core',
    icon: 'MessagesSquare',
    section: 'Connect',
  },
  { href: '/discover', label: 'Find People', group: 'core', icon: 'Compass', section: 'Connect' },
  // Account
  { href: '/profile', label: 'Profile', group: 'core', icon: 'User', section: 'Account' },
  {
    href: '/notifications',
    label: 'Notifications',
    group: 'core',
    icon: 'Bell',
    section: 'Account',
  },
  // Moderation — visible to MODERATOR and ADMIN (logs section shown only to ADMIN within the page)
  {
    href: '/admin/moderation',
    label: 'Moderation',
    group: 'core',
    icon: 'Shield',
    section: 'Account',
    roles: ['MODERATOR', 'ADMIN', 'OWNER'],
  },
  // User Management — ADMIN and OWNER
  {
    href: '/admin/users',
    label: 'Users',
    group: 'core',
    icon: 'UserCog',
    section: 'Account',
    roles: ['ADMIN', 'OWNER'],
  },
]

export function isNavigationItemVisible(item: NavigationItem, role: UserRole | null): boolean {
  if (!item.roles || item.roles.length === 0) return true
  if (!role) return false
  return item.roles.includes(role)
}

export function getNavigationByGroup(role: UserRole | null): {
  core: NavigationItem[]
  more: NavigationItem[]
} {
  const visibleItems = navigationItems.filter((item) => isNavigationItemVisible(item, role))
  return {
    core: visibleItems.filter((item) => item.group === 'core'),
    more: visibleItems.filter((item) => item.group === 'more'),
  }
}

export function getNavigationBySection(
  role: UserRole | null
): Record<SidebarSection, NavigationItem[]> {
  const visibleItems = navigationItems.filter((item) => isNavigationItemVisible(item, role))
  return {
    Learn: visibleItems.filter((item) => item.section === 'Learn'),
    Connect: visibleItems.filter((item) => item.section === 'Connect'),
    Account: visibleItems.filter((item) => item.section === 'Account'),
  }
}

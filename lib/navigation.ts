export type UserRole = 'STUDENT' | 'MODERATOR' | 'ADMIN' | 'OWNER'

type NavigationGroup = 'core' | 'more'
export type SidebarSection = 'Main' | 'Learning' | 'Secondary' | 'Account'

export interface NavigationItem {
  href: string
  label: string
  group: NavigationGroup
  icon: string
  section: SidebarSection
  roles?: UserRole[]
}

export const navigationItems: NavigationItem[] = [
  { href: '/dashboard', label: 'Home', group: 'core', icon: 'LayoutDashboard', section: 'Main' },
  { href: '/forums', label: 'Forums', group: 'core', icon: 'MessageSquare', section: 'Main' },
  { href: '/groups', label: 'Study Groups', group: 'core', icon: 'Users', section: 'Main' },
  { href: '/chat', label: 'Chat', group: 'core', icon: 'MessageCircle', section: 'Main' },
  { href: '/materials', label: 'Materials', group: 'core', icon: 'BookOpen', section: 'Main' },
  { href: '/schedule', label: 'Schedule', group: 'core', icon: 'Calendar', section: 'Secondary' },
  { href: '/ai-tutor', label: 'Learn with AI', group: 'core', icon: 'Bot', section: 'Secondary' },
  { href: '/profile', label: 'Profile', group: 'core', icon: 'User', section: 'Account' },
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
    Main: visibleItems.filter((item) => item.section === 'Main'),
    Learning: visibleItems.filter((item) => item.section === 'Learning'),
    Secondary: visibleItems.filter((item) => item.section === 'Secondary'),
    Account: visibleItems.filter((item) => item.section === 'Account'),
  }
}

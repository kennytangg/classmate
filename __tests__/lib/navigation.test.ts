import { getNavigationByGroup, isNavigationItemVisible, navigationItems } from '@/lib/navigation'

describe('navigation config', () => {
  it('groups visible items into core and more', () => {
    const { core } = getNavigationByGroup(null)

    expect(core.map((item) => item.href)).toEqual([
      '/dashboard',
      '/ai-tutor',
      '/materials',
      '/schedule',
      '/forums',
      '/groups',
      '/chat',
      '/discover',
      '/profile',
      '/notifications',
    ])
  })

  it('hides role-protected items when role is missing', () => {
    const moderationItem = navigationItems.find((item) => item.href === '/admin/moderation')
    if (!moderationItem) {
      throw new Error('Expected moderation route to exist in navigation config')
    }

    expect(isNavigationItemVisible(moderationItem, null)).toBe(false)
  })

  it('shows role-protected items for allowed role', () => {
    const { core } = getNavigationByGroup('ADMIN')

    expect(core.some((item) => item.href === '/admin/moderation')).toBe(true)
  })
})

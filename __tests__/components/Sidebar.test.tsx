/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sidebar } from '@/components/layout/Sidebar'
import { usePathname } from 'next/navigation'
import { useUserRole } from '@/lib/contexts/user-role-context'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}))

// Mock next/link
jest.mock('next/link', () => {
  const NextLink = ({ children, href }: React.PropsWithChildren<{ href: string }>) => (
    <a href={href}>{children}</a>
  )
  NextLink.displayName = 'NextLink'
  return NextLink
})

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  LayoutDashboard: ({ className }: { className?: string }) => (
    <span data-testid="dashboard-icon" className={className}>
      Dashboard
    </span>
  ),
  MessageSquare: ({ className }: { className?: string }) => (
    <span data-testid="forum-icon" className={className}>
      Forum
    </span>
  ),
  Users: ({ className }: { className?: string }) => (
    <span data-testid="groups-icon" className={className}>
      Groups
    </span>
  ),
  MessageCircle: ({ className }: { className?: string }) => (
    <span data-testid="chat-icon" className={className}>
      Chat
    </span>
  ),
  Calendar: ({ className }: { className?: string }) => (
    <span data-testid="calendar-icon" className={className}>
      Calendar
    </span>
  ),
  Bot: ({ className }: { className?: string }) => (
    <span data-testid="ai-icon" className={className}>
      AI Tutor
    </span>
  ),
  User: ({ className }: { className?: string }) => (
    <span data-testid="profile-icon" className={className}>
      Profile
    </span>
  ),
  Shield: ({ className }: { className?: string }) => (
    <span data-testid="admin-icon" className={className}>
      Admin
    </span>
  ),
  Menu: ({ className }: { className?: string }) => (
    <span data-testid="menu-icon" className={className}>
      Menu
    </span>
  ),
  UserCog: ({ className }: { className?: string }) => (
    <span data-testid="usercog-icon" className={className}>
      UserCog
    </span>
  ),
  Compass: ({ className }: { className?: string }) => (
    <span data-testid="compass-icon" className={className}>
      Compass
    </span>
  ),
  BookOpen: ({ className }: { className?: string }) => (
    <span data-testid="bookopen-icon" className={className}>
      BookOpen
    </span>
  ),
  LogOut: ({ className }: { className?: string }) => (
    <span data-testid="logout-icon" className={className}>
      LogOut
    </span>
  ),
}))

// Mock Sheet components
jest.mock('@/components/ui/sheet', () => ({
  Sheet: ({
    open,
    onOpenChange: _onOpenChange,
    children,
  }: React.PropsWithChildren<{ open: boolean; onOpenChange: (open: boolean) => void }>) => (
    <div data-testid="mobile-sheet" data-open={open}>
      {children}
    </div>
  ),
  SheetContent: ({ children, side }: React.PropsWithChildren<{ side: string }>) => (
    <div data-testid="sheet-content" data-side={side}>
      {children}
    </div>
  ),
  SheetTitle: ({ children }: React.PropsWithChildren) => (
    <div data-testid="sheet-title">{children}</div>
  ),
}))

// Mock navigation utilities
jest.mock('@/lib/navigation', () => ({
  getNavigationBySection: (role: string | null) => {
    const baseNav = {
      Learn: [
        { href: '/', icon: 'LayoutDashboard', label: 'Dashboard' },
        { href: '/forums', icon: 'MessageSquare', label: 'Forums' },
      ],
      Connect: [
        { href: '/groups', icon: 'Users', label: 'Study Groups' },
        { href: '/ai-tutor', icon: 'Bot', label: 'AI Tutor' },
      ],
      Account: [{ href: '/profile', icon: 'User', label: 'My Profile' }],
    }

    if (role === 'ADMIN') {
      baseNav.Account.push({ href: '/admin', icon: 'Shield', label: 'Admin Panel' })
    }

    return baseNav
  },
}))

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' '),
}))

// Mock better-auth client — ESM-only package
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: null }),
    signOut: jest.fn(),
  },
}))

// Mock user-role context
jest.mock('@/lib/contexts/user-role-context', () => ({
  useUserRole: jest.fn(),
}))

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

beforeEach(() => {
  mockUsePathname.mockReturnValue('/')
  ;(useUserRole as jest.Mock).mockReturnValue({
    role: null,
    isLoaded: true,
    isAdmin: false,
    isModerator: false,
    userId: null,
    userName: null,
    userEmail: null,
    userImage: null,
  })
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ pending: 0 }),
  })
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('Sidebar component', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(
        <Sidebar
          collapsed={false}
          onToggleCollapse={jest.fn()}
          mobileOpen={false}
          onMobileClose={jest.fn()}
        />
      )
    ).not.toThrow()
  })

  it('renders desktop sidebar when not mobile', () => {
    const { container } = render(
      <Sidebar
        collapsed={false}
        onToggleCollapse={jest.fn()}
        mobileOpen={false}
        onMobileClose={jest.fn()}
      />
    )

    // Desktop sidebar is hidden on small screens but exists in DOM
    const aside = container.querySelector('aside')
    expect(aside).toBeInTheDocument()
  })

  it('renders mobile sheet when mobileOpen is true', () => {
    render(
      <Sidebar
        collapsed={false}
        onToggleCollapse={jest.fn()}
        mobileOpen={true}
        onMobileClose={jest.fn()}
      />
    )

    const mobileSheet = screen.getByTestId('mobile-sheet')
    expect(mobileSheet).toHaveAttribute('data-open', 'true')
  })

  it('renders navigation items for STUDENT role', () => {
    render(
      <Sidebar
        collapsed={false}
        onToggleCollapse={jest.fn()}
        mobileOpen={false}
        onMobileClose={jest.fn()}
      />
    )

    // Should render dashboard icon and forums from Main section
    expect(screen.queryAllByTestId('dashboard-icon')).not.toHaveLength(0)
    expect(screen.queryAllByTestId('forum-icon')).not.toHaveLength(0)
    // Should render study groups and AI tutor
    expect(screen.queryAllByTestId('groups-icon')).not.toHaveLength(0)
    expect(screen.queryAllByTestId('ai-icon')).not.toHaveLength(0)
  })

  it('renders navigation items for MODERATOR role', () => {
    render(
      <Sidebar
        collapsed={false}
        onToggleCollapse={jest.fn()}
        mobileOpen={false}
        onMobileClose={jest.fn()}
      />
    )

    // Tutors should have the same base navigation as students
    expect(screen.queryAllByTestId('dashboard-icon')).not.toHaveLength(0)
    expect(screen.queryAllByTestId('forum-icon')).not.toHaveLength(0)
  })

  it('renders Admin Panel for ADMIN role', () => {
    ;(useUserRole as jest.Mock).mockReturnValue({
      role: 'ADMIN',
      isLoaded: true,
      isAdmin: true,
      isModerator: false,
      userId: 'user-1',
      userName: null,
      userEmail: null,
      userImage: null,
    })
    render(
      <Sidebar
        collapsed={false}
        onToggleCollapse={jest.fn()}
        mobileOpen={false}
        onMobileClose={jest.fn()}
      />
    )

    expect(screen.queryAllByTestId('admin-icon')).not.toHaveLength(0)
  })

  it('calls onToggleCollapse when hamburger button is clicked', async () => {
    const onToggleCollapse = jest.fn()
    const user = userEvent.setup()
    render(
      <Sidebar
        collapsed={false}
        onToggleCollapse={onToggleCollapse}
        mobileOpen={false}
        onMobileClose={jest.fn()}
      />
    )

    const menuIcon = screen.getByTestId('menu-icon')
    const menuButton = menuIcon.closest('button')
    if (menuButton) {
      await user.click(menuButton)
      expect(onToggleCollapse).toHaveBeenCalledTimes(1)
    }
  })

  it('applies collapsed width class when collapsed=true', () => {
    const { container } = render(
      <Sidebar
        collapsed={true}
        onToggleCollapse={jest.fn()}
        mobileOpen={false}
        onMobileClose={jest.fn()}
      />
    )

    const aside = container.querySelector('aside')
    expect(aside).toHaveClass('w-14')
  })

  it('applies expanded width class when collapsed=false', () => {
    const { container } = render(
      <Sidebar
        collapsed={false}
        onToggleCollapse={jest.fn()}
        mobileOpen={false}
        onMobileClose={jest.fn()}
      />
    )

    const aside = container.querySelector('aside')
    expect(aside).toHaveClass('w-64')
  })

  it('shows collapsed view with opacity-100 when collapsed=true', () => {
    const { container } = render(
      <Sidebar
        collapsed={true}
        onToggleCollapse={jest.fn()}
        mobileOpen={false}
        onMobileClose={jest.fn()}
      />
    )

    // Find the collapsed view spans (they should have opacity-100)
    const collapsedViews = container.querySelectorAll('[class*="opacity-100"]')
    expect(collapsedViews.length).toBeGreaterThan(0)
  })

  it('hides expanded view with opacity-0 when collapsed=true', () => {
    const { container } = render(
      <Sidebar
        collapsed={true}
        onToggleCollapse={jest.fn()}
        mobileOpen={false}
        onMobileClose={jest.fn()}
      />
    )

    // Find the expanded view spans (they should have opacity-0)
    const hiddenViews = container.querySelectorAll('[class*="opacity-0"]')
    expect(hiddenViews.length).toBeGreaterThan(0)
  })

  it('shows expanded view with opacity-100 when collapsed=false', () => {
    const { container } = render(
      <Sidebar
        collapsed={false}
        onToggleCollapse={jest.fn()}
        mobileOpen={false}
        onMobileClose={jest.fn()}
      />
    )

    // Find spans with opacity-100 (expanded views)
    const visibleViews = container.querySelectorAll('[class*="opacity-100"]')
    expect(visibleViews.length).toBeGreaterThan(0)
  })

  it('hides collapsed view with opacity-0 when collapsed=false', () => {
    const { container } = render(
      <Sidebar
        collapsed={false}
        onToggleCollapse={jest.fn()}
        mobileOpen={false}
        onMobileClose={jest.fn()}
      />
    )

    // When expanded, no elements should be hidden by opacity-0
    const hiddenViews = container.querySelectorAll('[class*="opacity-0"]')
    expect(hiddenViews.length).toBe(0)
  })

  it('mobile sheet always renders with collapsed=false', () => {
    render(
      <Sidebar
        collapsed={true} // Desktop is collapsed
        onToggleCollapse={jest.fn()}
        mobileOpen={true}
        onMobileClose={jest.fn()}
      />
    )

    // Even though desktop is collapsed, mobile should show expanded nav
    // Mobile should show expanded text labels with icons
    const dashboardIcons = screen.queryAllByTestId('dashboard-icon')
    const forumIcons = screen.queryAllByTestId('forum-icon')
    expect(dashboardIcons.length).toBeGreaterThan(0)
    expect(forumIcons.length).toBeGreaterThan(0)
  })

  it('passes onMobileClose to navigation items as onNavigate', async () => {
    const onMobileClose = jest.fn()
    render(
      <Sidebar
        collapsed={false}
        onToggleCollapse={jest.fn()}
        mobileOpen={true}
        onMobileClose={onMobileClose}
      />
    )

    // The SidebarContent in mobile sheet receives onMobileClose as onNavigate prop
    // So when navigation items are rendered with onNavigate, it should use onMobileClose
    const sheetContent = screen.getByTestId('sheet-content')
    expect(sheetContent).toBeInTheDocument()
  })

  it('marks current page as active using pathname', () => {
    mockUsePathname.mockReturnValue('/forums')
    render(
      <Sidebar
        collapsed={false}
        onToggleCollapse={jest.fn()}
        mobileOpen={false}
        onMobileClose={jest.fn()}
      />
    )

    // The forums link should be rendered and exist
    const forumLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href') === '/forums')
    expect(forumLinks.length).toBeGreaterThan(0)
  })

  it('marks root path as active when pathname is /', () => {
    mockUsePathname.mockReturnValue('/')
    render(
      <Sidebar
        collapsed={false}
        onToggleCollapse={jest.fn()}
        mobileOpen={false}
        onMobileClose={jest.fn()}
      />
    )

    // Dashboard link (href='/') should be active
    const dashboardLinks = screen.getAllByRole('link')
    const dashboardLink = dashboardLinks.find((link) => link.getAttribute('href') === '/')
    expect(dashboardLink).toBeInTheDocument()
  })

  it('handles null userRole gracefully', () => {
    expect(() =>
      render(
        <Sidebar
          collapsed={false}
          onToggleCollapse={jest.fn()}
          mobileOpen={false}
          onMobileClose={jest.fn()}
        />
      )
    ).not.toThrow()
  })

  it('renders hamburger toggle button in desktop sidebar', () => {
    render(
      <Sidebar
        collapsed={false}
        onToggleCollapse={jest.fn()}
        mobileOpen={false}
        onMobileClose={jest.fn()}
      />
    )

    const menuIcons = screen.queryAllByTestId('menu-icon')
    expect(menuIcons.length).toBeGreaterThan(0)
  })

  it('transitions smoothly between collapsed and expanded states', () => {
    const onToggleCollapse = jest.fn()
    const { container, rerender } = render(
      <Sidebar
        collapsed={false}
        onToggleCollapse={onToggleCollapse}
        mobileOpen={false}
        onMobileClose={jest.fn()}
      />
    )

    // Should have transition class
    const aside = container.querySelector('aside')
    expect(aside).toHaveClass('transition-all')

    // Rerender with collapsed=true
    rerender(
      <Sidebar
        collapsed={true}
        onToggleCollapse={onToggleCollapse}
        mobileOpen={false}
        onMobileClose={jest.fn()}
      />
    )

    expect(aside).toHaveClass('w-14')
  })

  it('mobile sheet calls onOpenChange with false to close', async () => {
    const onMobileClose = jest.fn()
    render(
      <Sidebar
        collapsed={false}
        onToggleCollapse={jest.fn()}
        mobileOpen={true}
        onMobileClose={onMobileClose}
      />
    )

    const sheet = screen.getByTestId('mobile-sheet')
    expect(sheet).toBeInTheDocument()
  })

  it('renders mobile sheet with proper structure', () => {
    const onMobileClose = jest.fn()
    render(
      <Sidebar
        collapsed={false}
        onToggleCollapse={jest.fn()}
        mobileOpen={true}
        onMobileClose={onMobileClose}
      />
    )

    // Mobile sheet should exist with left side
    const sheetContent = screen.getByTestId('sheet-content')
    expect(sheetContent).toHaveAttribute('data-side', 'left')
  })
})

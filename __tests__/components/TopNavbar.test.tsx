/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TopNavbar } from '@/components/layout/TopNavbar'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { useUserRole } from '@/lib/contexts/user-role-context'

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock auth-client
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    signOut: jest.fn(),
  },
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ''} />
  ),
}))

// Mock user-role context
jest.mock('@/lib/contexts/user-role-context', () => ({
  useUserRole: jest.fn(),
}))

// Mock NotificationDropdown — avoids fetch calls and useNotifications hook in tests
jest.mock('@/components/features/notifications/NotificationDropdown', () => ({
  NotificationDropdown: () => null,
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ...jest.requireActual('lucide-react'),
  Menu: () => <span data-testid="menu-icon">Menu</span>,
  User: () => <span data-testid="user-icon">User</span>,
  LogOut: () => <span data-testid="logout-icon">LogOut</span>,
  Settings: () => <span data-testid="settings-icon">Settings</span>,
  Sun: () => <span data-testid="sun-icon">Sun</span>,
  Moon: () => <span data-testid="moon-icon">Moon</span>,
  Loader2: () => <span data-testid="loader-icon">Loader2</span>,
  BookOpen: () => <span data-testid="book-icon">Book</span>,
}))

// Default mocks setup
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockToast = toast as jest.Mocked<typeof toast>
const mockAuthClient = authClient as jest.Mocked<typeof authClient>

const mockPush = jest.fn()
const mockRefresh = jest.fn()

beforeEach(() => {
  mockUseTheme.mockReturnValue({
    theme: 'light',
    setTheme: jest.fn(),
    themes: ['light', 'dark'],
    systemTheme: 'light',
    resolvedTheme: 'light',
  } as ReturnType<typeof useTheme>)

  mockUseRouter.mockReturnValue({
    push: mockPush,
    refresh: mockRefresh,
  } as ReturnType<typeof useRouter>)
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
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('TopNavbar component', () => {
  it('renders without crashing', () => {
    const onMobileMenuOpen = jest.fn()
    expect(() =>
      render(
        <TopNavbar
          onMobileMenuOpen={onMobileMenuOpen}
          userName="Test User"
          userEmail="test@example.com"
        />
      )
    ).not.toThrow()
  })

  it('renders the ClassMate logo', () => {
    const onMobileMenuOpen = jest.fn()
    render(
      <TopNavbar
        onMobileMenuOpen={onMobileMenuOpen}
        userName="Test User"
        userEmail="test@example.com"
      />
    )

    expect(screen.getByText('ClassMate')).toBeInTheDocument()
  })

  it('calls onMobileMenuOpen when hamburger button is clicked', async () => {
    const onMobileMenuOpen = jest.fn()
    const user = userEvent.setup()
    render(
      <TopNavbar
        onMobileMenuOpen={onMobileMenuOpen}
        userName="Test User"
        userEmail="test@example.com"
      />
    )

    const hamburgerButton = screen.getByRole('button', {
      name: /open navigation/i,
    })
    await user.click(hamburgerButton)

    expect(onMobileMenuOpen).toHaveBeenCalledTimes(1)
  })

  it('displays user name from props when provided', async () => {
    ;(useUserRole as jest.Mock).mockReturnValue({
      role: null,
      isLoaded: true,
      isAdmin: false,
      isModerator: false,
      userId: null,
      userName: 'John Doe',
      userEmail: 'john@example.com',
      userImage: null,
    })
    const onMobileMenuOpen = jest.fn()
    const user = userEvent.setup()
    render(<TopNavbar onMobileMenuOpen={onMobileMenuOpen} />)

    // Open dropdown to see the name
    const avatarButton = screen.getByTestId('avatar-dropdown-trigger')
    await user.click(avatarButton)

    // After opening dropdown, the name should appear in the label
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('displays email from props when provided', async () => {
    ;(useUserRole as jest.Mock).mockReturnValue({
      role: null,
      isLoaded: true,
      isAdmin: false,
      isModerator: false,
      userId: null,
      userName: 'Jane Smith',
      userEmail: 'jane@example.com',
      userImage: null,
    })
    const onMobileMenuOpen = jest.fn()
    const user = userEvent.setup()
    render(<TopNavbar onMobileMenuOpen={onMobileMenuOpen} />)

    const avatarButton = screen.getByTestId('avatar-dropdown-trigger')
    await user.click(avatarButton)

    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
  })

  it('extracts name from email when userName is not provided', async () => {
    ;(useUserRole as jest.Mock).mockReturnValue({
      role: null,
      isLoaded: true,
      isAdmin: false,
      isModerator: false,
      userId: null,
      userName: null,
      userEmail: 'john.doe@example.com',
      userImage: null,
    })
    const onMobileMenuOpen = jest.fn()
    const user = userEvent.setup()
    render(<TopNavbar onMobileMenuOpen={onMobileMenuOpen} />)

    const avatarButton = screen.getByTestId('avatar-dropdown-trigger')
    await user.click(avatarButton)

    // Name should be extracted from email prefix
    expect(screen.getByText('john.doe')).toBeInTheDocument()
  })

  it('displays "User" as fallback when no name and no email provided', () => {
    const onMobileMenuOpen = jest.fn()
    render(<TopNavbar onMobileMenuOpen={onMobileMenuOpen} />)

    // Should render User icon instead of text when name is "User"
    expect(screen.getByTestId('user-icon')).toBeInTheDocument()
  })

  it('renders user avatar with initials when userImage is not provided', () => {
    ;(useUserRole as jest.Mock).mockReturnValue({
      role: null,
      isLoaded: true,
      isAdmin: false,
      isModerator: false,
      userId: null,
      userName: 'Alice Brown',
      userEmail: 'alice@example.com',
      userImage: null,
    })
    const onMobileMenuOpen = jest.fn()
    render(<TopNavbar onMobileMenuOpen={onMobileMenuOpen} />)

    // Avatar should show the first letter initial
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('renders user avatar image when userImage is provided', () => {
    ;(useUserRole as jest.Mock).mockReturnValue({
      role: null,
      isLoaded: true,
      isAdmin: false,
      isModerator: false,
      userId: null,
      userName: 'Bob Wilson',
      userEmail: 'bob@example.com',
      userImage: 'https://example.com/bob-avatar.jpg',
    })
    const onMobileMenuOpen = jest.fn()
    render(<TopNavbar onMobileMenuOpen={onMobileMenuOpen} />)

    const avatar = screen.getByAltText('Bob Wilson')
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveAttribute('src', expect.stringContaining('bob-avatar.jpg'))
  })

  it('applies deterministic color class to avatar when no image', () => {
    const onMobileMenuOpen = jest.fn()
    const { container } = render(
      <TopNavbar
        onMobileMenuOpen={onMobileMenuOpen}
        userName="Test User"
        userEmail="test@example.com"
      />
    )

    // Avatar should have a bg-* color class
    const avatarDiv = container.querySelector('div[class*="bg-"]')
    expect(avatarDiv).toBeInTheDocument()
  })

  it('shows Profile menu item that links to /profile', async () => {
    const onMobileMenuOpen = jest.fn()
    const user = userEvent.setup()
    render(
      <TopNavbar
        onMobileMenuOpen={onMobileMenuOpen}
        userName="Test User"
        userEmail="test@example.com"
      />
    )

    // Open the dropdown by clicking the avatar area
    const avatarButton = screen.getByTestId('avatar-dropdown-trigger') // Skip hamburger, get avatar
    await user.click(avatarButton)

    // Profile link should be visible
    expect(screen.getByText('Profile')).toBeInTheDocument()
    const profileLink = screen.getByRole('menuitem', { name: /profile/i })
    expect(profileLink).toHaveAttribute('href', '/profile')
  })

  it('shows Sign Out button', async () => {
    const onMobileMenuOpen = jest.fn()
    const user = userEvent.setup()
    render(
      <TopNavbar
        onMobileMenuOpen={onMobileMenuOpen}
        userName="Test User"
        userEmail="test@example.com"
      />
    )

    const avatarButton = screen.getByTestId('avatar-dropdown-trigger')
    await user.click(avatarButton)

    expect(screen.getByText('Sign Out')).toBeInTheDocument()
  })

  it('calls authClient.signOut and logout API when Sign Out is clicked', async () => {
    mockAuthClient.signOut.mockResolvedValueOnce(null)
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Logged out' }),
    })

    const onMobileMenuOpen = jest.fn()
    const user = userEvent.setup()
    render(
      <TopNavbar
        onMobileMenuOpen={onMobileMenuOpen}
        userName="Test User"
        userEmail="test@example.com"
      />
    )

    const avatarButton = screen.getByTestId('avatar-dropdown-trigger')
    await user.click(avatarButton)

    const signOutButton = screen.getByRole('menuitem', { name: /sign out/i })
    await user.click(signOutButton)

    await waitFor(() => {
      expect(mockAuthClient.signOut).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/logout', {
        method: 'POST',
      })
    })
  })

  it('navigates to /login and refreshes after successful logout', async () => {
    mockAuthClient.signOut.mockResolvedValueOnce(null)
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Logged out' }),
    })

    const onMobileMenuOpen = jest.fn()
    const user = userEvent.setup()
    render(
      <TopNavbar
        onMobileMenuOpen={onMobileMenuOpen}
        userName="Test User"
        userEmail="test@example.com"
      />
    )

    const avatarButton = screen.getByTestId('avatar-dropdown-trigger')
    await user.click(avatarButton)

    const signOutButton = screen.getByRole('menuitem', { name: /sign out/i })
    await user.click(signOutButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('shows success toast after logout', async () => {
    mockAuthClient.signOut.mockResolvedValueOnce(null)
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Logged out' }),
    })

    const onMobileMenuOpen = jest.fn()
    const user = userEvent.setup()
    render(
      <TopNavbar
        onMobileMenuOpen={onMobileMenuOpen}
        userName="Test User"
        userEmail="test@example.com"
      />
    )

    const avatarButton = screen.getByTestId('avatar-dropdown-trigger')
    await user.click(avatarButton)

    const signOutButton = screen.getByRole('menuitem', { name: /sign out/i })
    await user.click(signOutButton)

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Successfully signed out')
    })
  })

  it('shows error toast when logout API fails', async () => {
    mockAuthClient.signOut.mockResolvedValueOnce(null)
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error',
    })

    const onMobileMenuOpen = jest.fn()
    const user = userEvent.setup()
    render(
      <TopNavbar
        onMobileMenuOpen={onMobileMenuOpen}
        userName="Test User"
        userEmail="test@example.com"
      />
    )

    const avatarButton = screen.getByTestId('avatar-dropdown-trigger')
    await user.click(avatarButton)

    const signOutButton = screen.getByRole('menuitem', { name: /sign out/i })
    await user.click(signOutButton)

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalled()
    })
  })

  it('disables sign out button during logout', async () => {
    mockAuthClient.signOut.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(resolve, 50)
        })
    )
    global.fetch = jest.fn().mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({ ok: true, json: async () => ({ message: 'Logged out' }) })
          }, 50)
        })
    )

    const onMobileMenuOpen = jest.fn()
    const user = userEvent.setup()
    render(
      <TopNavbar
        onMobileMenuOpen={onMobileMenuOpen}
        userName="Test User"
        userEmail="test@example.com"
      />
    )

    const avatarButton = screen.getByTestId('avatar-dropdown-trigger')
    await user.click(avatarButton)

    const signOutButton = screen.getByRole('menuitem', { name: /sign out/i })
    await user.click(signOutButton)

    // During logout, button should be disabled
    await waitFor(() => {
      expect(signOutButton).toHaveAttribute('data-disabled')
    })
  })

  it('toggles dark mode when Dark Mode button is clicked', async () => {
    const mockSetTheme = jest.fn()
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      themes: ['light', 'dark'],
      systemTheme: 'light',
      resolvedTheme: 'light',
    } as ReturnType<typeof useTheme>)

    const onMobileMenuOpen = jest.fn()
    const user = userEvent.setup()
    const { rerender } = render(
      <TopNavbar
        onMobileMenuOpen={onMobileMenuOpen}
        userName="Test User"
        userEmail="test@example.com"
      />
    )

    const avatarButton = screen.getByTestId('avatar-dropdown-trigger')
    await user.click(avatarButton)

    const darkModeButton = screen.getByRole('menuitem', { name: /dark mode/i })
    await user.click(darkModeButton)

    expect(mockSetTheme).toHaveBeenCalledWith('dark')

    // Rerender with dark theme
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
      themes: ['light', 'dark'],
      systemTheme: 'dark',
      resolvedTheme: 'dark',
    } as ReturnType<typeof useTheme>)

    rerender(
      <TopNavbar
        onMobileMenuOpen={onMobileMenuOpen}
        userName="Test User"
        userEmail="test@example.com"
      />
    )

    await user.click(avatarButton)
    const darkModeButton2 = screen.getByRole('menuitem', { name: /dark mode/i })
    await user.click(darkModeButton2)

    expect(mockSetTheme).toHaveBeenCalledWith('light')
  })

  it('shows Moon icon when theme is light', async () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: jest.fn(),
      themes: ['light', 'dark'],
      systemTheme: 'light',
      resolvedTheme: 'light',
    } as ReturnType<typeof useTheme>)

    const onMobileMenuOpen = jest.fn()
    const user = userEvent.setup()
    render(
      <TopNavbar
        onMobileMenuOpen={onMobileMenuOpen}
        userName="Test User"
        userEmail="test@example.com"
      />
    )

    const avatarButton = screen.getByTestId('avatar-dropdown-trigger')
    await user.click(avatarButton)

    expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
  })

  it('shows Sun icon when theme is dark', async () => {
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      setTheme: jest.fn(),
      themes: ['light', 'dark'],
      systemTheme: 'dark',
      resolvedTheme: 'dark',
    } as ReturnType<typeof useTheme>)

    const onMobileMenuOpen = jest.fn()
    const user = userEvent.setup()
    render(
      <TopNavbar
        onMobileMenuOpen={onMobileMenuOpen}
        userName="Test User"
        userEmail="test@example.com"
      />
    )

    const avatarButton = screen.getByTestId('avatar-dropdown-trigger')
    await user.click(avatarButton)

    expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
  })
})

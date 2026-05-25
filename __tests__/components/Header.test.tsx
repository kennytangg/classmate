/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { Header } from '@/components/layout/Header'

// Mock the better-auth client — Header calls authClient.useSession()
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: null }),
    signOut: jest.fn().mockResolvedValue(undefined),
  },
}))

// Mock next/navigation — required for next/link in jsdom
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/',
}))

// Mock the ModeToggle component — it uses next-themes which needs a ThemeProvider
// Use @/ prefix so Jest's moduleNameMapper can resolve the path
jest.mock('@/components/mode-toggle', () => ({
  ModeToggle: () => <button aria-label="Toggle theme">Theme</button>,
}))

// Mock the Sheet component — Radix UI portals don't work well in jsdom
jest.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetClose: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock the DropdownMenu component — Radix UI portals don't work well in jsdom
jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <div />,
}))

describe('Header component', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    expect(() => render(<Header />)).not.toThrow()
  })

  it('displays the ClassMate brand name', () => {
    render(<Header />)

    expect(screen.getAllByText('ClassMate')[0]).toBeInTheDocument()
  })

  it('renders the user menu trigger button', () => {
    render(<Header />)

    // The user avatar button wraps a gradient div — findable via role
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('renders navigation links for core pages', () => {
    render(<Header />)

    // Main navigation items — appear in both desktop nav and mobile drawer
    expect(screen.getAllByRole('link', { name: /home/i })[0]).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /forums/i })[0]).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /direct messages/i })[0]).toBeInTheDocument()
  })

  it('renders the Learn with AI navigation link', () => {
    render(<Header />)

    expect(screen.getAllByRole('link', { name: /learn with ai/i })[0]).toBeInTheDocument()
  })

  it('renders the theme toggle button', () => {
    render(<Header />)

    expect(screen.getByLabelText(/toggle theme/i)).toBeInTheDocument()
  })
})

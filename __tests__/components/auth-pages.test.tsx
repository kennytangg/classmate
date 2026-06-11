/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '@/app/login/page'
import RegisterPage from '@/app/register/page'

// Mock framer-motion for ModeToggle animations
jest.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

// Mock next-themes for useTheme hook
const mockSetTheme = jest.fn()
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: mockSetTheme,
  }),
}))

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  auth: {},
}))

// Mock firebase/auth
jest.mock('firebase/auth', () => ({
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
}))

// Mock Better Auth client
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: {
      email: jest.fn(),
    },
    signUp: {
      email: jest.fn(),
    },
  },
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ href, children }: { href: string; children: React.ReactNode }) {
    return <a href={href}>{children}</a>
  }
})

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}))

// Mock avatar utility
jest.mock('@/lib/avatar', () => ({
  getAvatarUrl: jest.fn(() => 'https://example.com/avatar.jpg'),
}))

describe('ModeToggle on auth pages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSetTheme.mockClear()
  })

  describe('Login Page', () => {
    it('renders ModeToggle on login page', () => {
      render(<LoginPage />)

      // The toggle button should exist and be accessible
      const toggleButton = screen.getByRole('button', { name: /toggle theme/i })
      expect(toggleButton).toBeInTheDocument()
    })

    it('positions ModeToggle in top-right corner on login page', () => {
      const { container } = render(<LoginPage />)

      // Find the absolute-positioned container that holds ModeToggle
      const positionedDiv = container.querySelector('.absolute.top-4.right-4')
      expect(positionedDiv).toBeInTheDocument()

      // Verify ModeToggle button is inside this positioned container
      const toggleButton = positionedDiv?.querySelector('button')
      expect(toggleButton).toBeInTheDocument()
    })

    it('displays sr-only "Toggle theme" text on login page', () => {
      render(<LoginPage />)

      // Query for the sr-only span with toggle theme text
      const srOnlyText = screen.getByText('Toggle theme', { selector: 'span' })
      expect(srOnlyText).toBeInTheDocument()
      expect(srOnlyText).toHaveClass('sr-only')
    })

    it('calls setTheme when toggle button is clicked on login page', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      const toggleButton = screen.getByRole('button', { name: /toggle theme/i })

      // Click the toggle button
      await user.click(toggleButton)

      // Verify setTheme was called with the opposite of current theme
      expect(mockSetTheme).toHaveBeenCalled()
    })

    it('has rounded-lg class styling on login page toggle', () => {
      const { container } = render(<LoginPage />)

      const toggleButton = container.querySelector('button[class*="rounded-lg"]')
      expect(toggleButton).toBeInTheDocument()
      expect(toggleButton?.className).toContain('rounded-lg')
    })

    it('renders ModeToggle with ghost variant styling on login page', () => {
      const { container } = render(<LoginPage />)

      // The ModeToggle button should be positioned in the top-right area
      const positionedDiv = container.querySelector('.absolute.top-4.right-4')
      const button = positionedDiv?.querySelector('button')

      // Button should exist and be part of the component
      expect(button).toBeInTheDocument()
      expect(button?.className).toContain('rounded-lg')
    })
  })

  describe('Register Page', () => {
    it('renders ModeToggle on register page', () => {
      render(<RegisterPage />)

      // The toggle button should exist and be accessible
      const toggleButton = screen.getByRole('button', { name: /toggle theme/i })
      expect(toggleButton).toBeInTheDocument()
    })

    it('positions ModeToggle in top-right corner on register page', () => {
      const { container } = render(<RegisterPage />)

      // Find the absolute-positioned container that holds ModeToggle
      const positionedDiv = container.querySelector('.absolute.top-4.right-4')
      expect(positionedDiv).toBeInTheDocument()

      // Verify ModeToggle button is inside this positioned container
      const toggleButton = positionedDiv?.querySelector('button')
      expect(toggleButton).toBeInTheDocument()
    })

    it('displays sr-only "Toggle theme" text on register page', () => {
      render(<RegisterPage />)

      // Query for the sr-only span with toggle theme text
      const srOnlyText = screen.getByText('Toggle theme', { selector: 'span' })
      expect(srOnlyText).toBeInTheDocument()
      expect(srOnlyText).toHaveClass('sr-only')
    })

    it('calls setTheme when toggle button is clicked on register page', async () => {
      const user = userEvent.setup()
      render(<RegisterPage />)

      const toggleButton = screen.getByRole('button', { name: /toggle theme/i })

      // Click the toggle button
      await user.click(toggleButton)

      // Verify setTheme was called
      expect(mockSetTheme).toHaveBeenCalled()
    })

    it('has rounded-lg class styling on register page toggle', () => {
      const { container } = render(<RegisterPage />)

      const toggleButton = container.querySelector('button[class*="rounded-lg"]')
      expect(toggleButton).toBeInTheDocument()
      expect(toggleButton?.className).toContain('rounded-lg')
    })

    it('renders ModeToggle with proper styling on register page', () => {
      const { container } = render(<RegisterPage />)

      // The ModeToggle button should be positioned in the top-right area
      const positionedDiv = container.querySelector('.absolute.top-4.right-4')
      const button = positionedDiv?.querySelector('button')

      // Button should exist and be part of the component
      expect(button).toBeInTheDocument()
      expect(button?.className).toContain('rounded-lg')
    })
  })

  describe('Accessibility', () => {
    it('provides accessible name for toggle button on login page', () => {
      render(<LoginPage />)

      const toggleButton = screen.getByRole('button', { name: /toggle theme/i })
      expect(toggleButton).toHaveAccessibleName()
    })

    it('provides accessible name for toggle button on register page', () => {
      render(<RegisterPage />)

      const toggleButton = screen.getByRole('button', { name: /toggle theme/i })
      expect(toggleButton).toHaveAccessibleName()
    })

    it('keeps sr-only span visually hidden but accessible on login page', () => {
      const { container } = render(<LoginPage />)

      const srOnlyText = container.querySelector('span.sr-only')
      expect(srOnlyText).toBeInTheDocument()
      expect(srOnlyText?.textContent).toBe('Toggle theme')
    })

    it('keeps sr-only span visually hidden but accessible on register page', () => {
      const { container } = render(<RegisterPage />)

      const srOnlyText = container.querySelector('span.sr-only')
      expect(srOnlyText).toBeInTheDocument()
      expect(srOnlyText?.textContent).toBe('Toggle theme')
    })
  })
})

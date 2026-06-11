/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '@/app/login/page'
import { authClient } from '@/lib/auth-client'

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

jest.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: jest.fn() }),
}))

const mockPush = jest.fn()
const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => new URLSearchParams(),
}))

jest.mock('next/link', () => {
  return function MockLink({ href, children }: { href: string; children: React.ReactNode }) {
    return <a href={href}>{children}</a>
  }
})

jest.mock('@/lib/firebase', () => ({ auth: {} }))
jest.mock('firebase/auth', () => ({
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
}))

jest.mock('@/lib/auth-client', () => ({
  authClient: { signIn: { email: jest.fn() } },
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('LoginPage', () => {
  it('renders email and password fields', () => {
    render(<LoginPage />)

    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
  })

  it('shows validation error when fields are empty', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(screen.getByText('Email and password are required')).toBeInTheDocument()
  })

  it('calls signIn endpoint with correct payload', async () => {
    jest
      .mocked(authClient.signIn.email)
      .mockResolvedValue({ data: { token: 'abc' }, error: null } as never)
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByPlaceholderText('you@example.com'), 'john@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(authClient.signIn.email).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'john@example.com',
          password: 'password123',
        })
      )
    })
  })

  it('shows inline error on invalid credentials', async () => {
    jest.mocked(authClient.signIn.email).mockResolvedValue({
      data: null,
      error: { message: 'Invalid credentials' },
    } as never)
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByPlaceholderText('you@example.com'), 'john@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password.')).toBeInTheDocument()
    })
  })

  it('shows generic error on unexpected failure', async () => {
    jest.mocked(authClient.signIn.email).mockResolvedValue({
      data: null,
      error: { message: 'Internal server error' },
    } as never)
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByPlaceholderText('you@example.com'), 'john@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText('Internal server error')).toBeInTheDocument()
    })
  })

  it('disables sign-in button during request', async () => {
    jest.mocked(authClient.signIn.email).mockImplementation(() => new Promise(() => {}))
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByPlaceholderText('you@example.com'), 'john@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled()
    })
  })
})

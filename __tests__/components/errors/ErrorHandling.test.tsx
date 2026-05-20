/**
 * @jest-environment jsdom
 *
 * Cross-cutting error handling tests using the CreateForumPostPage as the test subject,
 * since it uses fetch directly and exercises diverse error paths.
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreateForumPostPage from '@/app/(main)/forums/create/page'
import { toast } from 'sonner'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}))

jest.mock('next/link', () => {
  return function MockLink({ href, children }: { href: string; children: React.ReactNode }) {
    return <a href={href}>{children}</a>
  }
})

jest.mock('sonner', () => ({
  toast: { error: jest.fn(), success: jest.fn(), warning: jest.fn() },
}))

global.fetch = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
})

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText("What's your question or topic?"), 'Test title')
  await user.type(
    screen.getByPlaceholderText('Describe your question or discussion topic in detail...'),
    'Test content'
  )
  await user.click(screen.getByRole('button', { name: /post discussion/i }))
}

describe('Error handling in form components', () => {
  it('shows error toast when fetch throws a network error', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
    const user = userEvent.setup()
    render(<CreateForumPostPage />)

    await fillAndSubmit(user)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to create discussion. Please try again.')
    })
  })

  it('displays error message from API 400 response body', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Title is too short' }),
    })
    const user = userEvent.setup()
    render(<CreateForumPostPage />)

    await fillAndSubmit(user)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Title is too short')
    })
  })

  it('shows "Too many requests" error toast on API 429 response', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: 'Too many requests. Please try again later.' }),
    })
    const user = userEvent.setup()
    render(<CreateForumPostPage />)

    await fillAndSubmit(user)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Too many requests'))
    })
  })

  it('shows generic error toast on API 500 response', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Internal server error' }),
    })
    const user = userEvent.setup()
    render(<CreateForumPostPage />)

    await fillAndSubmit(user)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Internal server error')
    })
  })

  it('shows loading spinner while request is in flight', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})) // never resolves
    const user = userEvent.setup()
    render(<CreateForumPostPage />)

    await fillAndSubmit(user)

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /posting/i })
      expect(button).toBeDisabled()
    })
  })

  it('form fields retain their values after an error', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    })
    const user = userEvent.setup()
    render(<CreateForumPostPage />)

    await fillAndSubmit(user)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    })

    // Fields should still have their values after the error
    expect(screen.getByPlaceholderText("What's your question or topic?")).toHaveValue('Test title')
    expect(
      screen.getByPlaceholderText('Describe your question or discussion topic in detail...')
    ).toHaveValue('Test content')
  })

  it('submit button re-enables after error so user can retry', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    })
    const user = userEvent.setup()
    render(<CreateForumPostPage />)

    await fillAndSubmit(user)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /post discussion/i })).not.toBeDisabled()
    })
  })

  it('shows content blocked error toast on moderation block', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({
        moderation: { action: 'block', reason: 'hate speech detected' },
      }),
    })
    const user = userEvent.setup()
    render(<CreateForumPostPage />)

    await fillAndSubmit(user)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('hate speech detected'))
    })
  })
})

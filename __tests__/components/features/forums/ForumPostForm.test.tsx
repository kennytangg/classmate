/**
 * @jest-environment jsdom
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

async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  overrides: { title?: string; content?: string } = {}
) {
  const title = overrides.title ?? 'How to solve integrals?'
  const content = overrides.content ?? 'I need help understanding integration by parts.'

  if (title) await user.type(screen.getByPlaceholderText("What's your question or topic?"), title)
  if (content)
    await user.type(
      screen.getByPlaceholderText('Describe your question or discussion topic in detail...'),
      content
    )
}

describe('CreateForumPostPage', () => {
  it('renders title and content fields', () => {
    render(<CreateForumPostPage />)

    expect(screen.getByPlaceholderText("What's your question or topic?")).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Describe your question or discussion topic in detail...')
    ).toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('e.g., calculus, homework, derivatives')
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('shows error toast when title is empty', async () => {
    const user = userEvent.setup()
    render(<CreateForumPostPage />)

    await user.type(
      screen.getByPlaceholderText('Describe your question or discussion topic in detail...'),
      'some content'
    )
    await user.click(screen.getByRole('button', { name: /post discussion/i }))

    expect(toast.error).toHaveBeenCalledWith('Please fill in all required fields')
  })

  it('shows error toast when content is empty', async () => {
    const user = userEvent.setup()
    render(<CreateForumPostPage />)

    await user.type(screen.getByPlaceholderText("What's your question or topic?"), 'My title')
    await user.click(screen.getByRole('button', { name: /post discussion/i }))

    expect(toast.error).toHaveBeenCalledWith('Please fill in all required fields')
  })

  it('calls POST /api/forums/posts with correct payload', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'post-1' }),
    })
    const user = userEvent.setup()
    render(<CreateForumPostPage />)

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: /post discussion/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/forums/posts',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('How to solve integrals?'),
        })
      )
    })
  })

  it('shows warning toast if API returns moderation warning', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'post-1',
        warning: { reason: 'content may be inappropriate' },
      }),
    })
    const user = userEvent.setup()
    render(<CreateForumPostPage />)

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: /post discussion/i }))

    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalledWith(
        expect.stringContaining('content may be inappropriate')
      )
    })
  })

  it('shows error toast if API returns moderation block', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({
        moderation: { action: 'block', reason: 'violates community guidelines' },
      }),
    })
    const user = userEvent.setup()
    render(<CreateForumPostPage />)

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: /post discussion/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('violates community guidelines')
      )
    })
  })

  it('shows error toast if API call fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    })
    const user = userEvent.setup()
    render(<CreateForumPostPage />)

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: /post discussion/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Server error')
    })
  })

  it('shows spinner on submit button while loading', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))
    const user = userEvent.setup()
    render(<CreateForumPostPage />)

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: /post discussion/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /posting/i })).toBeDisabled()
    })
  })
})

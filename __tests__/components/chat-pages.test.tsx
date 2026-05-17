/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatPage from '@/app/(main)/chat/page'
import ChatConversationPage from '@/app/(main)/chat/[userId]/page'

jest.mock('next/link', () => {
  return function MockLink({ href, children }: { href: string; children: React.ReactNode }) {
    return <a href={href}>{children}</a>
  }
})

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('@/app/(main)/chat/_components/NewMessageModal', () => ({
  NewMessageModal: () => null,
}))

// React's use() checks for status/value on thenables to avoid suspending
function fulfilledParams<T>(value: T): Promise<T> {
  const p = Promise.resolve(value) as Promise<T> & { status: string; value: T }
  p.status = 'fulfilled'
  p.value = value
  return p
}

describe('Chat pages integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  it('renders conversation list results from API', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          conversations: [
            {
              userId: 'user-2',
              participant: {
                id: 'user-2',
                email: 'alice@example.com',
                displayName: 'Alice',
                avatarUrl: null,
              },
              lastMessage: {
                id: 'message-1',
                content: 'Hey there',
                createdAt: '2026-03-20T10:00:00.000Z',
                senderId: 'user-2',
              },
              unreadCount: 2,
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ groups: [] }),
      })

    render(<ChatPage />)

    expect(await screen.findByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Hey there')).toBeInTheDocument()
  })

  it('renders error state when conversation list request fails', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Unable to load conversations.' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ groups: [] }),
      })

    render(<ChatPage />)

    expect(await screen.findByText('Unable to load conversations.')).toBeInTheDocument()
  })

  it('keeps dark-mode classes on chat list shell', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversations: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ groups: [] }),
      })

    const { container } = render(<ChatPage />)

    await screen.findByText("No messages yet. Use 'Find People' to start a conversation.")

    expect(container.firstChild).toHaveClass('h-full')
    expect(container.innerHTML).toContain('bg-card')
  })

  it('sends a message and renders it in the thread', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          participant: {
            id: 'user-2',
            email: 'bob@example.com',
            displayName: 'Bob',
            avatarUrl: null,
          },
          messages: [],
          pagination: { limit: 50, nextCursor: null },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ updatedCount: 0 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: {
            id: 'message-new',
            senderId: 'user-1',
            recipientId: 'user-2',
            content: 'Hello Bob',
            isRead: false,
            createdAt: '2026-03-20T11:00:00.000Z',
          },
        }),
      })

    render(<ChatConversationPage params={fulfilledParams({ userId: 'user-2' })} />)

    expect(await screen.findByText('Bob')).toBeInTheDocument()

    await userEvent.type(screen.getByPlaceholderText('Type a message...'), 'Hello Bob{enter}')

    expect(await screen.findByText('Hello Bob')).toBeInTheDocument()

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/messages/conversations/user-2',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  it('keeps dark-mode classes on conversation thread shell', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          participant: {
            id: 'user-2',
            email: 'bob@example.com',
            displayName: 'Bob',
            avatarUrl: null,
          },
          messages: [],
          pagination: { limit: 50, nextCursor: null },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ updatedCount: 0 }),
      })

    const { container } = render(
      <ChatConversationPage params={fulfilledParams({ userId: 'user-2' })} />
    )

    await screen.findByText('Bob')
    expect(container.innerHTML).toContain('bg-card')
  })
})

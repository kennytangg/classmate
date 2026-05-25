/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionSidebar } from '@/components/features/ai-tutor/SessionSidebar'

// jsdom does not provide fetch — define it before spying
global.fetch = jest.fn() as jest.Mock
const mockFetch = global.fetch as jest.Mock

// Helper: build a fake fetch Response-like object
function mockJsonResponse(body: unknown, ok = true) {
  return Promise.resolve({ ok, json: () => Promise.resolve(body) })
}

const MOCK_SESSIONS = [
  {
    id: 'session-1',
    title: 'Calculus Help',
    subject: 'Mathematics',
    updatedAt: new Date().toISOString(),
    _count: { messages: 5 },
  },
  {
    id: 'session-2',
    title: 'Data Structures Q&A',
    subject: 'Computer Science',
    updatedAt: new Date().toISOString(),
    _count: { messages: 1 },
  },
]

const defaultProps = {
  activeSessionId: undefined,
  onSelectSession: jest.fn(),
  onNewChat: jest.fn(),
  onDeleteSession: jest.fn(),
}

afterEach(() => {
  jest.clearAllMocks()
})

describe('SessionSidebar component', () => {
  it('renders the New Chat button', async () => {
    mockFetch.mockImplementationOnce(() => mockJsonResponse({ sessions: [] }))
    render(<SessionSidebar {...defaultProps} />)
    expect(screen.getByRole('button', { name: /new chat/i })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument())
  })

  it('shows loading state initially', () => {
    // Never resolves — keeps the component in loading state
    mockFetch.mockReturnValueOnce(new Promise(() => {}))
    render(<SessionSidebar {...defaultProps} />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows empty state when there are no sessions', async () => {
    mockFetch.mockImplementationOnce(() => mockJsonResponse({ sessions: [] }))
    render(<SessionSidebar {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText(/no past chats yet/i)).toBeInTheDocument()
    })
  })

  it('renders a list of sessions after loading', async () => {
    mockFetch.mockImplementationOnce(() => mockJsonResponse({ sessions: MOCK_SESSIONS }))
    render(<SessionSidebar {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('Calculus Help')).toBeInTheDocument()
      expect(screen.getByText('Data Structures Q&A')).toBeInTheDocument()
    })
  })

  it('highlights the active session', async () => {
    mockFetch.mockImplementationOnce(() => mockJsonResponse({ sessions: MOCK_SESSIONS }))
    render(<SessionSidebar {...defaultProps} activeSessionId="session-1" />)
    await waitFor(() => {
      expect(screen.getByText('Calculus Help')).toBeInTheDocument()
    })
    const activeRow = screen.getByText('Calculus Help').closest('[role="button"]')
    expect(activeRow?.className).toContain('bg-black/20')
  })

  it('calls onSelectSession when a session is clicked', async () => {
    const onSelectSession = jest.fn()
    mockFetch.mockImplementationOnce(() => mockJsonResponse({ sessions: MOCK_SESSIONS }))
    render(<SessionSidebar {...defaultProps} onSelectSession={onSelectSession} />)
    await waitFor(() => screen.getByText('Calculus Help'))
    await userEvent.click(screen.getByText('Calculus Help'))
    expect(onSelectSession).toHaveBeenCalledWith('session-1')
  })

  it('calls onNewChat when the New Chat button is clicked', async () => {
    const onNewChat = jest.fn()
    mockFetch.mockImplementationOnce(() => mockJsonResponse({ sessions: [] }))
    render(<SessionSidebar {...defaultProps} onNewChat={onNewChat} />)
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: /new chat/i }))
    expect(onNewChat).toHaveBeenCalledTimes(1)
  })

  it('shows confirmation dialog when delete button is clicked', async () => {
    mockFetch.mockImplementationOnce(() => mockJsonResponse({ sessions: MOCK_SESSIONS }))
    render(<SessionSidebar {...defaultProps} />)

    await waitFor(() => screen.getByText('Calculus Help'))

    const deleteButtons = screen.getAllByRole('button', { name: /delete session/i })
    await userEvent.click(deleteButtons[0])

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/delete chat/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('cancels deletion when Cancel is clicked', async () => {
    const onDeleteSession = jest.fn()
    mockFetch.mockImplementationOnce(() => mockJsonResponse({ sessions: MOCK_SESSIONS }))
    render(<SessionSidebar {...defaultProps} onDeleteSession={onDeleteSession} />)

    await waitFor(() => screen.getByText('Calculus Help'))

    const deleteButtons = screen.getAllByRole('button', { name: /delete session/i })
    await userEvent.click(deleteButtons[0])
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onDeleteSession).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('calls onDeleteSession and removes session after confirming delete', async () => {
    const onDeleteSession = jest.fn()
    mockFetch
      .mockImplementationOnce(() => mockJsonResponse({ sessions: MOCK_SESSIONS }))
      .mockImplementationOnce(() => mockJsonResponse({ success: true }))

    render(
      <SessionSidebar
        {...defaultProps}
        onDeleteSession={onDeleteSession}
        activeSessionId="session-2"
      />
    )

    await waitFor(() => screen.getByText('Calculus Help'))

    const deleteButtons = screen.getAllByRole('button', { name: /delete session/i })
    await userEvent.click(deleteButtons[0])
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }))

    await waitFor(() => {
      expect(onDeleteSession).toHaveBeenCalledWith('session-1')
      expect(screen.queryByText('Calculus Help')).not.toBeInTheDocument()
    })
  })

  it('renders session titles without message count metadata', async () => {
    mockFetch.mockImplementationOnce(() => mockJsonResponse({ sessions: MOCK_SESSIONS }))
    render(<SessionSidebar {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('Calculus Help')).toBeInTheDocument()
      expect(screen.queryByText(/msg/i)).not.toBeInTheDocument()
    })
  })
})

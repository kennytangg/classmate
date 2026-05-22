/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { RepliesList } from '@/components/features/forums/RepliesList'
import type { Reply } from '@/components/features/forums/RepliesList'

describe('RepliesList component', () => {
  const mockReply = (overrides: Partial<Reply> = {}): Reply => ({
    id: 'reply-1',
    content: 'Try using the quadratic formula: ax² + bx + c = 0',
    createdAt: '2026-03-21T14:30:00Z',
    upvotes: 0,
    hasUpvoted: false,
    user: {
      id: 'user-2',
      email: 'tutor@example.com',
      profile: {
        displayName: 'Bob Smith',
      },
    },
    ...overrides,
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    expect(() => render(<RepliesList replies={[]} />)).not.toThrow()
  })

  it('displays empty state message when no replies exist', () => {
    render(<RepliesList replies={[]} />)

    expect(screen.getByText('No replies yet. Be the first to respond!')).toBeInTheDocument()
  })

  it('displays reply count header', () => {
    const replies = [mockReply(), mockReply({ id: 'reply-2' })]
    render(<RepliesList replies={replies} />)

    expect(screen.getByText('2 Replies')).toBeInTheDocument()
  })

  it('displays single reply count as "1 Reply"', () => {
    const replies = [mockReply()]
    render(<RepliesList replies={replies} />)

    expect(screen.getByText('1 Reply')).toBeInTheDocument()
  })

  it('displays reply author name from profile displayName', () => {
    const replies = [mockReply()]
    render(<RepliesList replies={replies} />)

    expect(screen.getByText('Bob Smith')).toBeInTheDocument()
  })

  it('falls back to email prefix when displayName is null', () => {
    const replies = [
      mockReply({
        user: {
          id: 'user-2',
          email: 'tutor@example.com',
          profile: {
            displayName: null,
          },
        },
      }),
    ]
    render(<RepliesList replies={replies} />)

    expect(screen.getByText('tutor')).toBeInTheDocument()
  })

  it('uses email prefix when no displayName and no profile', () => {
    const replies = [
      mockReply({
        user: {
          id: 'user-2',
          email: 'tutor@example.com',
          profile: null,
        },
      }),
    ]
    render(<RepliesList replies={replies} />)

    // Falls back to email prefix "tutor" when profile is null
    expect(screen.getByText('tutor')).toBeInTheDocument()
  })

  it('displays reply content', () => {
    const replies = [mockReply()]
    render(<RepliesList replies={replies} />)

    expect(
      screen.getByText('Try using the quadratic formula: ax² + bx + c = 0')
    ).toBeInTheDocument()
  })

  it('displays reply creation date', () => {
    const replies = [mockReply()]
    render(<RepliesList replies={replies} />)

    // formatDate returns relative time (e.g., "5 days ago") or locale date string (e.g., "3/21/2026")
    expect(
      screen.getByText(/days ago|just now|hour|min ago|\d{1,2}\/\d{1,2}\/\d{4}/i)
    ).toBeInTheDocument()
  })

  it('renders multiple replies', () => {
    const replies = [
      mockReply({ id: 'reply-1', content: 'First response' }),
      mockReply({ id: 'reply-2', content: 'Second response' }),
      mockReply({ id: 'reply-3', content: 'Third response' }),
    ]
    render(<RepliesList replies={replies} />)

    expect(screen.getByText('3 Replies')).toBeInTheDocument()
    expect(screen.getByText('First response')).toBeInTheDocument()
    expect(screen.getByText('Second response')).toBeInTheDocument()
    expect(screen.getByText('Third response')).toBeInTheDocument()
  })

  it('displays author initial in avatar circle', () => {
    const replies = [mockReply()]
    render(<RepliesList replies={replies} />)

    // First letter of "Bob Smith" is "B"
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('displays initial of email prefix when no displayName', () => {
    const replies = [
      mockReply({
        user: {
          id: 'user-2',
          email: 'charlie@example.com',
          profile: {
            displayName: null,
          },
        },
      }),
    ]
    render(<RepliesList replies={replies} />)

    // Initial of "charlie" (from email prefix)
    expect(screen.getByText('C')).toBeInTheDocument()
  })

  it('does not render Helpful button for any reply', () => {
    const replies = [mockReply({ id: 'reply-1' }), mockReply({ id: 'reply-2' })]
    render(<RepliesList replies={replies} />)

    // Verify no "Helpful" button exists anywhere in the component
    expect(screen.queryByRole('button', { name: /helpful/i })).not.toBeInTheDocument()
  })

  it('does not render Reply button for any reply', () => {
    const replies = [mockReply({ id: 'reply-1' }), mockReply({ id: 'reply-2' })]
    render(<RepliesList replies={replies} />)

    // Verify no "Reply" button exists anywhere in the component
    expect(screen.queryByRole('button', { name: /reply/i })).not.toBeInTheDocument()
  })

  it('Reply interface includes upvotes and hasUpvoted fields', () => {
    const reply = mockReply()

    expect(typeof reply.upvotes).toBe('number')
    expect(typeof reply.hasUpvoted).toBe('boolean')
  })

  it('handles edge case: many replies', () => {
    const replies = Array.from({ length: 20 }, (_, i) =>
      mockReply({
        id: `reply-${i}`,
        content: `Reply number ${i + 1}`,
      })
    )
    render(<RepliesList replies={replies} />)

    expect(screen.getByText('20 Replies')).toBeInTheDocument()
    expect(screen.getByText('Reply number 1')).toBeInTheDocument()
    expect(screen.getByText('Reply number 20')).toBeInTheDocument()
  })

  it('handles long reply content without breaking layout', () => {
    const longContent = 'This is a very long reply that contains a lot of text. '.repeat(20)
    const replies = [mockReply({ content: longContent })]
    render(<RepliesList replies={replies} />)

    expect(screen.getByText(new RegExp(longContent.substring(0, 50)))).toBeInTheDocument()
  })

  it('handles special characters in author names', () => {
    const replies = [
      mockReply({
        user: {
          id: 'user-2',
          email: 'user@example.com',
          profile: {
            displayName: "O'Brien-Smith",
          },
        },
      }),
    ]
    render(<RepliesList replies={replies} />)

    expect(screen.getByText("O'Brien-Smith")).toBeInTheDocument()
  })

  it('handles special characters in reply content', () => {
    const specialContent = 'Use <div> tags for structure & avoid <script> tags!'
    const replies = [mockReply({ content: specialContent })]
    render(<RepliesList replies={replies} />)

    expect(screen.getByText(specialContent)).toBeInTheDocument()
  })

  it('renders empty state with no additional buttons', () => {
    render(<RepliesList replies={[]} />)

    // Verify the empty state is clean with no action buttons
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders replies with proper spacing and styling applied', () => {
    const replies = [mockReply()]
    const { container } = render(<RepliesList replies={replies} />)

    // Verify the container has the correct structure with space-y-6 (gap between items)
    const replyContainer = container.querySelector('.space-y-6')
    expect(replyContainer).toBeInTheDocument()
  })
})

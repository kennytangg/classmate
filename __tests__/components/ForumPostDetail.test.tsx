/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { ForumPostDetail } from '@/components/features/forums/ForumPostDetail'

describe('ForumPostDetail component', () => {
  const mockPost = {
    id: 'post-1',
    title: 'How to solve quadratic equations?',
    content: 'I am struggling with quadratic equations. Can someone explain the quadratic formula?',
    views: 42,
    upvotes: 0,
    hasUpvoted: false,
    createdAt: '2026-03-20T10:00:00Z',
    user: {
      id: 'user-1',
      email: 'student@example.com',
      role: 'STUDENT',
      profile: {
        displayName: 'Alice Johnson',
        avatarUrl: 'https://example.com/avatar.jpg',
        major: 'Computer Science',
      },
    },
    _count: {
      replies: 5,
    },
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    expect(() => render(<ForumPostDetail post={mockPost} />)).not.toThrow()
  })

  it('displays the post title', () => {
    render(<ForumPostDetail post={mockPost} />)

    expect(screen.getByText('How to solve quadratic equations?')).toBeInTheDocument()
  })

  it('displays the post content', () => {
    render(<ForumPostDetail post={mockPost} />)

    expect(
      screen.getByText(
        'I am struggling with quadratic equations. Can someone explain the quadratic formula?'
      )
    ).toBeInTheDocument()
  })

  it('displays the author name from profile displayName', () => {
    render(<ForumPostDetail post={mockPost} />)

    expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
  })

  it('displays the author role as "Moderator" when user is MODERATOR', () => {
    const moderatorPost = {
      ...mockPost,
      user: { ...mockPost.user, role: 'MODERATOR' },
    }
    render(<ForumPostDetail post={moderatorPost} />)

    expect(screen.getByText(/moderator/i)).toBeInTheDocument()
  })

  it('displays the author role as "Student" when user is STUDENT', () => {
    render(<ForumPostDetail post={mockPost} />)

    expect(screen.getByText(/student/i)).toBeInTheDocument()
  })

  it('uses email prefix as displayName when profile displayName is null', () => {
    const postWithoutDisplayName = {
      ...mockPost,
      user: {
        ...mockPost.user,
        profile: {
          ...mockPost.user.profile,
          displayName: null,
        },
      },
    }
    render(<ForumPostDetail post={postWithoutDisplayName} />)

    expect(screen.getByText('student')).toBeInTheDocument()
  })

  it('displays the post creation date', () => {
    render(<ForumPostDetail post={mockPost} />)

    // formatDate returns relative time (e.g., "5 days ago") or locale date string (e.g., "3/20/2026")
    expect(
      screen.getByText(/days ago|just now|hour|min ago|\d{1,2}\/\d{1,2}\/\d{4}/i)
    ).toBeInTheDocument()
  })

  it('displays replies count', () => {
    render(<ForumPostDetail post={mockPost} />)

    expect(screen.getByText('5 Replies')).toBeInTheDocument()
  })

  it('displays views count', () => {
    render(<ForumPostDetail post={mockPost} />)

    expect(screen.getByText('42 Views')).toBeInTheDocument()
  })

  it('does not render a Share button', () => {
    render(<ForumPostDetail post={mockPost} />)

    // Verify no Share button or link exists
    expect(screen.queryByRole('button', { name: /share/i })).not.toBeInTheDocument()
  })

  it('does not render a MoreHorizontal or options menu button', () => {
    render(<ForumPostDetail post={mockPost} />)

    // Verify no more options button (MoreHorizontal icon should not exist)
    expect(screen.queryByRole('button', { name: /more/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /options/i })).not.toBeInTheDocument()
  })

  it('displays author initial in avatar circle', () => {
    render(<ForumPostDetail post={mockPost} />)

    // The avatar displays the first letter of the display name (A for Alice)
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('handles edge case: undefined profile gracefully', () => {
    const postWithoutProfile = {
      ...mockPost,
      user: {
        ...mockPost.user,
        profile: null,
      },
    }
    render(<ForumPostDetail post={postWithoutProfile} />)

    // Should fall back to email prefix
    expect(screen.getByText('student')).toBeInTheDocument()
  })

  it('displays message icon alongside replies count', () => {
    render(<ForumPostDetail post={mockPost} />)

    const repliesSection = screen.getByText('5 Replies').parentElement
    expect(repliesSection).toBeInTheDocument()
    expect(repliesSection?.querySelector('svg')).toBeInTheDocument()
  })

  it('displays eye icon alongside views count', () => {
    render(<ForumPostDetail post={mockPost} />)

    const viewsSection = screen.getByText('42 Views').parentElement
    expect(viewsSection).toBeInTheDocument()
    expect(viewsSection?.querySelector('svg')).toBeInTheDocument()
  })
})

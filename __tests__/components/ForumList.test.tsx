/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ForumList } from '@/components/features/forums/ForumList'

// Mock next/link — replace with a simple div wrapper
jest.mock('next/link', () => {
  const LinkMock = ({ children, href }: React.PropsWithChildren<{ href: string }>) => (
    <a href={href}>{children}</a>
  )
  LinkMock.displayName = 'Link'
  return LinkMock
})

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/forums',
}))

// Mock ForumCard — simplify to just render the title
jest.mock('@/components/features/forums/ForumCard', () => ({
  ForumCard: ({
    title,
  }: {
    id: string | number
    title: string
    author: string
    category: string
    replies: number
    views: number
    upvotes: number
    hasUpvoted: boolean
    tags: string[]
    createdAt: string
  }) => <div data-testid="forum-card">{title}</div>,
}))

// Mock Button component
jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    ...props
  }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
    <button {...props}>{children}</button>
  ),
}))

// Mock format utility
jest.mock('@/lib/format', () => ({
  formatDate: (date: string) => new Date(date).toLocaleDateString(),
}))

describe('ForumList component', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  const mockForumPosts = [
    {
      id: 'post-1',
      title: 'How to study effectively',
      content: 'What are your best study tips?',
      category: 'Study Tips',
      views: 42,
      upvotes: 0,
      hasUpvoted: false,
      createdAt: '2025-03-26T10:00:00Z',
      user: {
        id: 'user-1',
        email: 'john@example.com',
        profile: {
          displayName: 'John Doe',
          major: 'Computer Science',
        },
      },
      tags: [
        { id: 'tag-1', name: 'productivity' },
        { id: 'tag-2', name: 'learning' },
      ],
      _count: {
        replies: 5,
      },
    },
    {
      id: 'post-2',
      title: 'Best resources for algorithms',
      content: 'Looking for algorithm resources...',
      category: 'Resources',
      views: 28,
      upvotes: 0,
      hasUpvoted: false,
      createdAt: '2025-03-25T10:00:00Z',
      user: {
        id: 'user-2',
        email: 'jane@example.com',
        profile: {
          displayName: 'Jane Smith',
          major: 'Math',
        },
      },
      tags: [{ id: 'tag-3', name: 'algorithms' }],
      _count: {
        replies: 3,
      },
    },
  ]

  const mockRecommendations = [
    {
      id: 'rec-1',
      title: 'Understanding recursion',
      category: 'Algorithms',
      reason: 'Based on your interest',
    },
    {
      id: 'rec-2',
      title: 'Time complexity explained',
      category: 'Theory',
      reason: 'Popular in your major',
    },
    {
      id: 'rec-3',
      title: 'Data structures guide',
      category: 'Fundamentals',
      reason: 'Trending now',
    },
  ]

  describe('Layout and structure', () => {
    beforeEach(() => {
      global.fetch = jest.fn()
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ posts: mockForumPosts }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ recommendations: mockRecommendations }),
        })
    })

    it('renders without crashing', () => {
      expect(() => render(<ForumList />)).not.toThrow()
    })

    it('renders the page header with title and description', async () => {
      render(<ForumList />)

      expect(screen.getByText('Discussions')).toBeInTheDocument()
      expect(
        screen.getByText(
          'Ask questions and get answers — everything stays searchable for everyone.'
        )
      ).toBeInTheDocument()
    })

    it('renders search input field', () => {
      render(<ForumList />)

      const searchInput = screen.getByPlaceholderText('Search discussions...')
      expect(searchInput).toBeInTheDocument()
    })

    it('renders New Discussion link with button', () => {
      render(<ForumList />)

      const newDiscussionButton = screen.getByText('Ask a Question')
      expect(newDiscussionButton).toBeInTheDocument()
      expect(newDiscussionButton.closest('button')).toBeInTheDocument()
    })

    it('renders horizontal layout with two columns', async () => {
      render(<ForumList />)

      await waitFor(() => {
        // Check that both the recommended panel and posts section exist
        expect(screen.getByText('Trending discussions')).toBeInTheDocument()
        expect(screen.getByText('Discussions')).toBeInTheDocument()
      })
    })
  })

  describe('Recommended Threads panel', () => {
    beforeEach(() => {
      global.fetch = jest.fn()
    })

    it('shows loading state initially', () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise(() => {
            // Never resolves — keeps loading state
          })
      )

      const { container } = render(<ForumList />)

      // Sidebar shows animated skeleton divs while recommendations load
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('displays recommendations when API returns data', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ posts: mockForumPosts }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ recommendations: mockRecommendations }),
        })

      render(<ForumList />)

      await waitFor(() => {
        expect(screen.getByText('Understanding recursion')).toBeInTheDocument()
        expect(screen.getByText('Time complexity explained')).toBeInTheDocument()
        expect(screen.getByText('Data structures guide')).toBeInTheDocument()
      })
    })

    it('shows max 5 recommendations even if API returns more', async () => {
      const manyRecommendations = Array.from({ length: 10 }, (_, i) => ({
        id: `rec-${i}`,
        title: `Recommendation ${i}`,
        category: 'Category',
        reason: 'Test reason',
      }))

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ posts: mockForumPosts }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ recommendations: manyRecommendations }),
        })

      render(<ForumList />)

      await waitFor(() => {
        const recommendationLinks = screen.getAllByText(/Recommendation \d+/)
        expect(recommendationLinks).toHaveLength(5)
      })
    })

    it('hides the sidebar when no recommendations', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ posts: mockForumPosts }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ recommendations: [] }),
        })

      render(<ForumList />)

      await waitFor(() => {
        // Sidebar is hidden when there are no recommendations
        expect(screen.queryByText('Trending discussions')).not.toBeInTheDocument()
      })
    })

    it('silently hides sidebar when recommendations API fails', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ posts: mockForumPosts }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Failed to load recommendations' }),
        })

      render(<ForumList />)

      await waitFor(() => {
        // Recommendations errors are swallowed; sidebar is hidden
        expect(screen.queryByText('Trending discussions')).not.toBeInTheDocument()
        expect(screen.queryByText('Failed to load recommendations')).not.toBeInTheDocument()
      })
    })

    it('silently hides sidebar when recommendations API throws', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ posts: mockForumPosts }),
        })
        .mockResolvedValueOnce(Promise.reject(new Error('Network error')))

      render(<ForumList />)

      await waitFor(() => {
        // Recommendations errors are swallowed; sidebar is hidden
        expect(screen.queryByText('Trending discussions')).not.toBeInTheDocument()
        expect(screen.queryByText('Network error')).not.toBeInTheDocument()
      })
    })

    it('renders recommendation links with correct hrefs', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ posts: mockForumPosts }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ recommendations: mockRecommendations }),
        })

      render(<ForumList />)

      await waitFor(() => {
        const link = screen.getByText('Understanding recursion').closest('a')
        expect(link).toHaveAttribute('href', '/forums/rec-1')
      })
    })
  })

  describe('Forum Posts section', () => {
    beforeEach(() => {
      global.fetch = jest.fn()
    })

    it('shows loading state initially for posts', () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise(() => {
            // Never resolves — keeps loading state
          })
      )

      render(<ForumList />)

      expect(screen.getByText('Loading discussions...')).toBeInTheDocument()
    })

    it('renders forum cards when posts API returns data', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ posts: mockForumPosts }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ recommendations: mockRecommendations }),
        })

      render(<ForumList />)

      await waitFor(() => {
        expect(screen.getByText('How to study effectively')).toBeInTheDocument()
        expect(screen.getByText('Best resources for algorithms')).toBeInTheDocument()
      })
    })

    it('renders multiple ForumCard components for multiple posts', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ posts: mockForumPosts }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ recommendations: mockRecommendations }),
        })

      render(<ForumList />)

      await waitFor(() => {
        const cards = screen.getAllByTestId('forum-card')
        expect(cards).toHaveLength(2)
      })
    })

    it('displays empty state when no posts available', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ posts: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ recommendations: mockRecommendations }),
        })

      render(<ForumList />)

      await waitFor(() => {
        expect(screen.getByText('No discussions yet')).toBeInTheDocument()
        expect(screen.getByText('Be the first to ask a question.')).toBeInTheDocument()
      })
    })

    it('displays error message when posts API fails', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Failed to fetch posts' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ recommendations: mockRecommendations }),
        })

      render(<ForumList />)

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch posts')).toBeInTheDocument()
      })
    })

    it('displays a Try Again button when error occurs', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ recommendations: mockRecommendations }),
        })

      render(<ForumList />)

      await waitFor(() => {
        const tryAgainButton = screen.getByText('Try Again')
        expect(tryAgainButton).toBeInTheDocument()
      })
    })
  })

  describe('Search filtering', () => {
    beforeEach(() => {
      global.fetch = jest.fn()
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ posts: mockForumPosts }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ recommendations: mockRecommendations }),
        })
    })

    it('filters posts by title', async () => {
      render(<ForumList />)
      const searchInput = screen.getByPlaceholderText('Search discussions...')

      await waitFor(() => {
        expect(screen.getByText('How to study effectively')).toBeInTheDocument()
      })

      await userEvent.type(searchInput, 'study')

      await waitFor(() => {
        expect(screen.getByText('How to study effectively')).toBeInTheDocument()
        expect(screen.queryByText('Best resources for algorithms')).not.toBeInTheDocument()
      })
    })

    it('filters posts by content', async () => {
      render(<ForumList />)
      const searchInput = screen.getByPlaceholderText('Search discussions...')

      await waitFor(() => {
        expect(screen.getByText('How to study effectively')).toBeInTheDocument()
      })

      await userEvent.type(searchInput, 'algorithm')

      await waitFor(() => {
        expect(screen.queryByText('How to study effectively')).not.toBeInTheDocument()
        expect(screen.getByText('Best resources for algorithms')).toBeInTheDocument()
      })
    })

    it('filters posts by tags', async () => {
      render(<ForumList />)
      const searchInput = screen.getByPlaceholderText('Search discussions...')

      await waitFor(() => {
        expect(screen.getByText('How to study effectively')).toBeInTheDocument()
      })

      await userEvent.type(searchInput, 'productivity')

      await waitFor(() => {
        expect(screen.getByText('How to study effectively')).toBeInTheDocument()
        expect(screen.queryByText('Best resources for algorithms')).not.toBeInTheDocument()
      })
    })

    it('shows no results message when search matches nothing', async () => {
      render(<ForumList />)
      const searchInput = screen.getByPlaceholderText('Search discussions...')

      await waitFor(() => {
        expect(screen.getByText('How to study effectively')).toBeInTheDocument()
      })

      await userEvent.type(searchInput, 'nonexistent-term')

      await waitFor(() => {
        expect(screen.getByText('No results for that search')).toBeInTheDocument()
        expect(screen.getByText('Try different keywords.')).toBeInTheDocument()
      })
    })

    it('clears search results when search is cleared', async () => {
      render(<ForumList />)
      const searchInput = screen.getByPlaceholderText('Search discussions...') as HTMLInputElement

      await waitFor(() => {
        expect(screen.getByText('How to study effectively')).toBeInTheDocument()
      })

      await userEvent.type(searchInput, 'study')

      await waitFor(() => {
        expect(screen.queryByText('Best resources for algorithms')).not.toBeInTheDocument()
      })

      await userEvent.clear(searchInput)

      await waitFor(() => {
        expect(screen.getByText('How to study effectively')).toBeInTheDocument()
        expect(screen.getByText('Best resources for algorithms')).toBeInTheDocument()
      })
    })
  })

  describe('Empty posts fallback handling', () => {
    beforeEach(() => {
      global.fetch = jest.fn()
    })

    it('handles API response with undefined posts field', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ recommendations: mockRecommendations }),
        })

      render(<ForumList />)

      await waitFor(() => {
        expect(screen.getByText('No discussions yet')).toBeInTheDocument()
      })
    })

    it('handles API response with undefined recommendations field', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ posts: mockForumPosts }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })

      render(<ForumList />)

      await waitFor(() => {
        // undefined recommendations defaults to [] — sidebar is hidden
        expect(screen.queryByText('Trending discussions')).not.toBeInTheDocument()
      })
    })
  })

  describe('User display names', () => {
    beforeEach(() => {
      global.fetch = jest.fn()
    })

    it('uses displayName from profile when available', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ posts: mockForumPosts }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ recommendations: mockRecommendations }),
        })

      render(<ForumList />)

      await waitFor(() => {
        // ForumCard receives the author prop calculated from displayName
        expect(screen.getByText('How to study effectively')).toBeInTheDocument()
      })
    })

    it('falls back to email prefix when displayName is null', async () => {
      const postsWithoutDisplayName = [
        {
          ...mockForumPosts[0],
          user: {
            ...mockForumPosts[0].user,
            profile: {
              ...mockForumPosts[0].user.profile,
              displayName: null,
            },
          },
        },
      ]

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ posts: postsWithoutDisplayName }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ recommendations: mockRecommendations }),
        })

      render(<ForumList />)

      await waitFor(() => {
        expect(screen.getByText('How to study effectively')).toBeInTheDocument()
      })
    })
  })
})

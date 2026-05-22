/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UpvoteButton } from '@/components/features/forums/UpvoteButton'
import { toast } from 'sonner'

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}))

describe('UpvoteButton component', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    expect(() =>
      render(
        <UpvoteButton
          contentId="post-1"
          contentType="post"
          initialUpvotes={5}
          initialHasUpvoted={false}
        />
      )
    ).not.toThrow()
  })

  it('displays initial upvote count', () => {
    render(
      <UpvoteButton
        contentId="post-1"
        contentType="post"
        initialUpvotes={7}
        initialHasUpvoted={false}
      />
    )

    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('renders upvote button with correct aria-label when not upvoted', () => {
    render(
      <UpvoteButton
        contentId="post-1"
        contentType="post"
        initialUpvotes={3}
        initialHasUpvoted={false}
      />
    )

    expect(screen.getByRole('button', { name: 'Like' })).toBeInTheDocument()
  })

  it('renders button with "Remove upvote" label when already upvoted', () => {
    render(
      <UpvoteButton
        contentId="post-1"
        contentType="post"
        initialUpvotes={3}
        initialHasUpvoted={true}
      />
    )

    expect(screen.getByRole('button', { name: 'Remove like' })).toBeInTheDocument()
  })

  it('optimistically increments count on click when not yet upvoted', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ upvotes: 4, hasUpvoted: true }),
    })

    render(
      <UpvoteButton
        contentId="post-1"
        contentType="post"
        initialUpvotes={3}
        initialHasUpvoted={false}
      />
    )

    fireEvent.click(screen.getByRole('button'))

    // Optimistic update should show incremented count immediately
    expect(screen.getByText('4')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Remove like' })).toBeInTheDocument()
    })
  })

  it('optimistically decrements count on click when already upvoted', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ upvotes: 2, hasUpvoted: false }),
    })

    render(
      <UpvoteButton
        contentId="post-1"
        contentType="post"
        initialUpvotes={3}
        initialHasUpvoted={true}
      />
    )

    fireEvent.click(screen.getByRole('button'))

    expect(screen.getByText('2')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Like' })).toBeInTheDocument()
    })
  })

  it('calls the posts upvote endpoint for contentType=post', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ upvotes: 1, hasUpvoted: true }),
    })

    render(
      <UpvoteButton
        contentId="post-42"
        contentType="post"
        initialUpvotes={0}
        initialHasUpvoted={false}
      />
    )

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/forums/posts/post-42/upvote', {
        method: 'POST',
      })
    })
  })

  it('calls the replies upvote endpoint for contentType=reply', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ upvotes: 1, hasUpvoted: true }),
    })

    render(
      <UpvoteButton
        contentId="reply-99"
        contentType="reply"
        initialUpvotes={0}
        initialHasUpvoted={false}
      />
    )

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/forums/replies/reply-99/upvote', {
        method: 'POST',
      })
    })
  })

  it('reverts optimistic update when API returns non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Forbidden' }),
    })

    render(
      <UpvoteButton
        contentId="post-1"
        contentType="post"
        initialUpvotes={3}
        initialHasUpvoted={false}
      />
    )

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      // Should revert back to 3
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  it('reverts optimistic update on network error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

    render(
      <UpvoteButton
        contentId="post-1"
        contentType="post"
        initialUpvotes={5}
        initialHasUpvoted={false}
      />
    )

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument()
    })
  })

  it('shows error toast when API returns non-ok response with error message', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Cannot upvote your own post' }),
    })

    render(
      <UpvoteButton
        contentId="post-1"
        contentType="post"
        initialUpvotes={3}
        initialHasUpvoted={false}
      />
    )

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Cannot upvote your own post')
    })
  })

  it('shows generic error toast when API error JSON parsing fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => {
        throw new Error('parse error')
      },
    })

    render(
      <UpvoteButton
        contentId="post-1"
        contentType="post"
        initialUpvotes={3}
        initialHasUpvoted={false}
      />
    )

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to upvote')
    })
  })

  it('shows network error toast on fetch error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network failure'))

    render(
      <UpvoteButton
        contentId="post-1"
        contentType="post"
        initialUpvotes={5}
        initialHasUpvoted={false}
      />
    )

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Network error: could not upvote')
    })
  })

  it('disables button while request is in flight', () => {
    global.fetch = jest.fn().mockImplementation(
      () =>
        new Promise(() => {
          // Never resolves
        })
    )

    render(
      <UpvoteButton
        contentId="post-1"
        contentType="post"
        initialUpvotes={3}
        initialHasUpvoted={false}
      />
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(button).toBeDisabled()
  })
})

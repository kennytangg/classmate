'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'

interface UpvoteButtonProps {
  contentId: string
  contentType: 'post' | 'reply'
  initialUpvotes: number
  initialHasUpvoted: boolean
}

export function UpvoteButton({
  contentId,
  contentType,
  initialUpvotes,
  initialHasUpvoted,
}: UpvoteButtonProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [hasUpvoted, setHasUpvoted] = useState(initialHasUpvoted)
  const [loading, setLoading] = useState(false)

  async function handleUpvote() {
    if (loading) return
    setLoading(true)

    const prevUpvotes = upvotes
    const prevHasUpvoted = hasUpvoted
    setUpvotes(hasUpvoted ? upvotes - 1 : upvotes + 1)
    setHasUpvoted(!hasUpvoted)

    try {
      const endpoint =
        contentType === 'post'
          ? `/api/forums/posts/${contentId}/upvote`
          : `/api/forums/replies/${contentId}/upvote`

      const res = await fetch(endpoint, { method: 'POST' })

      if (!res.ok) {
        setUpvotes(prevUpvotes)
        setHasUpvoted(prevHasUpvoted)
        try {
          const data = (await res.json()) as { error?: string }
          toast.error(data.error ?? 'Failed to upvote')
        } catch {
          toast.error('Failed to upvote')
        }
        return
      }

      const data = (await res.json()) as { upvotes: number; hasUpvoted: boolean }
      setUpvotes(data.upvotes)
      setHasUpvoted(data.hasUpvoted)
    } catch {
      setUpvotes(prevUpvotes)
      setHasUpvoted(prevHasUpvoted)
      toast.error('Network error: could not upvote')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleUpvote}
      disabled={loading}
      aria-label={hasUpvoted ? 'Remove like' : 'Like'}
      className={`group/upvote relative flex cursor-pointer items-center gap-1 text-xs transition-colors disabled:opacity-50 ${
        hasUpvoted ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
      }`}
    >
      <Heart className={`h-3.5 w-3.5 ${hasUpvoted ? 'fill-red-500' : ''}`} />
      <span>{upvotes}</span>
      <span className="bg-popover text-popover-foreground pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap opacity-0 shadow-md transition-opacity group-hover/upvote:opacity-100">
        Like
      </span>
    </button>
  )
}

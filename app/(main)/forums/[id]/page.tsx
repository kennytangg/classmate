'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ForumPostDetail } from '@/components/features/forums/ForumPostDetail'
import { RepliesList } from '@/components/features/forums/RepliesList'
import { ReplyForm } from '@/components/features/forums/ReplyForm'
import { SummarizeButton } from '@/components/features/forums/SummarizeButton'

interface Post {
  id: string
  title: string
  content: string
  views: number
  upvotes: number
  hasUpvoted: boolean
  createdAt: string
  user: {
    id: string
    email: string
    name?: string | null
    role?: string
    profile?: {
      displayName?: string | null
      avatarUrl?: string | null
      major?: string | null
    } | null
  }
  tags: { id: string; name: string }[]
  _count: {
    replies: number
  }
}

interface Reply {
  id: string
  content: string
  upvotes: number
  hasUpvoted: boolean
  createdAt: string
  user: {
    id: string
    email: string
    name?: string | null
    profile?: {
      displayName?: string | null
    } | null
  }
}

export default function ForumPostPage() {
  const params = useParams()
  const postId = params.id as string

  const [post, setPost] = useState<Post | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)

  const fetchReplies = useCallback(async () => {
    try {
      const response = await fetch(`/api/forums/replies?postId=${postId}`)
      if (response.ok) {
        const data = (await response.json()) as { replies: Reply[] }
        setReplies(data.replies ?? [])
      }
    } catch (err) {
      console.error('Failed to fetch replies:', err)
    }
  }, [postId])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)

      try {
        const [postResponse, meResponse] = await Promise.all([
          fetch(`/api/forums/posts/${postId}`),
          fetch('/api/user/me'),
        ])

        if (!postResponse.ok) {
          if (postResponse.status === 404) {
            throw new Error('Post not found')
          }
          throw new Error('Failed to load post')
        }
        const postData = await postResponse.json()
        setPost(postData)

        if (meResponse.ok) {
          const me = (await meResponse.json()) as { id: string; role: string }
          setCurrentUserId(me.id)
          setCurrentUserRole(me.role)
        }

        await fetchReplies()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post')
      } finally {
        setLoading(false)
      }
    }

    if (postId) {
      fetchData()
    }
  }, [postId, fetchReplies])

  const threadContent = post
    ? [
        `Title: ${post.title}`,
        `Author: ${post.user.profile?.displayName || post.user.email}`,
        `Content: ${post.content}`,
        '',
        'Replies:',
        ...replies.map(
          (r) => `- ${r.user.profile?.displayName || r.user.email.split('@')[0]}: ${r.content}`
        ),
      ].join('\n')
    : ''

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-12 sm:px-6 md:px-8">
        <Loader2 className="text-primary h-6 w-6 animate-spin" />
        <span className="text-muted-foreground ml-3 text-sm">Loading discussion...</span>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 md:px-8">
        <Link
          href="/forums"
          className="text-muted-foreground hover:text-primary mb-6 inline-flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Discussions
        </Link>
        <div className="border-semantic-error/30 bg-semantic-error/10 flex flex-col items-center justify-center rounded-xl border py-12">
          <AlertCircle className="text-semantic-error h-10 w-10" />
          <p className="text-semantic-error mt-4 font-medium">{error || 'Post not found'}</p>
          <Link href="/forums">
            <Button variant="outline" className="mt-4">
              Back to Discussions
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 md:px-8">
      {/* Page header */}
      <div className="mb-6 flex items-center gap-2">
        <Link
          href="/forums"
          className="text-muted-foreground hover:bg-muted -ml-1 rounded-full p-1.5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-muted-foreground text-sm font-medium">Discussion</span>
      </div>

      {/* Post */}
      <ForumPostDetail
        post={post}
        canDelete={
          currentUserId === post.user.id ||
          ['MODERATOR', 'ADMIN', 'OWNER'].includes(currentUserRole ?? '')
        }
      />

      {/* AI Summary */}
      {(post._count.replies > 0 || post.content.length > 200) && (
        <div className="mt-5">
          <SummarizeButton threadContent={threadContent} />
        </div>
      )}

      {/* Reply form */}
      <div className="mt-6">
        <ReplyForm postId={postId} onReplyCreated={fetchReplies} />
      </div>

      {/* Replies */}
      <div className="mt-6">
        <RepliesList replies={replies} />
      </div>
    </div>
  )
}

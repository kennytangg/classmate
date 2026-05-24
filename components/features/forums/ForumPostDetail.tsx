'use client'

import { Eye, MessageCircle } from 'lucide-react'
import { formatDate } from '@/lib/format'
import { UpvoteButton } from './UpvoteButton'
import { ModeratorContentActions } from './ModeratorContentActions'
import { UserFlagButton } from './UserFlagButton'

interface ForumPostDetailProps {
  post: {
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
    _count: {
      replies: number
    }
  }
  canDelete?: boolean
}

export function ForumPostDetail({ post, canDelete }: ForumPostDetailProps) {
  const authorName =
    post.user.profile?.displayName ?? post.user.name ?? post.user.email.split('@')[0] ?? 'Anonymous'
  const authorRole = post.user.role === 'MODERATOR' ? 'Moderator' : 'Student'

  return (
    <div>
      {/* Author row — time lives here, not below the content */}
      <div className="mb-4 flex items-center gap-3">
        <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold">
          {authorName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate leading-tight font-bold">{authorName}</p>
          <p className="text-muted-foreground text-sm">
            {authorRole} · {formatDate(post.createdAt)}
          </p>
        </div>
        {canDelete && <ModeratorContentActions contentId={post.id} contentType="post" />}
      </div>

      {/* Title */}
      <h1 className="text-foreground mb-3 text-lg leading-snug font-bold">{post.title}</h1>

      {/* Content */}
      <div className="text-foreground mb-5 text-sm leading-relaxed whitespace-pre-line">
        {post.content}
      </div>

      {/* Action bar — stats merged in left, secondary actions right for visual balance */}
      <div className="border-border/50 flex items-center gap-2.5 border-t pt-4">
        <UpvoteButton
          contentId={post.id}
          contentType="post"
          initialUpvotes={post.upvotes}
          initialHasUpvoted={post.hasUpvoted}
          size="lg"
        />
        <span className="text-muted-foreground/30 select-none">·</span>
        <span className="text-muted-foreground flex items-center gap-1 text-xs">
          <Eye className="h-3.5 w-3.5" />
          {post.views.toLocaleString()} views
        </span>
        <span className="text-muted-foreground/30 select-none">·</span>
        <span className="text-muted-foreground flex items-center gap-1 text-xs">
          <MessageCircle className="h-3.5 w-3.5" />
          {post._count.replies} {post._count.replies === 1 ? 'reply' : 'replies'}
        </span>
        <div className="ml-auto">
          <UserFlagButton contentType="post" contentId={post.id} size="lg" />
        </div>
      </div>
    </div>
  )
}

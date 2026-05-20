'use client'

import { MessageSquare, Eye } from 'lucide-react'
import { formatDate } from '@/lib/format'
import { UpvoteButton } from './UpvoteButton'
import { RoleGate } from '@/components/ui/role-gate'
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
}

export function ForumPostDetail({ post }: ForumPostDetailProps) {
  const authorName = post.user.profile?.displayName ?? post.user.email.split('@')[0] ?? 'Anonymous'
  const authorRole = post.user.role === 'MODERATOR' ? 'Moderator' : 'Student'

  return (
    <div className="border-border bg-card overflow-hidden rounded-xl border shadow-sm">
      <div className="p-6 md:p-8">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-muted text-primary flex h-10 w-10 items-center justify-center rounded-full font-bold">
              {authorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-foreground font-medium">{authorName}</h3>
              <p className="text-muted-foreground text-xs">
                {authorRole} &bull; {formatDate(post.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RoleGate allowedRoles={['MODERATOR', 'ADMIN']}>
              <ModeratorContentActions contentId={post.id} contentType="post" />
            </RoleGate>
          </div>
        </div>

        <h1 className="text-foreground mb-4 text-2xl font-bold md:text-3xl">{post.title}</h1>

        <div className="prose text-foreground dark:prose-invert mb-6 max-w-none whitespace-pre-line">
          {post.content}
        </div>

        <div className="border-border flex items-center gap-6 border-t pt-6">
          <UpvoteButton
            contentId={post.id}
            contentType="post"
            initialUpvotes={post.upvotes}
            initialHasUpvoted={post.hasUpvoted}
          />
          <div className="text-muted-foreground flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            <span>{post._count.replies} Replies</span>
          </div>
          <div className="text-muted-foreground flex items-center">
            <Eye className="mr-2 h-5 w-5" />
            <span>{post.views} Views</span>
          </div>
          <div className="ml-auto">
            <UserFlagButton contentType="post" contentId={post.id} />
          </div>
        </div>
      </div>
    </div>
  )
}

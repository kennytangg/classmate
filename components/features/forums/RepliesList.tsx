'use client'

import { formatDate } from '@/lib/format'
import { UpvoteButton } from './UpvoteButton'
import { RoleGate } from '@/components/ui/role-gate'
import { ModeratorContentActions } from './ModeratorContentActions'
import { UserFlagButton } from './UserFlagButton'

export interface Reply {
  id: string
  content: string
  createdAt: string
  upvotes: number
  hasUpvoted: boolean
  user: {
    id: string
    email: string
    name?: string | null
    profile?: {
      displayName?: string | null
    } | null
  }
}

interface RepliesListProps {
  replies: Reply[]
}

export function RepliesList({ replies }: RepliesListProps) {
  if (replies.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        No replies yet. Be the first to respond!
      </p>
    )
  }

  return (
    <div>
      <h3 className="text-foreground mb-5 text-base font-bold">
        {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
      </h3>

      <div className="space-y-6">
        {replies.map((reply) => {
          const authorName =
            reply.user.profile?.displayName ??
            reply.user.name ??
            reply.user.email.split('@')[0] ??
            'Anonymous'

          return (
            <div key={reply.id} className="flex items-start gap-3">
              {/* Avatar */}
              <div className="bg-muted text-muted-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                {authorName.charAt(0).toUpperCase()}
              </div>

              {/* Content column */}
              <div className="min-w-0 flex-1">
                {/* Name · time + mod actions */}
                <div className="mb-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                  <span className="text-foreground text-sm font-semibold">{authorName}</span>
                  <span className="text-muted-foreground text-xs">·</span>
                  <span className="text-muted-foreground text-xs">
                    {formatDate(reply.createdAt)}
                  </span>
                  <div className="ml-auto">
                    <RoleGate allowedRoles={['MODERATOR', 'ADMIN']}>
                      <ModeratorContentActions contentId={reply.id} contentType="reply" />
                    </RoleGate>
                  </div>
                </div>

                {/* Reply content */}
                <p className="text-foreground mb-3 text-sm leading-relaxed whitespace-pre-line">
                  {reply.content}
                </p>

                {/* Action icons */}
                <div className="flex items-center gap-4">
                  <UpvoteButton
                    contentId={reply.id}
                    contentType="reply"
                    initialUpvotes={reply.upvotes}
                    initialHasUpvoted={reply.hasUpvoted}
                  />
                  <UserFlagButton contentType="reply" contentId={reply.id} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

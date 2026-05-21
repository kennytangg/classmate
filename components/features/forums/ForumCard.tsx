import Link from 'next/link'
import { MessageCircle, Eye } from 'lucide-react'
import { UpvoteButton } from './UpvoteButton'

interface ForumCardProps {
  id: number | string
  title: string
  content: string
  author: string
  replies: number
  views: number
  upvotes: number
  hasUpvoted: boolean
  createdAt: string
  isRecommended?: boolean
}

export function ForumCard({
  id,
  title,
  content,
  author,
  replies,
  views,
  upvotes,
  hasUpvoted,
  createdAt,
  isRecommended,
}: ForumCardProps) {
  const preview = content.length > 120 ? content.slice(0, 120).trimEnd() + '…' : content

  return (
    <Link href={`/forums/${id}`} className="group block cursor-pointer">
      <div className="border-border border-b px-4 py-5 transition-colors hover:bg-black/5 dark:hover:bg-white/[0.04]">
        {/* Author row */}
        <div className="mb-1 flex items-center gap-2">
          <div className="bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
            {author.charAt(0).toUpperCase()}
          </div>
          <span className="text-muted-foreground text-xs">
            {author} · {createdAt}
          </span>
          {isRecommended && (
            <span className="text-primary ml-1 text-xs font-medium">✦ Trending</span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-foreground mb-1 text-base leading-snug font-semibold">{title}</h3>

        {/* Excerpt */}
        <p className="text-muted-foreground mb-2 line-clamp-1 text-sm leading-relaxed">{preview}</p>

        {/* Stats row */}
        <div className="flex items-center gap-8">
          <span onClick={(e) => e.preventDefault()}>
            <UpvoteButton
              contentId={String(id)}
              contentType="post"
              initialUpvotes={upvotes}
              initialHasUpvoted={hasUpvoted}
            />
          </span>

          {/* Replies — clicking navigates to the post reply section */}
          <div className="group/comment text-muted-foreground relative flex cursor-pointer items-center gap-1 text-xs transition-colors hover:text-blue-500">
            <MessageCircle className="h-3.5 w-3.5" />
            <span>{replies}</span>
            <span className="bg-popover text-popover-foreground pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap opacity-0 shadow-md transition-opacity group-hover/comment:opacity-100">
              Reply
            </span>
          </div>

          {/* Views */}
          <div
            className="group/views text-muted-foreground relative flex cursor-pointer items-center gap-1 text-xs transition-colors hover:text-emerald-500"
            onClick={(e) => e.preventDefault()}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>{views}</span>
            <span className="bg-popover text-popover-foreground pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap opacity-0 shadow-md transition-opacity group-hover/views:opacity-100">
              View
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

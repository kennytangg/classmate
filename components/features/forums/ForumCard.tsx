import Link from 'next/link'
import { MessageSquare, Eye } from 'lucide-react'
import { UpvoteButton } from './UpvoteButton'

const TAG_COLORS: Record<string, string> = {
  math: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  cs: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  physics: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  chemistry: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  biology: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  history: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  english: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  general: 'bg-muted text-muted-foreground',
}

function tagColor(tag: string): string {
  return TAG_COLORS[tag.toLowerCase()] ?? 'bg-muted text-muted-foreground'
}

interface ForumCardProps {
  id: number | string
  title: string
  content: string
  author: string
  replies: number
  views: number
  upvotes: number
  hasUpvoted: boolean
  tags: string[]
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
  tags,
  createdAt,
  isRecommended,
}: ForumCardProps) {
  const preview = content.length > 150 ? content.slice(0, 150).trimEnd() + '…' : content
  const primaryTag = tags[0]
  const remainingTags = tags.slice(1)
  const isUnanswered = replies === 0

  return (
    <Link href={`/forums/${id}`} className="group block">
      <div className="border-border bg-card hover:border-primary/30 rounded-xl border p-5 transition-all hover:shadow-md">
        {/* Author row + category badge */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="bg-primary/10 text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold">
              {author.charAt(0).toUpperCase()}
            </div>
            <span className="text-muted-foreground truncate text-xs">
              {author} · {createdAt}
            </span>
          </div>
          {primaryTag && (
            <span
              className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${tagColor(primaryTag)}`}
            >
              {primaryTag}
            </span>
          )}
        </div>

        {/* Trending badge — shown when AI flagged this thread as relevant */}
        {isRecommended && (
          <p className="text-primary mb-1.5 text-xs font-medium">✦ Trending in your community</p>
        )}

        {/* Title */}
        <h3 className="text-foreground group-hover:text-primary mb-2 text-base leading-snug font-semibold transition-colors">
          {title}
        </h3>

        {/* Content preview */}
        <p className="text-muted-foreground mb-4 line-clamp-2 text-sm leading-relaxed">{preview}</p>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <UpvoteButton
            contentId={String(id)}
            contentType="post"
            initialUpvotes={upvotes}
            initialHasUpvoted={hasUpvoted}
          />

          <div
            className={`flex items-center gap-1 text-sm ${isUnanswered ? 'font-medium text-amber-500' : 'text-muted-foreground'}`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>
              {isUnanswered
                ? 'No replies yet'
                : `${replies} ${replies === 1 ? 'reply' : 'replies'}`}
            </span>
          </div>

          <div className="text-muted-foreground flex items-center gap-1 text-sm">
            <Eye className="h-4 w-4" />
            <span>{views} views</span>
          </div>

          {remainingTags.length > 0 && (
            <div className="ml-auto flex flex-wrap gap-1">
              {remainingTags.map((tag) => (
                <span
                  key={tag}
                  className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

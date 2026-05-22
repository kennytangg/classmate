'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Flame } from 'lucide-react'

interface Thread {
  id: string
  title: string
  content: string
  author: string
  createdAt: string
  upvotes: number
  views: number
  repliesCount: number
  reason: string
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${Math.max(1, mins)}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function TrendingThreadsWidget() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/recommendations/threads')
      .then((r) => r.json())
      .then((data) => setThreads(data.recommendations ?? []))
      .catch(() => setThreads([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Flame className="text-primary h-3.5 w-3.5" />
          <span className="text-foreground text-lg font-semibold">Trending Discussions</span>
        </div>
        <Link href="/forums" className="text-primary text-xs font-medium hover:underline">
          View all
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-border space-y-2 rounded-xl border p-4">
              <div className="flex items-center gap-2">
                <div className="bg-muted h-6 w-6 animate-pulse rounded-full" />
                <div className="bg-muted h-3 w-28 animate-pulse rounded" />
              </div>
              <div className="bg-muted h-4 w-4/5 animate-pulse rounded" />
              <div className="bg-muted h-3 w-full animate-pulse rounded" />
              <div className="bg-muted h-3 w-2/3 animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : threads.length === 0 ? (
        <p className="text-muted-foreground py-1 text-sm">No trending discussions yet.</p>
      ) : (
        <ul className="space-y-2.5">
          {threads.slice(0, 3).map((thread) => (
            <li key={thread.id}>
              <Link
                href={`/forums/${thread.id}`}
                className="border-border hover:bg-muted/40 block rounded-xl border p-4 transition-colors"
              >
                {/* Author row */}
                <div className="mb-2 flex items-center gap-2">
                  <div className="bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                    {thread.author.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {thread.author} · {relativeTime(thread.createdAt)}
                  </span>
                </div>

                {/* Title */}
                <p className="text-foreground mb-1.5 text-sm leading-snug font-semibold">
                  {thread.title}
                </p>

                {/* Snippet */}
                <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
                  {thread.content}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

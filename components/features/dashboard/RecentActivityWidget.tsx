'use client'

import { useEffect, useState } from 'react'
import { FileText, MessageSquare, Clock } from 'lucide-react'

type ActivityKind = 'material' | 'post'

interface ActivityItem {
  id: string
  kind: ActivityKind
  title: string
  href: string
  createdAt: string
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${Math.max(1, mins)}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="bg-muted h-7 w-7 animate-pulse rounded-lg" />
      <div className="flex-1 space-y-1.5">
        <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
        <div className="bg-muted h-3 w-1/4 animate-pulse rounded" />
      </div>
    </div>
  )
}

export function RecentActivityWidget() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const materialsPromise = fetch('/api/materials?limit=3')
      .then((r) => r.json())
      .then((data): ActivityItem[] =>
        (data.materials ?? []).map((m: { id: string; title: string; createdAt: string }) => ({
          id: m.id,
          kind: 'material' as const,
          title: m.title,
          href: '/materials',
          createdAt: m.createdAt,
        }))
      )
      .catch((): ActivityItem[] => [])

    const postsPromise = fetch('/api/forums/posts?limit=3')
      .then((r) => r.json())
      .then((data): ActivityItem[] =>
        (data.posts ?? []).map((p: { id: string; title: string; createdAt: string }) => ({
          id: p.id,
          kind: 'post' as const,
          title: p.title,
          href: `/forums/${p.id}`,
          createdAt: p.createdAt,
        }))
      )
      .catch((): ActivityItem[] => [])

    Promise.all([materialsPromise, postsPromise]).then(([materials, posts]) => {
      const merged = [...materials, ...posts]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
      setItems(merged)
      setLoading(false)
    })
  }, [])

  return (
    <div className="bg-card border-border rounded-2xl border p-5">
      <div className="mb-4 flex items-center gap-2">
        <Clock className="text-muted-foreground h-4 w-4" />
        <span className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
          Recent Activity
        </span>
      </div>

      {loading ? (
        <div className="divide-border divide-y">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground py-4 text-sm">No recent activity yet.</p>
      ) : (
        <ul className="divide-border divide-y">
          {items.map((item) => {
            const Icon = item.kind === 'material' ? FileText : MessageSquare
            const iconColor =
              item.kind === 'material'
                ? 'text-amber-500 bg-amber-500/10'
                : 'text-blue-500 bg-blue-500/10'
            return (
              <li key={`${item.kind}-${item.id}`}>
                <a
                  href={item.href}
                  className="flex items-center gap-3 py-3 transition-opacity first:pt-0 last:pb-0 hover:opacity-80"
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconColor}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-foreground min-w-0 flex-1 truncate text-sm font-medium">
                    {item.title}
                  </p>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {relativeTime(item.createdAt)}
                  </span>
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

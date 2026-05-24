'use client'

import { useEffect, useState } from 'react'

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

export function RecentActivityWidget() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user/me')
      .then((r) => r.json())
      .then((me: { id: string }) => {
        const userId = me.id

        const materialsPromise = fetch(`/api/materials?limit=3&userId=${userId}`)
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

        const postsPromise = fetch(`/api/forums/posts?limit=3&userId=${userId}`)
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

        return Promise.all([materialsPromise, postsPromise])
      })
      .then(([materials, posts]) => {
        const merged = [...materials, ...posts]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
        setItems(merged)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="mb-3">
        <span className="text-foreground text-lg font-semibold">Recent Activity</span>
      </div>

      {loading ? (
        <div className="space-y-3.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="bg-muted mt-1.5 h-1.5 w-1.5 animate-pulse rounded-full" />
              <div className="flex-1 space-y-1">
                <div className="bg-muted h-3.5 w-3/4 animate-pulse rounded" />
                <div className="bg-muted h-3 w-16 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground py-1 text-sm">
          You haven&apos;t posted or uploaded anything yet.
        </p>
      ) : (
        <ul className="space-y-3.5">
          {items.map((item) => (
            <li key={`${item.kind}-${item.id}`} className="flex items-start gap-2.5">
              <span className="text-muted-foreground bg-muted mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs">
                {item.kind === 'post' ? 'Post' : 'Material'}
              </span>
              <div className="min-w-0">
                <a
                  href={item.href}
                  className="text-foreground hover:text-primary line-clamp-1 text-sm transition-colors"
                >
                  {item.title}
                </a>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {relativeTime(item.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

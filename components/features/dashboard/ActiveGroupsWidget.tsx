'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, ArrowRight } from 'lucide-react'

interface Group {
  id: string
  name: string
  subject: string
  _count: { members: number }
}

export function ActiveGroupsWidget() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/study-groups?myGroups=true&limit=4')
      .then((r) => r.json())
      .then((data) => setGroups(data.groups ?? []))
      .catch(() => setGroups([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Users className="text-muted-foreground h-3.5 w-3.5" />
          <span className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
            My Groups
          </span>
        </div>
        <Link
          href="/groups"
          className="text-primary flex items-center gap-0.5 text-xs font-medium hover:underline"
        >
          Browse <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="bg-muted h-7 w-7 animate-pulse rounded-lg" />
              <div className="flex-1 space-y-1">
                <div className="bg-muted h-3.5 w-1/2 animate-pulse rounded" />
                <div className="bg-muted h-3 w-1/3 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex items-center justify-between py-1">
          <p className="text-muted-foreground text-sm">No groups yet</p>
          <Link
            href="/groups"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-3 py-1 text-xs font-medium transition-colors"
          >
            Browse
          </Link>
        </div>
      ) : (
        <ul className="divide-border divide-y">
          {groups.map((group) => (
            <li key={group.id}>
              <Link
                href={`/groups/${group.id}`}
                className="flex items-center gap-3 py-2.5 transition-opacity first:pt-0 last:pb-0 hover:opacity-75"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Users className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm font-medium">{group.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {group.subject} · {group._count.members} members
                  </p>
                </div>
                <ArrowRight className="text-muted-foreground h-3 w-3 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

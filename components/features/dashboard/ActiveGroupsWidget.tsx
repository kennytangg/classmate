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

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="bg-muted h-8 w-8 animate-pulse rounded-lg" />
      <div className="flex-1 space-y-1.5">
        <div className="bg-muted h-4 w-1/2 animate-pulse rounded" />
        <div className="bg-muted h-3 w-1/3 animate-pulse rounded" />
      </div>
    </div>
  )
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
    <div className="bg-card border-border rounded-2xl border p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="text-muted-foreground h-4 w-4" />
          <span className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
            My Groups
          </span>
        </div>
        <Link
          href="/groups"
          className="text-primary flex items-center gap-1 text-xs font-medium hover:underline"
        >
          Browse <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <div className="divide-border divide-y">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : groups.length === 0 ? (
        <p className="text-muted-foreground py-4 text-sm">
          You haven&apos;t joined any groups yet.{' '}
          <Link href="/groups" className="text-primary hover:underline">
            Browse groups.
          </Link>
        </p>
      ) : (
        <ul className="divide-border divide-y">
          {groups.map((group) => (
            <li key={group.id}>
              <Link
                href={`/groups/${group.id}`}
                className="flex items-center gap-3 py-3 transition-opacity first:pt-0 last:pb-0 hover:opacity-80"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Users className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm font-medium">{group.name}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="bg-muted text-muted-foreground inline-block rounded-full px-2 py-0.5 text-xs">
                      {group.subject}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {group._count.members} members
                    </span>
                  </div>
                </div>
                <ArrowRight className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

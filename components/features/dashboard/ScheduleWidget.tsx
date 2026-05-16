'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, ArrowRight } from 'lucide-react'

interface Event {
  id: string
  title: string
  date: string
  startTime: string | null
  endTime: string | null
  description: string | null
}

function formatEventDate(dateStr: string, startTime: string | null): string {
  const date = new Date(dateStr)
  const dayStr = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  if (!startTime) return dayStr
  const parts = startTime.split(':').map(Number)
  const h = parts[0] ?? 0
  const m = parts[1] ?? 0
  const d = new Date()
  d.setHours(h, m)
  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${dayStr} · ${timeStr}`
}

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="bg-muted mt-0.5 h-8 w-8 animate-pulse rounded-lg" />
      <div className="flex-1 space-y-1.5">
        <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
        <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
      </div>
    </div>
  )
}

export function ScheduleWidget() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((data) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const upcoming = (data.events ?? [])
          .filter((e: Event) => new Date(e.date) >= today)
          .slice(0, 3)
        setEvents(upcoming)
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-card border-border rounded-2xl border p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="text-muted-foreground h-4 w-4" />
          <span className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
            Upcoming
          </span>
        </div>
        <Link
          href="/schedule"
          className="text-primary flex items-center gap-1 text-xs font-medium hover:underline"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <div className="divide-border divide-y">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-2xl">
            <Calendar className="text-muted-foreground h-6 w-6" />
          </div>
          <div>
            <p className="text-foreground text-sm font-medium">Nothing scheduled yet</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Plan your study sessions to stay on track
            </p>
          </div>
          <Link
            href="/schedule"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-4 py-1.5 text-xs font-medium transition-colors"
          >
            Add a session
          </Link>
        </div>
      ) : (
        <ul className="divide-border divide-y">
          {events.map((event) => (
            <li key={event.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <div className="bg-primary/10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                <Calendar className="text-primary h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-foreground truncate text-sm font-medium">{event.title}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {formatEventDate(event.date, event.startTime)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

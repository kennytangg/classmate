'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Event {
  id: string
  title: string
  date: string
  startTime: string | null
  endTime: string | null
  description: string | null
}

function parseEventDisplay(event: Event) {
  const date = new Date(event.date)
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const day = date.getDate()

  let time = ''
  if (event.startTime) {
    const parts = event.startTime.split(':').map(Number)
    const h = parts[0] ?? 0
    const m = parts[1] ?? 0
    const d = new Date()
    d.setHours(h, m)
    time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const detail = [time, event.description].filter(Boolean).join(' · ')
  return { month, day, detail }
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
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-foreground text-lg font-semibold">Upcoming Schedule</span>
        <Link href="/schedule" className="text-primary text-xs font-medium hover:underline">
          View all
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="bg-muted h-10 w-10 animate-pulse rounded" />
              <div className="flex-1 space-y-1.5">
                <div className="bg-muted h-3.5 w-3/4 animate-pulse rounded" />
                <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex items-center justify-between py-1">
          <p className="text-muted-foreground text-sm">Nothing scheduled yet</p>
          <Link
            href="/schedule"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-3 py-1 text-xs font-medium transition-colors"
          >
            Add
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {events.map((event) => {
            const { month, day, detail } = parseEventDisplay(event)
            return (
              <li key={event.id} className="flex items-start gap-3">
                {/* Date block */}
                <div className="w-9 shrink-0 text-center">
                  <p className="text-primary text-xs leading-none font-semibold">{month}</p>
                  <p className="text-foreground text-lg leading-tight font-bold">{day}</p>
                </div>
                {/* Vertical rule */}
                <div className="border-border mt-0.5 h-9 w-px shrink-0 border-l" />
                {/* Content */}
                <div className="min-w-0">
                  <p className="text-foreground text-sm leading-snug font-medium">{event.title}</p>
                  {detail && <p className="text-muted-foreground mt-0.5 text-xs">{detail}</p>}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

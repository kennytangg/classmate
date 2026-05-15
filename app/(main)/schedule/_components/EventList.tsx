'use client'

import { Button } from '@/components/ui/button'
import { CalendarDays, Clock, Pencil, Trash2, Users } from 'lucide-react'
import { formatEventTime } from './types'
import type { EventItem } from './types'

interface EventListProps {
  events: EventItem[]
  loading: boolean
  currentUserId?: string
  onEdit: (event: EventItem) => void
  onDelete: (id: string) => void
}

export function EventList({ events, loading, currentUserId, onEdit, onDelete }: EventListProps) {
  const sorted = events.slice().sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="lg:border-border lg:bg-card lg:rounded-2xl lg:border lg:p-4">
      {/* Sticky header */}
      <div className="bg-card mb-3 flex items-center justify-between lg:sticky lg:top-0">
        <h2 className="text-foreground flex items-center gap-2 text-sm font-semibold">
          <Clock className="h-4 w-4" /> Upcoming
        </h2>
        {events.length > 0 && (
          <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
            {events.length}
          </span>
        )}
      </div>

      {/* Scrollable list */}
      <div className="max-h-[calc(100vh-16rem)] space-y-2 overflow-y-auto lg:max-h-[calc(100vh-14rem)]">
        {sorted.map((e) => (
          <div
            key={e.id}
            className="border-border bg-card flex items-center justify-between rounded-xl border p-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className={`h-6 w-1.5 shrink-0 rounded-full ${e.color}`} />
              <div className="min-w-0">
                <div className="text-foreground truncate text-sm font-medium">{e.title}</div>
                <div className="text-muted-foreground text-xs">
                  {new Date(e.date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                  {formatEventTime(e.startTime, e.endTime)
                    ? ` · ${formatEventTime(e.startTime, e.endTime)}`
                    : ''}
                </div>
                {e.studyGroupName && (
                  <div className="text-primary mt-0.5 flex items-center gap-1 text-xs">
                    <Users className="h-2.5 w-2.5" />
                    {e.studyGroupName}
                  </div>
                )}
              </div>
            </div>
            <div className="ml-2 flex shrink-0 items-center gap-1">
              {/* Only creator can edit/delete */}
              {(!e.creatorId || e.creatorId === currentUserId) && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg"
                    onClick={() => onEdit(e)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive h-7 w-7 rounded-lg"
                    onClick={() => onDelete(e.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}

        {!loading && events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CalendarDays className="text-muted-foreground/40 mb-3 h-10 w-10" />
            <p className="text-muted-foreground text-sm font-medium">No upcoming events</p>
            <p className="text-muted-foreground/70 mt-1 text-xs">
              Click any day on the calendar to add one.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

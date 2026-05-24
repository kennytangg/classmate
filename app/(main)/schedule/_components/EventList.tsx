'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CalendarDays, Clock, Loader2, Lock, Pencil, Trash2, Users } from 'lucide-react'
import { formatEventTime } from './types'
import type { EventItem } from './types'

interface EventListProps {
  events: EventItem[]
  loading: boolean
  currentUserId?: string
  onEdit: (event: EventItem) => void
  onDelete: (id: string) => Promise<void>
}

export function EventList({ events, loading, currentUserId, onEdit, onDelete }: EventListProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteErrorId, setDeleteErrorId] = useState<string | null>(null)

  const todayISO = new Date().toISOString().slice(0, 10)
  const sorted = events.slice().sort((a, b) => a.date.localeCompare(b.date))
  const upcoming = sorted.filter((e) => e.date >= todayISO)
  const past = sorted.filter((e) => e.date < todayISO)

  function canManage(event: EventItem): boolean {
    return !event.creatorId || !currentUserId || event.creatorId === currentUserId
  }

  async function handleDelete(id: string, creatorName?: string | null) {
    setConfirmDeleteId(null)
    setDeleteErrorId(null)
    setDeletingId(id)
    try {
      await onDelete(id)
    } catch (err) {
      setDeletingId(null)
      const status = (err as Error & { status?: number }).status
      if (status === 403 || status === 401) {
        const who = creatorName
          ? `Only ${creatorName} can delete this event.`
          : 'Only the creator can delete this event.'
        toast.error(who)
      } else {
        setDeleteErrorId(id)
      }
    }
  }

  function renderEvent(e: EventItem) {
    const managed = canManage(e)
    const isDeleting = deletingId === e.id
    const hasDeleteError = deleteErrorId === e.id

    return (
      <div
        key={e.id}
        className={`border-border bg-card flex items-start gap-3 rounded-xl border p-3 transition-opacity ${isDeleting ? 'opacity-50' : ''}`}
      >
        <div className={`mt-0.5 h-full w-1 shrink-0 self-stretch rounded-full ${e.color}`} />

        <div className="min-w-0 flex-1">
          <div className="text-foreground truncate text-sm font-medium">{e.title}</div>
          <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
            <span>
              {new Date(e.date + 'T12:00:00').toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            {formatEventTime(e.startTime, e.endTime) && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatEventTime(e.startTime, e.endTime)}
              </span>
            )}
          </div>
          {e.studyGroupName && (
            <div className="text-primary mt-1 flex items-center gap-1 text-xs">
              <Users className="h-3 w-3" />
              {e.studyGroupName}
            </div>
          )}
          {e.creatorName && (
            <div className="text-muted-foreground mt-0.5 text-xs">By {e.creatorName}</div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {managed ? (
            isDeleting ? (
              <Loader2 className="text-muted-foreground h-3.5 w-3.5 animate-spin" />
            ) : hasDeleteError ? (
              <div className="flex items-center gap-2">
                <span className="text-destructive text-xs">Failed</span>
                <button
                  className="text-primary text-xs hover:underline"
                  onClick={() => handleDelete(e.id, e.creatorName)}
                >
                  Retry
                </button>
                <button
                  className="text-muted-foreground text-xs hover:underline"
                  onClick={() => setDeleteErrorId(null)}
                >
                  ✕
                </button>
              </div>
            ) : confirmDeleteId === e.id ? (
              <div className="flex items-center gap-2">
                <button
                  className="text-destructive text-xs font-medium hover:underline"
                  onClick={() => handleDelete(e.id, e.creatorName)}
                >
                  Delete
                </button>
                <button
                  className="text-muted-foreground text-xs hover:underline"
                  onClick={() => setConfirmDeleteId(null)}
                >
                  Cancel
                </button>
              </div>
            ) : (
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
                  onClick={() => setConfirmDeleteId(e.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )
          ) : (
            <div
              className="text-muted-foreground/40"
              title={
                e.creatorName
                  ? `Only ${e.creatorName} can edit this event`
                  : 'Only the creator can edit this event'
              }
            >
              <Lock className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="border-border rounded-2xl border">
      <div className="border-border flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-foreground flex items-center gap-2 text-sm font-semibold">
          <CalendarDays className="h-4 w-4" />
          Events
        </h2>
        {events.length > 0 && (
          <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
            {events.length}
          </span>
        )}
      </div>

      <div className="p-4">
        {!loading && events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarDays className="text-muted-foreground/30 mb-3 h-8 w-8" />
            <p className="text-muted-foreground text-sm font-medium">No events yet</p>
            <p className="text-muted-foreground/60 mt-0.5 text-xs">
              Click any day on the calendar to add one.
            </p>
          </div>
        )}

        {(upcoming.length > 0 || past.length > 0) && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {upcoming.length > 0 && (
              <div className="space-y-2 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                {past.length > 0 && (
                  <p className="text-muted-foreground px-1 text-xs font-medium tracking-wide uppercase">
                    Upcoming
                  </p>
                )}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {upcoming.map(renderEvent)}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div className="space-y-2 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                <p className="text-muted-foreground px-1 text-xs font-medium tracking-wide uppercase">
                  Past
                </p>
                <div className="grid grid-cols-1 gap-2 opacity-55 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {past.map(renderEvent)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { buildMonthMatrix, toISO } from '@/lib/calendar'
import { CalendarHeader } from './_components/CalendarHeader'
import { CalendarGrid } from './_components/CalendarGrid'
import { EventList } from './_components/EventList'
import { EventDialog } from './_components/EventDialog'
import type { StudyGroupOption } from './_components/EventDialog'
import { mapApiEvent } from './_components/types'
import type { EventItem, ApiEvent } from './_components/types'

export default function MySchedulePage() {
  const [current, setCurrent] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [events, setEvents] = useState<EventItem[]>([])
  const [studyGroups, setStudyGroups] = useState<StudyGroupOption[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftDate, setDraftDate] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [color, setColor] = useState('bg-primary')
  const [studyGroupId, setStudyGroupId] = useState<string | null>(null)

  const monthMatrix = useMemo(() => buildMonthMatrix(current.year, current.month), [current])
  const monthLabel = useMemo(
    () =>
      new Date(current.year, current.month, 1).toLocaleString(undefined, {
        month: 'long',
        year: 'numeric',
      }),
    [current]
  )

  async function loadEvents() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/events', { cache: 'no-store' })
      const data = (await response.json()) as { events?: ApiEvent[]; error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Failed to load events')
      setEvents((data.events ?? []).map(mapApiEvent))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  async function loadStudyGroups() {
    try {
      const res = await fetch('/api/study-groups?myGroups=true&limit=50', { cache: 'no-store' })
      if (!res.ok) return
      const data = (await res.json()) as {
        groups?: { id: string; name: string }[]
        studyGroups?: { id: string; name: string }[]
      }
      const groups = data.groups ?? data.studyGroups ?? []
      setStudyGroups(groups.map((g) => ({ id: g.id, name: g.name })))
    } catch {
      // non-critical, silently ignore
    }
  }

  async function loadCurrentUser() {
    try {
      const res = await fetch('/api/user/me', { cache: 'no-store' })
      if (!res.ok) return
      const data = (await res.json()) as { user?: { id: string } }
      if (data.user?.id) setCurrentUserId(data.user.id)
    } catch {
      // non-critical
    }
  }

  useEffect(() => {
    void Promise.all([loadEvents(), loadStudyGroups(), loadCurrentUser()])
  }, [])

  function openNew(dateISO: string) {
    setEditingId(null)
    setDraftDate(dateISO)
    setTitle('')
    setStartTime('')
    setEndTime('')
    setColor('bg-primary')
    setStudyGroupId(null)
    setOpen(true)
  }

  function openEdit(event: EventItem) {
    setEditingId(event.id)
    setDraftDate(event.date)
    setTitle(event.title)
    setStartTime(event.startTime ?? '')
    setEndTime(event.endTime ?? '')
    setColor(event.color)
    setStudyGroupId(event.studyGroupId ?? null)
    setOpen(true)
  }

  async function saveEvent() {
    if (!draftDate || !title.trim()) {
      setOpen(false)
      return
    }

    const normalizedStartTime = startTime.trim()
    const normalizedEndTime = endTime.trim()
    if (
      (normalizedStartTime && !normalizedEndTime) ||
      (!normalizedStartTime && normalizedEndTime)
    ) {
      setError('Start time and end time must both be provided.')
      return
    }

    setSaving(true)
    setError(null)

    const body = {
      title: title.trim(),
      date: new Date(`${draftDate}T00:00:00.000Z`).toISOString(),
      startTime: normalizedStartTime || null,
      endTime: normalizedEndTime || null,
      category: color,
      studyGroupId: studyGroupId || null,
    }

    try {
      if (editingId) {
        const res = await fetch(`/api/events/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = (await res.json()) as { event?: ApiEvent; error?: string }
        if (!res.ok || !data.event) throw new Error(data.error ?? 'Failed to update event')
        const mapped = mapApiEvent(data.event)
        setEvents((prev) => prev.map((e) => (e.id === editingId ? mapped : e)))
      } else {
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = (await res.json()) as { event?: ApiEvent; error?: string }
        if (!res.ok || !data.event) throw new Error(data.error ?? 'Failed to create event')
        setEvents((prev) => [...prev, mapApiEvent(data.event!)])
      }
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event')
    } finally {
      setSaving(false)
    }
  }

  async function deleteEvent(id: string) {
    setError(null)
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' })
      const data = (await res.json()) as { success?: boolean; error?: string }
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Failed to delete event')
      setEvents((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event')
    }
  }

  function prevMonth() {
    setCurrent((c) => {
      const m = c.month - 1
      return m < 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: m }
    })
  }
  function nextMonth() {
    setCurrent((c) => {
      const m = c.month + 1
      return m > 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: m }
    })
  }
  function goToday() {
    const d = new Date()
    setCurrent({ year: d.getFullYear(), month: d.getMonth() })
  }

  return (
    <div className="bg-background">
      <div className="px-4 py-4 sm:px-6 md:px-12 lg:px-16">
        <CalendarHeader
          monthLabel={monthLabel}
          onPrev={prevMonth}
          onNext={nextMonth}
          onToday={goToday}
          onNewEvent={() => openNew(toISO(current.year, current.month, new Date().getDate()))}
        />

        {error && (
          <div className="border-semantic-error/30 bg-semantic-error/10 text-semantic-error mb-4 rounded-lg border px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-start lg:gap-6">
          <div className="min-w-0 flex-1">
            {loading ? (
              <div className="border-border bg-card text-muted-foreground flex items-center justify-center rounded-xl border p-8">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading schedule...
              </div>
            ) : (
              <CalendarGrid
                monthMatrix={monthMatrix}
                currentYear={current.year}
                currentMonth={current.month}
                events={events}
                onCellClick={openNew}
              />
            )}
          </div>

          <aside className="mt-6 w-full shrink-0 lg:mt-0 lg:w-80 xl:w-96">
            <EventList
              events={events}
              loading={loading}
              currentUserId={currentUserId}
              onEdit={openEdit}
              onDelete={(id) => void deleteEvent(id)}
            />
          </aside>
        </div>

        <EventDialog
          open={open}
          onOpenChange={setOpen}
          editingId={editingId}
          draftDate={draftDate}
          title={title}
          startTime={startTime}
          endTime={endTime}
          color={color}
          saving={saving}
          studyGroupId={studyGroupId}
          studyGroups={studyGroups}
          onTitleChange={setTitle}
          onStartTimeChange={setStartTime}
          onEndTimeChange={setEndTime}
          onColorChange={setColor}
          onStudyGroupChange={setStudyGroupId}
          onSave={() => void saveEvent()}
        />
      </div>
    </div>
  )
}

'use client'

import { toISO } from '@/lib/calendar'
import { formatEventTime } from './types'
import type { EventItem } from './types'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface CalendarCell {
  year: number
  month: number
  day: number
}

interface CalendarGridProps {
  monthMatrix: CalendarCell[]
  currentYear: number
  currentMonth: number
  events: EventItem[]
  onCellClick: (dateISO: string) => void
}

export function CalendarGrid({
  monthMatrix,
  currentYear,
  currentMonth,
  events,
  onCellClick,
}: CalendarGridProps) {
  const now = new Date()
  const todayISO = toISO(now.getFullYear(), now.getMonth(), now.getDate())

  return (
    <>
      <div className="mb-2 grid grid-cols-7 gap-1.5">
        {DAYS.map((d) => (
          <div key={d} className="text-muted-foreground text-center text-xs">
            {d[0]}
            <span className="hidden sm:inline">{d.slice(1)}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {monthMatrix.map((cell) => {
          const dateISO = toISO(cell.year, cell.month, cell.day)
          const cellEvents = events.filter((e) => e.date === dateISO)
          const inCurrent = cell.month === currentMonth && cell.year === currentYear
          const isToday = dateISO === todayISO

          return (
            <button
              key={dateISO}
              onClick={() => onCellClick(dateISO)}
              className={`group relative h-16 rounded-xl border p-1.5 text-left transition-colors sm:h-20 lg:h-24 ${
                inCurrent
                  ? isToday
                    ? 'border-primary bg-card ring-primary hover:border-primary ring-2'
                    : 'border-border bg-card hover:border-primary'
                  : 'border-border bg-muted opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`text-xs ${
                    inCurrent
                      ? isToday
                        ? 'text-primary font-bold'
                        : 'text-foreground font-medium'
                      : 'text-muted-foreground font-medium'
                  }`}
                >
                  {cell.day}
                </div>
                <div className="flex gap-0.5">
                  {cellEvents.slice(0, 2).map((e) => (
                    <span
                      key={e.id}
                      className={`inline-block h-1.5 w-1.5 rounded-full ${e.color}`}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-1 hidden space-y-0.5 sm:block">
                {cellEvents.slice(0, 2).map((e) => (
                  <div
                    key={e.id}
                    className={`rounded px-1.5 py-0.5 text-[10px] ${e.color} truncate text-white`}
                  >
                    {e.title}{' '}
                    {formatEventTime(e.startTime, e.endTime)
                      ? `• ${formatEventTime(e.startTime, e.endTime)}`
                      : ''}
                  </div>
                ))}
                {cellEvents.length > 2 && (
                  <div className="text-muted-foreground text-[10px]">
                    +{cellEvents.length - 2} more
                  </div>
                )}
              </div>

              {inCurrent && cellEvents.length === 0 && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="text-muted-foreground/50 text-lg leading-none">+</span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </>
  )
}

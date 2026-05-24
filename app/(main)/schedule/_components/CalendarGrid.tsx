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
      <div className="mb-2 grid grid-cols-7 gap-2">
        {DAYS.map((d) => (
          <div key={d} className="text-muted-foreground py-1 text-center text-xs font-medium">
            <span className="sm:hidden">{d[0]}</span>
            <span className="hidden sm:inline">{d}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {monthMatrix.map((cell) => {
          const dateISO = toISO(cell.year, cell.month, cell.day)
          const cellEvents = events.filter((e) => e.date === dateISO)
          const inCurrent = cell.month === currentMonth && cell.year === currentYear
          const isToday = dateISO === todayISO

          return (
            <button
              key={dateISO}
              onClick={() => onCellClick(dateISO)}
              className={`group relative min-h-[72px] rounded-xl border p-2 text-left transition-colors sm:min-h-[90px] lg:min-h-[108px] ${
                inCurrent
                  ? isToday
                    ? 'border-primary bg-card ring-primary hover:border-primary ring-2'
                    : 'border-border bg-card hover:border-primary/50'
                  : 'border-border/50 bg-muted/40 opacity-60'
              }`}
            >
              <span
                className={`text-xs font-semibold sm:text-sm ${
                  isToday ? 'text-primary' : inCurrent ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {cell.day}
              </span>

              <div className="mt-1 hidden space-y-0.5 sm:block">
                {cellEvents.slice(0, 2).map((e) => (
                  <div
                    key={e.id}
                    className={`truncate rounded px-1.5 py-0.5 text-[10px] font-medium text-white ${e.color}`}
                  >
                    {e.title}
                    {formatEventTime(e.startTime, e.endTime)
                      ? ` · ${formatEventTime(e.startTime, e.endTime)}`
                      : ''}
                  </div>
                ))}
                {cellEvents.length > 2 && (
                  <div className="text-muted-foreground px-1 text-[10px]">
                    +{cellEvents.length - 2} more
                  </div>
                )}
              </div>

              {/* Mobile: dot indicators */}
              <div className="mt-1 flex gap-0.5 sm:hidden">
                {cellEvents.slice(0, 3).map((e) => (
                  <span key={e.id} className={`h-1.5 w-1.5 rounded-full ${e.color}`} />
                ))}
              </div>

              {inCurrent && cellEvents.length === 0 && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="text-muted-foreground/40 text-xl leading-none">+</span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </>
  )
}

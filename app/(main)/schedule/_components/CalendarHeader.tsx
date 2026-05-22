'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

interface CalendarHeaderProps {
  monthLabel: string
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onNewEvent: () => void
}

export function CalendarHeader({
  monthLabel,
  onPrev,
  onNext,
  onToday,
  onNewEvent,
}: CalendarHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-foreground text-lg font-bold">My Schedule</h1>
          <p className="text-muted-foreground text-sm">{monthLabel}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Prev / Next pill group */}
        <div className="border-border bg-card flex overflow-hidden rounded-xl border">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-none border-r"
            onClick={onPrev}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-none"
            onClick={onNext}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button variant="outline" size="sm" className="rounded-xl" onClick={onToday}>
          Today
        </Button>

        {/* New Event */}
        <Button
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 rounded-xl"
          onClick={onNewEvent}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Event</span>
        </Button>
      </div>
    </div>
  )
}

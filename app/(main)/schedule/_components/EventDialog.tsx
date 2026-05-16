'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Users } from 'lucide-react'

const COLOR_OPTIONS = [
  { value: 'bg-violet-500', label: 'Violet' },
  { value: 'bg-blue-500', label: 'Blue' },
  { value: 'bg-emerald-500', label: 'Green' },
  { value: 'bg-amber-500', label: 'Amber' },
  { value: 'bg-rose-500', label: 'Red' },
  { value: 'bg-sky-400', label: 'Sky' },
]

export type StudyGroupOption = {
  id: string
  name: string
}

interface EventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingId: string | null
  draftDate: string | null
  title: string
  startTime: string
  endTime: string
  color: string
  saving: boolean
  studyGroupId: string | null
  studyGroups: StudyGroupOption[]
  onTitleChange: (v: string) => void
  onStartTimeChange: (v: string) => void
  onEndTimeChange: (v: string) => void
  onColorChange: (v: string) => void
  onStudyGroupChange: (v: string | null) => void
  onSave: () => void
}

const inputClass =
  'w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground'

export function EventDialog({
  open,
  onOpenChange,
  editingId,
  draftDate,
  title,
  startTime,
  endTime,
  color,
  saving,
  studyGroupId,
  studyGroups,
  onTitleChange,
  onStartTimeChange,
  onEndTimeChange,
  onColorChange,
  onStudyGroupChange,
  onSave,
}: EventDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card border">
        <DialogHeader>
          <DialogTitle>{editingId ? 'Edit Event' : 'New Event'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-muted-foreground text-sm">
            {draftDate ? new Date(draftDate).toDateString() : ''}
          </div>
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className={inputClass}
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-muted-foreground mb-1 block text-xs">Start time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => onStartTimeChange(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex-1">
              <label className="text-muted-foreground mb-1 block text-xs">End time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => onEndTimeChange(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Study group selector */}
          {studyGroups.length > 0 && (
            <div>
              <label className="text-muted-foreground mb-1 flex items-center gap-1 text-xs">
                <Users className="h-3 w-3" />
                Share with study group
              </label>
              <select
                value={studyGroupId ?? ''}
                onChange={(e) => onStudyGroupChange(e.target.value || null)}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="">Personal event only</option>
                {studyGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-muted-foreground mb-2 block text-xs">Color</label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => onColorChange(value)}
                  className={`h-7 w-7 rounded-full ${value} transition-transform hover:scale-110 ${color === value ? 'ring-offset-card scale-110 ring-2 ring-white/70 ring-offset-2' : ''}`}
                  aria-label={label}
                  title={label}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" className="rounded-lg" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
              onClick={onSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

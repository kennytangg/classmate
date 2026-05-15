'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Users } from 'lucide-react'

const COLOR_OPTIONS = [
  'bg-primary',
  'bg-semantic-success',
  'bg-secondary',
  'bg-semantic-warning',
  'bg-semantic-error',
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

function clampTime(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 4) return raw
  const hh = Math.min(parseInt(digits.slice(0, 2), 10), 23)
  const mm = Math.min(parseInt(digits.slice(2, 4), 10), 59)
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

function formatTimeInput(prev: string, next: string): string {
  const digits = next.replace(/\D/g, '')
  if (digits.length === 0) return ''
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`
}

interface TimeInputProps {
  value: string
  onChange: (v: string) => void
  label: string
}

function TimeInput({ value, onChange, label }: TimeInputProps) {
  return (
    <div className="relative flex-1">
      <input
        type="text"
        inputMode="numeric"
        placeholder="HH:MM"
        value={value}
        onChange={(e) => onChange(formatTimeInput(value, e.target.value))}
        onBlur={() => {
          if (value && value.length > 0) onChange(clampTime(value))
        }}
        maxLength={5}
        className={`${inputClass} w-full`}
        aria-label={label}
      />
    </div>
  )
}

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
          <div className="flex gap-2">
            <TimeInput value={startTime} onChange={onStartTimeChange} label="Start time" />
            <TimeInput value={endTime} onChange={onEndTimeChange} label="End time" />
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

          <div className="flex items-center gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                onClick={() => onColorChange(c)}
                className={`h-6 w-6 rounded ${c} ${color === c ? 'ring-ring ring-offset-card ring-2 ring-offset-2' : ''}`}
                aria-label={c}
              />
            ))}
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

'use client'

import { useState } from 'react'
import { Flag } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface UserFlagButtonProps {
  contentType: 'post' | 'reply'
  contentId: string
  size?: 'sm' | 'lg'
}

const FLAG_CATEGORIES = [
  'Spam or promotional content',
  'Harassment or bullying',
  'Misinformation',
  'Inappropriate content',
  'Off-topic',
  'Other',
] as const

export function UserFlagButton({ contentType, contentId, size = 'sm' }: UserFlagButtonProps) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<string>('')
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!category) return

    setIsSubmitting(true)
    try {
      const reason = details.trim() ? `${category}: ${details.trim()}` : category

      const res = await fetch('/api/moderation/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, contentId, reason }),
      })

      if (res.status === 409) {
        toast.info('You have already reported this content.')
        setOpen(false)
        return
      }

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Failed to submit report')
      }

      toast.success('Report submitted. Thank you for helping keep the community safe.')
      setOpen(false)
      setCategory('')
      setDetails('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit report')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setCategory('')
      setDetails('')
    }
    setOpen(next)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-muted-foreground hover:text-destructive flex items-center gap-1.5 transition-colors ${
          size === 'lg' ? 'text-sm font-medium' : 'text-xs'
        }`}
        title="Report this content"
      >
        <Flag className={size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
        <span>Report</span>
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Report Content</DialogTitle>
            <DialogDescription>
              Help us keep the community safe by telling us why this content is problematic.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-2 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Why are you reporting this?</label>
              <div className="space-y-1.5">
                {FLAG_CATEGORIES.map((cat) => (
                  <label
                    key={cat}
                    className="hover:bg-muted flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors"
                  >
                    <input
                      type="radio"
                      name="flagCategory"
                      value={cat}
                      checked={category === cat}
                      onChange={() => setCategory(cat)}
                      className="accent-primary"
                    />
                    {cat}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Additional details{' '}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value.slice(0, 500))}
                placeholder="Describe the issue in more detail…"
                rows={3}
                className="border-input bg-background placeholder:text-muted-foreground focus:ring-ring w-full resize-none rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              />
              <p className="text-muted-foreground text-right text-xs">{details.length}/500</p>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!category || isSubmitting}>
                {isSubmitting ? 'Submitting…' : 'Submit Report'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

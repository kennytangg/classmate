'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

const TITLE_LIMIT = 60

interface EditMaterialModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  material: { id: string; title: string } | null
  onSuccess: (id: string, updates: { title: string }) => void
}

export function EditMaterialModal({
  open,
  onOpenChange,
  material,
  onSuccess,
}: EditMaterialModalProps) {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && material) {
      setTitle(material.title)
      setError(null)
    }
  }, [open, material])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!material) return
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Title is required.')
      return
    }
    if (trimmedTitle.length > TITLE_LIMIT) {
      setError(`Title must be ${TITLE_LIMIT} characters or fewer.`)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/materials/${material.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmedTitle }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? 'Failed to save changes.')
      }
      onSuccess(material.id, { title: trimmedTitle })
      toast.success('Material updated.')
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Edit material</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Update the title for this material.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-2 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="edit-title" className="text-sm font-medium">
              Title
            </label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={TITLE_LIMIT}
              placeholder="Material title"
              className="border-border bg-background text-foreground focus:ring-ring w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              disabled={loading}
              autoFocus
            />
            <p className="text-muted-foreground text-right text-xs">
              {title.trim().length}/{TITLE_LIMIT}
            </p>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Save changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

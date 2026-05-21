'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ModeratorContentActionsProps {
  contentId: string
  contentType: 'post' | 'reply'
  /** Called after a reply is deleted so the parent can refresh the list */
  onDeleted?: () => void
}

/**
 * Moderator-only action menu rendered on forum posts and replies.
 * Only mounted inside a <RoleGate allowedRoles={['MODERATOR', 'ADMIN']}> so
 * regular students never see this in the DOM.
 */
export function ModeratorContentActions({
  contentId,
  contentType,
  onDeleted,
}: ModeratorContentActionsProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')

  const apiBase =
    contentType === 'post' ? `/api/forums/posts/${contentId}` : `/api/forums/replies/${contentId}`

  const label = contentType === 'post' ? 'Post' : 'Reply'

  async function handleDelete() {
    setIsDeleting(true)
    const reason = deleteReason.trim() || undefined
    try {
      const res = await fetch(apiBase, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Failed to delete')
      }
      toast.success(`${label} deleted`)
      if (contentType === 'post') {
        router.push('/forums')
        router.refresh()
      } else {
        onDeleted?.()
        router.refresh()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
      setDeleteReason('')
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground h-8 w-8 shrink-0"
            title="Moderator actions"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Moderator actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive cursor-pointer"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete {label}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete confirmation dialog */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open)
          if (!open) setDeleteReason('')
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {label}?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The {label.toLowerCase()} will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Reason <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value.slice(0, 500))}
                placeholder="e.g. Confirmed community guidelines violation."
                rows={3}
                disabled={isDeleting}
                className="border-input bg-background placeholder:text-muted-foreground focus:ring-ring w-full resize-none rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none disabled:opacity-50"
              />
              <p className="text-muted-foreground text-xs">{deleteReason.length}/500</p>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

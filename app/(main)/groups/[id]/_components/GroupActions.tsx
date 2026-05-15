'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ExternalLink, Loader2, LogIn, LogOut, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface GroupActionsProps {
  groupId: string
  isCurrentUserMember: boolean
  isCurrentUserOwner: boolean
  onJoined: () => void
  onLeft: () => void
  onDeleted: () => void
}

export function GroupActions({
  groupId,
  isCurrentUserMember,
  isCurrentUserOwner,
  onJoined,
  onLeft,
  onDeleted,
}: GroupActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  async function handleJoin() {
    setLoading(true)
    try {
      const res = await fetch(`/api/study-groups/${groupId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to join group')
        return
      }
      toast.success('Joined group!')
      onJoined()
    } catch {
      toast.error('Failed to join group')
    } finally {
      setLoading(false)
    }
  }

  async function handleLeave() {
    setLoading(true)
    try {
      const res = await fetch(`/api/study-groups/${groupId}/join`, {
        method: 'DELETE',
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to leave group')
        return
      }
      toast.success('Left group')
      onLeft()
    } catch {
      toast.error('Failed to leave group')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    setDeleteOpen(false)
    try {
      const res = await fetch(`/api/study-groups?groupId=${groupId}`, {
        method: 'DELETE',
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to delete group')
        return
      }
      toast.success('Group deleted')
      onDeleted()
      router.push('/groups')
    } catch {
      toast.error('Failed to delete group')
    } finally {
      setLoading(false)
    }
  }

  if (isCurrentUserOwner) {
    return (
      <div className="border-border border-t px-4 py-3 sm:px-6 sm:py-4">
        <Link
          href={`/chat/group/${groupId}`}
          className="border-primary text-primary hover:bg-primary/10 mb-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg border bg-transparent text-sm font-semibold transition"
        >
          <ExternalLink className="h-4 w-4" />
          Open Group Chat →
        </Link>

        <button
          onClick={() => setDeleteOpen(true)}
          disabled={loading}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-300 bg-transparent text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Delete Group
        </button>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this group?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. All members will be removed and the group will be
                permanently deleted.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteOpen(false)}
                className="border-border rounded-lg border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  if (isCurrentUserMember) {
    return (
      <div className="border-border border-t px-4 py-3 sm:px-6 sm:py-4">
        <Link
          href={`/chat/group/${groupId}`}
          className="border-primary text-primary hover:bg-primary/10 mb-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg border bg-transparent text-sm font-semibold transition"
        >
          <ExternalLink className="h-4 w-4" />
          Open Group Chat →
        </Link>

        <button
          onClick={handleLeave}
          disabled={loading}
          className="border-border text-foreground hover:bg-muted flex h-10 w-full items-center justify-center gap-2 rounded-lg border bg-transparent text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          Leave Group
        </button>
      </div>
    )
  }

  return (
    <div className="border-border border-t px-4 py-3 sm:px-6 sm:py-4">
      <button
        onClick={handleJoin}
        disabled={loading}
        className="border-primary text-primary hover:bg-primary/10 flex h-10 w-full items-center justify-center gap-2 rounded-lg border bg-transparent text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        Join Group
      </button>
    </div>
  )
}

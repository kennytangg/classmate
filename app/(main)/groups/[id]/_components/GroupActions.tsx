'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, LogIn, LogOut, Trash2 } from 'lucide-react'
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
  isPrivate: boolean
  onJoined: () => void
  onLeft: () => void
  onDeleted: () => void
}

export function GroupActions({
  groupId,
  isCurrentUserMember,
  isCurrentUserOwner,
  isPrivate,
  onJoined,
  onLeft,
  onDeleted,
}: GroupActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [codeError, setCodeError] = useState('')

  async function handleJoin(inviteCode?: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/study-groups/${groupId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteCode ? { inviteCode } : {}),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        if (isPrivate) {
          setCodeError(data.error ?? 'Invalid invite code')
          setLoading(false)
          return
        }
        toast.error(data.error ?? 'Failed to join group')
        return
      }
      setJoinOpen(false)
      setCodeInput('')
      setCodeError('')
      toast.success('Joined group!')
      onJoined()
    } catch {
      toast.error('Failed to join group')
    } finally {
      setLoading(false)
    }
  }

  function handleJoinClick() {
    if (isPrivate) {
      setJoinOpen(true)
    } else {
      void handleJoin()
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
        onClick={handleJoinClick}
        disabled={loading}
        className="border-primary text-primary hover:bg-primary/10 flex h-10 w-full items-center justify-center gap-2 rounded-lg border bg-transparent text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        Join Group
      </button>

      <Dialog
        open={joinOpen}
        onOpenChange={(open) => {
          setJoinOpen(open)
          if (!open) {
            setCodeInput('')
            setCodeError('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Invite Code</DialogTitle>
            <DialogDescription>
              This is a private group — it won&apos;t appear in Discover. Ask the group owner for
              the 6-character invite code to join.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <input
              value={codeInput}
              onChange={(e) => {
                setCodeInput(e.target.value.toUpperCase())
                setCodeError('')
              }}
              placeholder="e.g. A3F9C2"
              maxLength={6}
              className="border-border bg-card text-foreground placeholder:text-muted-foreground h-10 w-full rounded-lg border px-3 font-mono text-sm tracking-widest"
            />
            {codeError && <p className="text-xs text-red-500">{codeError}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setJoinOpen(false)}
                className="border-border rounded-lg border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleJoin(codeInput.trim())}
                disabled={loading || !codeInput.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Join
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

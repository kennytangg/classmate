'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, LogOut, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { GroupDetailHeader } from './_components/GroupDetailHeader'
import { GroupActions } from './_components/GroupActions'
import { MembersSection } from './_components/MembersSection'
import { GroupChatPanel } from './_components/GroupChatPanel'
import { GroupMembersSidebar } from './_components/GroupMembersSidebar'

interface GroupMember {
  id: string
  role: string
  joinedAt: string
  userId: string
  user: {
    id: string
    name: string | null
    image: string | null
    profile?: { avatarUrl: string | null } | null
  }
}

interface GroupDetail {
  id: string
  name: string
  subject: string
  description: string | null
  memberCount: number
  isPrivate: boolean
  ownerId: string
  inviteCode?: string
  owner: { id: string; name: string | null; image: string | null }
  members: GroupMember[]
  isCurrentUserMember: boolean
  isCurrentUserOwner: boolean
}

export default function GroupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.id as string

  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)

  const fetchGroup = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/study-groups/${groupId}`)
      if (res.status === 404) {
        setError('Group not found')
        return
      }
      if (!res.ok) {
        setError('Failed to load group')
        return
      }
      const data = (await res.json()) as GroupDetail
      setGroup(data)
    } catch {
      setError('Failed to load group')
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    void fetchGroup()
  }, [fetchGroup])

  async function handleLeave() {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/study-groups/${groupId}/join`, { method: 'DELETE' })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to leave group')
        return
      }
      toast.success('Left group')
      router.push('/groups')
    } catch {
      toast.error('Failed to leave group')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDelete() {
    setActionLoading(true)
    setDeleteOpen(false)
    try {
      const res = await fetch(`/api/study-groups?groupId=${groupId}`, { method: 'DELETE' })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to delete group')
        return
      }
      toast.success('Group deleted')
      router.push('/groups')
    } catch {
      toast.error('Failed to delete group')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="text-primary h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{error ?? 'Group not found'}</p>
        <button
          onClick={() => router.push('/groups')}
          className="text-primary text-sm hover:underline"
        >
          Back to Groups
        </button>
      </div>
    )
  }

  if (group.isCurrentUserMember || group.isCurrentUserOwner) {
    return (
      <div className="bg-background flex h-full flex-col overflow-hidden">
        {/* Mobile-only top bar — desktop uses the sidebar header instead */}
        <div className="border-border flex shrink-0 items-center gap-3 border-b px-4 py-2.5 md:hidden">
          <button
            onClick={() => router.push('/groups')}
            className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg p-1.5 transition-colors"
            aria-label="Back to groups"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-foreground truncate text-sm font-semibold">{group.name}</h2>
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Users className="h-3 w-3 shrink-0" />
              {group.memberCount} members · {group.subject}
            </span>
          </div>
          {group.isCurrentUserOwner ? (
            <button
              onClick={() => setDeleteOpen(true)}
              disabled={actionLoading}
              className="text-muted-foreground rounded-lg p-1.5 transition-colors hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Delete group"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          ) : (
            <button
              onClick={() => setLeaveOpen(true)}
              disabled={actionLoading}
              className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Leave group"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {/* Body: chat + members sidebar */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <GroupChatPanel groupId={group.id} />
          </div>
          <GroupMembersSidebar
            members={group.members}
            ownerId={group.ownerId}
            groupId={group.id}
            inviteCode={group.inviteCode}
            groupName={group.name}
            isCurrentUserOwner={group.isCurrentUserOwner}
            actionLoading={actionLoading}
            onBack={() => router.push('/groups')}
            onActionClick={() =>
              group.isCurrentUserOwner ? setDeleteOpen(true) : setLeaveOpen(true)
            }
          />
        </div>

        <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Leave this group?</DialogTitle>
              <DialogDescription>
                You will lose access to the group chat and will need to rejoin to participate again.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setLeaveOpen(false)}
                className="border-border rounded-lg border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setLeaveOpen(false)
                  void handleLeave()
                }}
                className="border-border text-foreground hover:bg-muted rounded-lg border px-4 py-2 text-sm font-semibold transition"
              >
                Leave
              </button>
            </div>
          </DialogContent>
        </Dialog>

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

  return (
    <div className="bg-background text-foreground flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl">
          <GroupDetailHeader
            name={group.name}
            subject={group.subject}
            description={group.description}
            memberCount={group.memberCount}
            onBack={() => router.push('/groups')}
          />

          <GroupActions
            groupId={group.id}
            isCurrentUserMember={group.isCurrentUserMember}
            isCurrentUserOwner={group.isCurrentUserOwner}
            isPrivate={group.isPrivate}
            onJoined={fetchGroup}
            onLeft={fetchGroup}
            onDeleted={() => router.push('/groups')}
          />

          <MembersSection members={group.members} ownerId={group.ownerId} />
        </div>
      </div>
    </div>
  )
}

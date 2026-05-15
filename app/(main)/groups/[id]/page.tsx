'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Calendar, Bot } from 'lucide-react'
import { GroupDetailHeader } from './_components/GroupDetailHeader'
import { GroupActions } from './_components/GroupActions'
import { MembersSection } from './_components/MembersSection'

interface GroupMember {
  id: string
  role: string
  joinedAt: string
  userId: string
  user: { id: string; name: string | null; image: string | null }
}

interface GroupDetail {
  id: string
  name: string
  subject: string
  description: string | null
  maxMembers: number | null
  memberCount: number
  isPrivate: boolean
  ownerId: string
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

  const isFull = group.maxMembers != null && group.memberCount >= group.maxMembers

  return (
    <div className="bg-background text-foreground flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl">
          <GroupDetailHeader
            name={group.name}
            subject={group.subject}
            description={group.description}
            memberCount={group.memberCount}
            maxMembers={group.maxMembers}
            onBack={() => router.push('/groups')}
          />

          <GroupActions
            groupId={group.id}
            isCurrentUserMember={group.isCurrentUserMember}
            isCurrentUserOwner={group.isCurrentUserOwner}
            isFull={isFull}
            onJoined={fetchGroup}
            onLeft={fetchGroup}
            onDeleted={() => router.push('/groups')}
          />

          <MembersSection members={group.members} ownerId={group.ownerId} />

          <div className="border-border mx-4 mb-6 rounded-xl border p-4">
            <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-widest uppercase">
              Group Tools
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/schedule"
                className="text-foreground hover:bg-accent flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
              >
                <Calendar className="text-muted-foreground h-4 w-4 shrink-0" />
                Schedule a session
              </Link>
              <Link
                href="/ai-tutor"
                className="text-foreground hover:bg-accent flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
              >
                <Bot className="text-muted-foreground h-4 w-4 shrink-0" />
                Get AI help
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

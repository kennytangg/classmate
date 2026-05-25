'use client'

import { useState, use } from 'react'
import { ArrowLeft, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { GroupChatPanel } from '@/app/(main)/groups/[id]/_components/GroupChatPanel'
import { getAvatarColor } from '@/lib/utils/avatarColor'

type LoadedGroup = {
  id: string
  name: string
  subject: string
  memberCount: number
}

export default function GroupChatPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params)
  const [group, setGroup] = useState<LoadedGroup | null>(null)

  const groupInitial = group?.name?.charAt(0).toUpperCase() ?? 'G'
  const groupColor = group ? getAvatarColor(group.name) : 'bg-violet-500'

  return (
    <div className="bg-card flex h-full flex-col">
      {/* Header */}
      <div className="border-border bg-card z-10 flex items-center gap-3 border-b p-4">
        <Link href={`/groups/${groupId}`}>
          <Button variant="ghost" size="icon" className="rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div
          className={`${groupColor} flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-white`}
        >
          {groupInitial}
        </div>
        <div className="min-w-0">
          <h3 className="text-foreground truncate font-semibold">{group?.name ?? 'Group Chat'}</h3>
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <Users className="h-3 w-3 shrink-0" />
            {group?.memberCount ?? '...'} members · {group?.subject ?? ''}
          </span>
        </div>
      </div>

      {/* Chat */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <GroupChatPanel groupId={groupId} onGroupLoaded={setGroup} />
      </div>
    </div>
  )
}

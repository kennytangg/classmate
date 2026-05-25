'use client'

import Image from 'next/image'
import { useState } from 'react'

interface Member {
  id: string
  role: string
  joinedAt: string
  user: {
    id: string
    name: string | null
    image: string | null
    profile?: { avatarUrl: string | null } | null
  }
}

interface MembersSectionProps {
  members: Member[]
  ownerId: string
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function MemberAvatar({ image, name }: { image: string | null; name: string | null }) {
  const [failed, setFailed] = useState(false)

  if (!image || failed) {
    return (
      <div className="bg-primary/10 text-primary flex h-full w-full items-center justify-center text-xs font-semibold">
        {getInitials(name)}
      </div>
    )
  }

  return (
    <Image
      src={image}
      alt={name ?? 'Member'}
      fill
      className="object-cover"
      sizes="36px"
      onError={() => setFailed(true)}
    />
  )
}

export function MembersSection({ members, ownerId }: MembersSectionProps) {
  return (
    <div className="p-4 md:p-6">
      <h2 className="text-foreground mb-4 text-lg font-semibold">
        Members{' '}
        <span className="text-muted-foreground text-sm font-normal">({members.length})</span>
      </h2>

      <ul className="space-y-3">
        {members.map((member) => {
          const isOwner = member.user.id === ownerId
          return (
            <li key={member.id} className="flex items-center gap-3">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full">
                <MemberAvatar
                  image={member.user.profile?.avatarUrl ?? member.user.image}
                  name={member.user.name}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-foreground truncate text-sm font-medium">
                  {member.user.name ?? 'Unknown User'}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                {isOwner ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    Owner
                  </span>
                ) : (
                  <span className="border-border text-muted-foreground rounded-full border px-2 py-0.5 text-xs capitalize">
                    {member.role}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

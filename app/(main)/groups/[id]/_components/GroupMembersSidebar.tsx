'use client'

import { useState } from 'react'
import { ArrowLeft, Check, Copy, Loader2, LogOut, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { getAvatarColor } from '@/lib/utils/avatarColor'

interface Member {
  id: string
  role: string
  user: {
    id: string
    name: string | null
    image: string | null
    profile?: { avatarUrl: string | null } | null
  }
}

interface GroupMembersSidebarProps {
  members: Member[]
  ownerId: string
  groupId: string
  inviteCode?: string
  groupName: string
  isCurrentUserOwner: boolean
  actionLoading: boolean
  onBack: () => void
  onActionClick: () => void
}

export function GroupMembersSidebar({
  members,
  ownerId,
  groupId,
  inviteCode: initialInviteCode,
  groupName,
  isCurrentUserOwner,
  actionLoading,
  onBack,
  onActionClick,
}: GroupMembersSidebarProps) {
  const [inviteCode, setInviteCode] = useState(initialInviteCode)
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  function handleCopy() {
    if (!inviteCode) return
    void navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRegenerate() {
    setRegenerating(true)
    try {
      const res = await fetch(`/api/study-groups/${groupId}/invite-code`, { method: 'POST' })
      const data = (await res.json()) as { inviteCode?: string; error?: string }
      if (res.ok && data.inviteCode) {
        setInviteCode(data.inviteCode)
      } else {
        const retryAfter = res.headers.get('Retry-After')
        const secs = retryAfter ? parseInt(retryAfter) : 3600
        const mins = Math.ceil(secs / 60)
        toast.error(
          res.status === 429
            ? `Too many requests. Try again in ${mins} minute${mins === 1 ? '' : 's'}.`
            : (data.error ?? 'Failed to regenerate invite code')
        )
      }
    } catch {
      toast.error('Failed to regenerate invite code')
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div className="border-border hidden h-full w-56 shrink-0 flex-col overflow-hidden border-l md:flex">
      {/* Group header — replaces the secondary topbar on desktop */}
      <div className="border-border shrink-0 border-b px-3 py-3">
        <div className="flex items-start gap-1">
          <button
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground mt-0.5 -ml-0.5 shrink-0 rounded p-1 transition-colors"
            aria-label="Back to groups"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <h2 className="text-foreground flex-1 text-sm leading-snug font-semibold break-words">
            {groupName}
          </h2>
          <button
            onClick={onActionClick}
            disabled={actionLoading}
            className={`mt-0.5 shrink-0 rounded p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              isCurrentUserOwner
                ? 'text-muted-foreground hover:text-red-500'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-label={isCurrentUserOwner ? 'Delete group' : 'Leave group'}
          >
            {actionLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isCurrentUserOwner ? (
              <Trash2 className="h-3.5 w-3.5" />
            ) : (
              <LogOut className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Invite code — owner only */}
      {inviteCode && (
        <div className="border-border shrink-0 border-b px-4 py-3">
          <h3 className="text-foreground mb-2 text-sm font-semibold">Invite Code</h3>
          <div className="flex items-center gap-1.5">
            <span className="bg-muted text-foreground flex-1 rounded px-2 py-1 font-mono text-xs font-bold tracking-widest">
              {inviteCode}
            </span>
            <button
              onClick={handleCopy}
              className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
              aria-label="Copy invite code"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              onClick={() => void handleRegenerate()}
              disabled={regenerating}
              className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors disabled:opacity-50"
              aria-label="Regenerate invite code"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${regenerating ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      )}
      {/* Members */}
      <div className="border-border shrink-0 border-b px-4 py-3">
        <h3 className="text-foreground text-sm font-semibold">
          Members <span className="text-muted-foreground font-normal">({members.length})</span>
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {members.map((member) => {
          const isOwner = member.user.id === ownerId
          const name = member.user.name ?? 'Unknown'
          const initial = name.charAt(0).toUpperCase()
          const color = getAvatarColor(name)
          const avatarSrc = member.user.profile?.avatarUrl ?? member.user.image
          return (
            <div key={member.id} className="flex items-center gap-2.5 rounded-lg px-2 py-2">
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarSrc}
                  alt={name}
                  className="h-7 w-7 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div
                  className={`${color} flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white`}
                >
                  {initial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-xs font-medium">{name}</p>
                {isOwner && (
                  <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                    Owner
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

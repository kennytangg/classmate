'use client'

import Image from 'next/image'
import { GraduationCap, MapPin } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  ConnectButton,
  type ConnectionStatus,
} from '@/components/features/connections/ConnectButton'
import { getAvatarColor } from '@/lib/utils/avatarColor'

interface ModalUser {
  id: string
  name: string | null
  image: string | null
  role: string
  profile: {
    displayName: string | null
    avatarUrl: string | null
    bio: string | null
    university: string | null
    major: string | null
  } | null
  connectionStatus: ConnectionStatus
  connectionId: string | null
}

interface UserProfileModalProps {
  user: ModalUser | null
  onClose: () => void
  onStatusChange: (userId: string, status: ConnectionStatus, connectionId: string | null) => void
}

export function UserProfileModal({ user, onClose, onStatusChange }: UserProfileModalProps) {
  if (!user) return null

  const displayName = user.profile?.displayName ?? user.name ?? 'Unknown'
  const avatarSrc = user.profile?.avatarUrl ?? user.image ?? null
  const avatarColor = getAvatarColor(user.id)

  return (
    <Dialog
      open={!!user}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader className="sr-only">
          <DialogTitle>{displayName}</DialogTitle>
          <DialogDescription>Profile details for {displayName}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 pt-2 text-center">
          {/* Avatar */}
          {avatarSrc ? (
            <Image
              src={avatarSrc}
              alt={displayName}
              width={96}
              height={96}
              className="h-24 w-24 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div
              className={`flex h-24 w-24 items-center justify-center rounded-full ${avatarColor}`}
            >
              <span className="text-3xl font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Name + role */}
          <div>
            <p className="text-foreground text-sm font-semibold">{displayName}</p>
            {user.role !== 'STUDENT' && (
              <span className="bg-primary/10 text-primary mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize">
                {user.role.toLowerCase()}
              </span>
            )}
          </div>

          {/* University + major */}
          {(user.profile?.university || user.profile?.major) && (
            <div className="text-muted-foreground flex flex-wrap justify-center gap-3 text-xs">
              {user.profile.major && (
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {user.profile.major}
                </span>
              )}
              {user.profile.university && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {user.profile.university}
                </span>
              )}
            </div>
          )}

          {/* Bio */}
          {user.profile?.bio && (
            <p className="text-muted-foreground text-xs leading-relaxed">{user.profile.bio}</p>
          )}

          {/* Connect action */}
          <div className="pt-1">
            <ConnectButton
              targetUserId={user.id}
              initialStatus={user.connectionStatus}
              initialConnectionId={user.connectionId}
              onStatusChange={(status, connectionId) =>
                onStatusChange(user.id, status, connectionId)
              }
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

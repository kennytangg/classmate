'use client'

import { useState, useEffect, use } from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import {
  MapPin,
  GraduationCap,
  Users,
  UserCheck,
  UserPlus,
  UserX,
  Clock,
  Loader2,
} from 'lucide-react'

const AVATAR_COLORS = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-fuchsia-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-indigo-500',
]
function getAvatarColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] as string
}
import { authClient } from '@/lib/auth-client'

type ProfileData = {
  id: string
  name: string | null
  role: string
  displayName: string | null
  bio: string | null
  university: string | null
  major: string | null
  avatarUrl: string | null
}

type ConnectionStatus = 'connected' | 'pending_sent' | 'pending_received' | 'not_connected'

export default function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const { data: session } = authClient.useSession()

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('not_connected')
  const [connectionId, setConnectionId] = useState<string | null>(null)
  const [connectionCount, setConnectionCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const currentUserId = session?.user?.id

  useEffect(() => {
    if (currentUserId && currentUserId === userId) {
      window.location.replace('/profile')
    }
  }, [currentUserId, userId])

  useEffect(() => {
    if (!userId) return

    async function load() {
      setLoading(true)
      try {
        const [profileRes, statusRes, countRes] = await Promise.all([
          fetch(`/api/user/profile?userId=${userId}`),
          fetch(`/api/connections/status?userId=${userId}`),
          fetch(`/api/connections/count?userId=${userId}`),
        ])

        const profileData = await profileRes.json()
        if (profileData.profile) setProfile(profileData.profile as ProfileData)

        if (statusRes.ok) {
          const statusData = await statusRes.json()
          setConnectionStatus(statusData.status as ConnectionStatus)
          setConnectionId(statusData.connectionId as string | null)
        }

        if (countRes.ok) {
          const countData = await countRes.json()
          setConnectionCount(countData.count as number)
        }
      } catch (err) {
        console.error('[UserProfilePage] Failed to load profile data:', err)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [userId])

  async function handleConnect() {
    setActionLoading(true)
    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: userId }),
      })
      const data = await res.json()
      if (res.ok) {
        const newStatus = data.connection.status === 'ACCEPTED' ? 'connected' : 'pending_sent'
        setConnectionStatus(newStatus)
        setConnectionId(data.connection.id as string)
        if (newStatus === 'connected') setConnectionCount((c) => c + 1)
      }
    } catch (err) {
      console.error('[UserProfilePage] handleConnect failed:', err)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleAccept() {
    if (!connectionId) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/connections/${connectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACCEPTED' }),
      })
      if (res.ok) {
        setConnectionStatus('connected')
        setConnectionCount((c) => c + 1)
      }
    } catch (err) {
      console.error('[UserProfilePage] handleAccept failed:', err)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject() {
    if (!connectionId) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/connections/${connectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' }),
      })
      if (res.ok) {
        setConnectionStatus('not_connected')
        setConnectionId(null)
      }
    } catch (err) {
      console.error('[UserProfilePage] handleReject failed:', err)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDisconnect() {
    if (!connectionId) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/connections/${connectionId}`, { method: 'DELETE' })
      if (res.ok) {
        setConnectionStatus('not_connected')
        setConnectionId(null)
        setConnectionCount((c) => Math.max(0, c - 1))
      }
    } catch (err) {
      console.error('[UserProfilePage] handleDisconnect failed:', err)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">User not found.</p>
      </div>
    )
  }

  const displayName = profile.displayName ?? profile.name ?? 'Unknown'
  const avatarColor = getAvatarColor(userId)

  return (
    <div className="bg-background text-foreground px-6 py-6 transition-colors duration-300 md:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Hero Card */}
        <div className="border-border bg-card relative overflow-hidden rounded-3xl border shadow-sm">
          {/* Cover strip */}
          <div className="from-primary/30 to-primary/5 h-24 bg-gradient-to-r" />

          <div className="px-6 pb-6 md:px-8">
            {/* Avatar overlapping cover */}
            <div className="bg-primary -mt-12 mb-4 inline-block rounded-full p-1">
              <div className="bg-card rounded-full p-1">
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt={displayName}
                    width={80}
                    height={80}
                    className="bg-muted h-20 w-20 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div
                    className={`flex h-20 w-20 items-center justify-center rounded-full ${avatarColor}`}
                  >
                    <span className="text-lg font-bold text-white">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-foreground text-lg font-bold">{displayName}</h1>
                  {profile.role !== 'STUDENT' && (
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold ${
                        profile.role === 'ADMIN'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                      }`}
                    >
                      {profile.role}
                    </span>
                  )}
                </div>
                <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
                  {profile.major && (
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4" />
                      {profile.major}
                    </div>
                  )}
                  {profile.university && (
                    <>
                      <span className="bg-muted-foreground h-1 w-1 rounded-full" />
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {profile.university}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Connection actions */}
              {currentUserId && (
                <div className="flex flex-wrap items-center gap-2">
                  {connectionStatus === 'not_connected' && (
                    <Button
                      className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-5"
                      onClick={handleConnect}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="mr-2 h-4 w-4" />
                      )}
                      Connect
                    </Button>
                  )}

                  {connectionStatus === 'pending_sent' && (
                    <Button
                      variant="outline"
                      className="border-border rounded-full px-5"
                      onClick={handleDisconnect}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Clock className="mr-2 h-4 w-4" />
                      )}
                      Pending
                    </Button>
                  )}

                  {connectionStatus === 'pending_received' && (
                    <>
                      <Button
                        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-5"
                        onClick={handleAccept}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <UserCheck className="mr-2 h-4 w-4" />
                        )}
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        className="border-border rounded-full px-5"
                        onClick={handleReject}
                        disabled={actionLoading}
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}

                  {connectionStatus === 'connected' && (
                    <Button
                      variant="outline"
                      className="border-border rounded-full px-5"
                      onClick={handleDisconnect}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UserCheck className="mr-2 h-4 w-4" />
                      )}
                      Connected
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Connections count */}
        <div className="border-border bg-card rounded-2xl border p-4 text-center shadow-sm">
          <Users className="text-primary mx-auto mb-1 h-5 w-5" />
          <p className="text-foreground text-lg font-bold">{connectionCount}</p>
          <p className="text-muted-foreground text-xs">Connections</p>
        </div>

        {/* About */}
        <div className="border-border bg-card rounded-2xl border p-6 shadow-sm">
          <h2 className="text-foreground mb-2 font-semibold">About</h2>
          {profile.bio ? (
            <p className="text-muted-foreground text-sm leading-relaxed">{profile.bio}</p>
          ) : (
            <p className="text-muted-foreground text-sm italic">No bio shared yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

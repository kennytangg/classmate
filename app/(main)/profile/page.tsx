'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

type ProfileData = {
  id: string
  name: string | null
  email: string
  role: string
  displayName: string | null
  bio: string | null
  university: string | null
  major: string | null
  avatarUrl: string | null
  image: string | null
}

type MeData = {
  id: string
  name: string | null
  image: string | null
  avatarUrl: string | null
  role: string
}

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

export default function ProfilePage() {
  const [me, setMe] = useState<MeData | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editUniversity, setEditUniversity] = useState('')
  const [editMajor, setEditMajor] = useState('')
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetch('/api/user/me')
        const meData: MeData | null = meRes.ok ? await meRes.json() : null
        if (!meData) return
        setMe(meData)

        const profileRes = await fetch(`/api/user/profile?userId=${meData.id}`)

        const profileData = await profileRes.json()
        if (profileData.profile) {
          const p = profileData.profile as ProfileData
          setProfile(p)
          setEditName(p.displayName ?? p.name ?? '')
          setEditBio(p.bio ?? '')
          setEditUniversity(p.university ?? '')
          setEditMajor(p.major ?? '')
        }
      } catch {
        // non-critical
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  async function handleSave() {
    const userId = me?.id
    if (!userId) return

    const trimmedName = editName.trim()
    if (trimmedName.length > 0 && trimmedName.length < 2) {
      setNameError('Display name must be at least 2 characters')
      return
    }
    if (trimmedName.length > 50) {
      setNameError('Display name must be at most 50 characters')
      return
    }
    setNameError('')
    setSaving(true)

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          displayName: editName || undefined,
          bio: editBio || undefined,
          university: editUniversity || undefined,
          major: editMajor || undefined,
        }),
      })
      const data = (await res.json()) as { profile?: ProfileData; error?: string }
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to save profile')
        return
      }
      if (data.profile) {
        setProfile((prev) => (prev ? { ...prev, ...data.profile } : prev))
      }
      toast.success('Profile saved')
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const displayName = profile?.displayName ?? profile?.name ?? me?.name ?? 'Student'
  const role = profile?.role ?? me?.role ?? null
  const avatarSrc = profile?.avatarUrl ?? me?.avatarUrl ?? me?.image ?? null
  const avatarColor = getAvatarColor(me?.id ?? displayName)

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="text-primary h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-4 py-4 sm:px-6 md:px-12 lg:px-16">
      {/* Header */}
      <div className="border-border mb-8 border-b pb-6">
        <h1 className="text-foreground text-lg font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          This information will appear on your public profile.
        </p>
      </div>

      {/* Form + Avatar — avatar on top on mobile, right column on desktop */}
      <div className="flex flex-col-reverse gap-10 lg:flex-row lg:gap-16">
        {/* Form fields */}
        <div className="min-w-0 flex-1 space-y-6">
          <div>
            <label className="text-foreground mb-1.5 block text-sm font-medium">Display Name</label>
            <input
              value={editName}
              onChange={(e) => {
                setEditName(e.target.value)
                setNameError('')
              }}
              placeholder="Your display name"
              className="border-border bg-card text-foreground focus:ring-ring h-10 w-full rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none"
            />
            {nameError && <p className="mt-1 text-xs text-red-500">{nameError}</p>}
          </div>

          <div>
            <label className="text-foreground mb-1.5 block text-sm font-medium">Bio</label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="Tell others a little about yourself"
              rows={3}
              className="border-border bg-card text-foreground focus:ring-ring w-full resize-none rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-foreground mb-1.5 block text-sm font-medium">University</label>
            <input
              value={editUniversity}
              onChange={(e) => setEditUniversity(e.target.value)}
              placeholder="e.g., BINUS University"
              className="border-border bg-card text-foreground focus:ring-ring h-10 w-full rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-foreground mb-1.5 block text-sm font-medium">Major</label>
            <input
              value={editMajor}
              onChange={(e) => setEditMajor(e.target.value)}
              placeholder="e.g., Computer Science"
              className="border-border bg-card text-foreground focus:ring-ring h-10 w-full rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </div>

        {/* Avatar sidebar */}
        <div className="flex flex-col items-center gap-3 lg:w-52 lg:shrink-0">
          <p className="text-foreground self-start text-sm font-medium lg:self-auto">
            Profile picture
          </p>
          {avatarSrc ? (
            <Image
              src={avatarSrc}
              alt={displayName}
              width={128}
              height={128}
              className="h-32 w-32 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div
              className={`flex h-32 w-32 items-center justify-center rounded-full ${avatarColor}`}
            >
              <span className="text-4xl font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="text-center">
            <p className="text-foreground text-sm font-semibold">{displayName}</p>
            {role && role !== 'STUDENT' && (
              <span className="bg-primary/10 text-primary mt-1 inline-block rounded px-2 py-0.5 text-xs font-semibold">
                {role}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

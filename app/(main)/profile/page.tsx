'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import {
  MapPin,
  GraduationCap,
  PenTool,
  Loader2,
  MessageSquare,
  BookOpen,
  Users,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

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

type StudyGroup = {
  id: string
  name: string
  subject: string
}

type ForumPost = {
  id: string
  title: string
  createdAt: string
}

export default function ProfilePage() {
  const [me, setMe] = useState<MeData | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [forumPostCount, setForumPostCount] = useState(0)
  const [studyGroupCount, setStudyGroupCount] = useState(0)
  const [recentGroups, setRecentGroups] = useState<StudyGroup[]>([])
  const [recentPosts, setRecentPosts] = useState<ForumPost[]>([])
  const [connectionCount, setConnectionCount] = useState(0)
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editUniversity, setEditUniversity] = useState('')
  const [editMajor, setEditMajor] = useState('')
  const [saving, setSaving] = useState(false)
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetch('/api/user/me')
        const meData: MeData | null = meRes.ok ? await meRes.json() : null
        if (!meData) return
        setMe(meData)
        const id = meData.id
        const [profileData, statsData, groupsData, postsData, connectionsData] = await Promise.all([
          fetch(`/api/user/profile?userId=${id}`).then((r) => r.json()),
          fetch(`/api/user/stats?userId=${id}`).then((r) => r.json()),
          fetch(`/api/study-groups?myGroups=true&userId=${id}&limit=3`).then((r) => r.json()),
          fetch(`/api/forums/posts?userId=${id}&limit=5`).then((r) => r.json()),
          fetch(`/api/connections/count?userId=${id}`).then((r) => r.json()),
        ])
        if (profileData.profile) setProfile(profileData.profile as ProfileData)
        if (typeof statsData.forumPostCount === 'number')
          setForumPostCount(statsData.forumPostCount)
        if (typeof statsData.studyGroupCount === 'number')
          setStudyGroupCount(statsData.studyGroupCount)
        if (Array.isArray(groupsData.groups))
          setRecentGroups(groupsData.groups.slice(0, 3) as StudyGroup[])
        if (Array.isArray(postsData.posts))
          setRecentPosts(postsData.posts.slice(0, 5) as ForumPost[])
        if (typeof connectionsData.count === 'number') setConnectionCount(connectionsData.count)
      } catch (err) {
        console.error('[ProfilePage] Failed to load profile data:', err)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  function openEdit() {
    if (!profile) return
    setEditName(profile.displayName ?? profile.name ?? '')
    setEditBio(profile.bio ?? '')
    setEditUniversity(profile.university ?? '')
    setEditMajor(profile.major ?? '')
    setNameError('')
    setEditOpen(true)
  }

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
      setEditOpen(false)
    } catch (err) {
      console.error(err)
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const displayName = profile?.displayName ?? profile?.name ?? me?.name ?? 'Student'
  const university = profile?.university ?? null
  const major = profile?.major ?? null
  const role = profile?.role ?? me?.role ?? null
  const avatarSrc = profile?.avatarUrl ?? me?.avatarUrl ?? me?.image ?? null

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
  const avatarColor = getAvatarColor(me?.id ?? displayName)

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    )
  }

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
                {avatarSrc ? (
                  <Image
                    src={avatarSrc}
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
                    <span className="text-2xl font-bold text-white">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-foreground text-2xl font-bold">{displayName}</h1>
                  {role && role !== 'STUDENT' && (
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold ${
                        role === 'ADMIN'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                      }`}
                    >
                      {role}
                    </span>
                  )}
                </div>
                <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
                  {major && (
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4" />
                      {major}
                    </div>
                  )}
                  {university && (
                    <>
                      <span className="bg-muted-foreground h-1 w-1 rounded-full" />
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {university}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-5"
                onClick={openEdit}
              >
                <PenTool className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: MessageSquare, label: 'Forum Posts', value: forumPostCount },
            { icon: BookOpen, label: 'Study Groups', value: studyGroupCount },
            { icon: Users, label: 'Connections', value: connectionCount },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="border-border bg-card rounded-2xl border p-4 text-center shadow-sm"
            >
              <Icon className="text-primary mx-auto mb-1 h-5 w-5" />
              <p className="text-foreground text-xl font-bold">{value}</p>
              <p className="text-muted-foreground text-xs">{label}</p>
            </div>
          ))}
        </div>

        {/* About */}
        <div className="border-border bg-card rounded-2xl border p-6 shadow-sm">
          <h2 className="text-foreground mb-2 font-semibold">About</h2>
          {profile?.bio ? (
            <p className="text-muted-foreground text-sm leading-relaxed">{profile.bio}</p>
          ) : (
            <p className="text-muted-foreground text-sm italic">
              No bio yet.{' '}
              <button
                className="text-primary underline-offset-2 hover:underline"
                onClick={openEdit}
              >
                Add one
              </button>
            </p>
          )}
        </div>

        {/* Study Groups + Recent Posts */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Study Groups */}
          <div className="border-border bg-card rounded-2xl border p-6 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-foreground font-semibold">
                Study Groups{studyGroupCount > 0 ? ` (${studyGroupCount})` : ''}
              </h2>
              <Link href="/groups" className="text-primary text-xs hover:underline">
                View all
              </Link>
            </div>
            {recentGroups.length > 0 ? (
              <ul className="space-y-2">
                {recentGroups.map((g) => (
                  <li key={g.id} className="flex items-center gap-2">
                    <BookOpen className="text-muted-foreground h-4 w-4 shrink-0" />
                    <div>
                      <p className="text-foreground text-sm font-medium">{g.name}</p>
                      <p className="text-muted-foreground text-xs">{g.subject}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm italic">No groups joined yet.</p>
            )}
          </div>

          {/* Recent Forum Posts */}
          <div className="border-border bg-card rounded-2xl border p-6 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-foreground font-semibold">
                Recent Posts{forumPostCount > 0 ? ` (${forumPostCount})` : ''}
              </h2>
              <Link href="/forums" className="text-primary text-xs hover:underline">
                View all
              </Link>
            </div>
            {recentPosts.length > 0 ? (
              <ul className="space-y-2">
                {recentPosts.map((p) => (
                  <li key={p.id} className="flex items-center gap-2">
                    <MessageSquare className="text-muted-foreground h-4 w-4 shrink-0" />
                    <p className="text-foreground line-clamp-1 text-sm">{p.title}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm italic">No posts yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="border-border bg-card border sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Profile</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update your public profile information.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <div className="space-y-1">
              <label className="text-muted-foreground text-xs">Display Name</label>
              <input
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value)
                  setNameError('')
                }}
                placeholder="Your display name"
                className="border-border bg-muted text-foreground h-10 w-full rounded-lg border px-3 text-sm"
              />
              {nameError && <p className="text-xs text-red-500">{nameError}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground text-xs">University</label>
              <input
                value={editUniversity}
                onChange={(e) => setEditUniversity(e.target.value)}
                placeholder="e.g., BINUS University"
                className="border-border bg-muted text-foreground h-10 w-full rounded-lg border px-3 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground text-xs">Major</label>
              <input
                value={editMajor}
                onChange={(e) => setEditMajor(e.target.value)}
                placeholder="e.g., Computer Science"
                className="border-border bg-muted text-foreground h-10 w-full rounded-lg border px-3 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground text-xs">Bio</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="A short bio about yourself"
                className="border-border bg-muted text-foreground min-h-[80px] w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                className="border-border rounded-lg"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
                onClick={handleSave}
                disabled={saving}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

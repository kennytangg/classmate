'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createElement, useMemo, useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PaginationControls } from '@/components/ui/pagination-controls'
import {
  Users,
  Search,
  Plus,
  ChevronDown,
  ArrowRight,
  FlaskConical,
  BookOpen,
  Code,
  Loader2,
  Crown,
  Database,
  Calculator,
  Brain,
  ShieldCheck,
  GitBranch,
  Terminal,
  Wrench,
  Globe,
  Monitor,
  Atom,
  type LucideIcon,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from 'components/ui/dialog'

type Group = {
  id: string
  name: string
  subject: string
  capacity: number
  desc: string
  isOwner: boolean
}

type ApiGroup = {
  id: string
  name: string
  description: string | null
  subject: string | null
  isPrivate: boolean
  ownerId: string
  _count: { members: number }
}

function mapApiGroup(g: ApiGroup, currentUserId?: string): Group {
  return {
    id: g.id,
    name: g.name,
    subject: g.subject ?? 'General',
    capacity: g._count.members,
    desc: g.description ?? 'No description provided.',
    isOwner: !!currentUserId && g.ownerId === currentUserId,
  }
}

function getSubjectIcon(subject: string): LucideIcon {
  switch (subject) {
    case 'Database':
      return Database
    case 'Mathematics':
      return Calculator
    case 'Machine Learning':
      return Brain
    case 'Security':
      return ShieldCheck
    case 'Algorithms':
      return GitBranch
    case 'Python':
      return Terminal
    case 'Software Engineering':
      return Wrench
    case 'Web Development':
      return Globe
    case 'Computer Science':
      return Monitor
    case 'Data Structures':
      return GitBranch
    case 'Physics':
      return Atom
    case 'Science':
      return FlaskConical
    case 'History':
      return BookOpen
    case 'TypeScript':
      return Code
    default:
      return BookOpen
  }
}

const createSubjects = [
  'Mathematics',
  'Computer Science',
  'Data Structures',
  'Algorithms',
  'Web Development',
  'Database',
  'Machine Learning',
  'Python',
  'Security',
  'Software Engineering',
  'Physics',
  'Science',
  'History',
  'Other',
]
const sortOptions = ['Most Popular', 'Newest', 'Soonest']

export default function StudyGroupsPage() {
  const [discoverGroups, setDiscoverGroups] = useState<Group[]>([])
  const [rawJoinedGroups, setRawJoinedGroups] = useState<ApiGroup[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined)
  const [loadingDiscover, setLoadingDiscover] = useState(true)
  const [loadingJoined, setLoadingJoined] = useState(true)

  const joinedGroups = useMemo(
    () => rawJoinedGroups.map((g) => mapApiGroup(g, currentUserId)),
    [rawJoinedGroups, currentUserId]
  )

  const [discoverPage, setDiscoverPage] = useState(1)
  const [discoverTotalPages, setDiscoverTotalPages] = useState(1)
  const [yourGroupsPage, setYourGroupsPage] = useState(1)
  const [yourGroupsTotalPages, setYourGroupsTotalPages] = useState(1)

  const [query, setQuery] = useState('')
  const [activeSort, setActiveSort] = useState('Most Popular')
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const [formName, setFormName] = useState('')
  const [formSubject, setFormSubject] = useState('Mathematics')
  const [formDesc, setFormDesc] = useState('')
  const [formNameError, setFormNameError] = useState('')

  useEffect(() => {
    fetch('/api/user/me')
      .then((r) => r.json())
      .then((data: { id?: string }) => setCurrentUserId(data.id))
      .catch(() => {})
  }, [])

  useEffect(() => {
    async function fetchDiscover() {
      setLoadingDiscover(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(discoverPage))
        params.set('limit', '12')
        params.set('excludeMyGroups', 'true')
        const res = await fetch(`/api/study-groups?${params.toString()}`)
        const data = await res.json()
        const mapped: Group[] = (data.groups ?? []).map((g: ApiGroup) => mapApiGroup(g))
        setDiscoverGroups(mapped)
        setDiscoverTotalPages(data.meta?.pages ?? 1)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingDiscover(false)
      }
    }
    void fetchDiscover()
  }, [discoverPage])

  useEffect(() => {
    async function fetchYourGroups() {
      setLoadingJoined(true)
      try {
        const params = new URLSearchParams()
        params.set('myGroups', 'true')
        params.set('page', String(yourGroupsPage))
        params.set('limit', '12')
        const res = await fetch(`/api/study-groups?${params.toString()}`)
        const data = await res.json()
        setRawJoinedGroups(data.groups ?? [])
        setYourGroupsTotalPages(data.meta?.pages ?? 1)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingJoined(false)
      }
    }
    void fetchYourGroups()
  }, [yourGroupsPage])

  const joined = useMemo(() => {
    let list = joinedGroups.filter(
      (g) => query.trim().length === 0 || g.name.toLowerCase().includes(query.toLowerCase())
    )
    if (activeSort === 'Most Popular') {
      list = [...list].sort((a, b) => b.capacity - a.capacity)
    } else if (activeSort === 'Newest') {
      list = [...list].reverse()
    }
    return list
  }, [joinedGroups, query, activeSort])

  const discover = useMemo(() => {
    let list = discoverGroups.filter(
      (g) => query.trim().length === 0 || g.name.toLowerCase().includes(query.toLowerCase())
    )
    if (activeSort === 'Most Popular') {
      list = [...list].sort((a, b) => b.capacity - a.capacity)
    } else if (activeSort === 'Newest') {
      list = [...list].reverse()
    }
    return list
  }, [discoverGroups, query, activeSort])

  async function handleCreate() {
    const trimmedName = formName.trim()

    if (trimmedName.length < 2) {
      setFormNameError('Group name must be at least 2 characters')
      return
    } else if (trimmedName.length > 100) {
      setFormNameError('Group name must be at most 100 characters')
      return
    } else {
      setFormNameError('')
    }

    setCreating(true)
    try {
      const res = await fetch('/api/study-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          description: formDesc.trim() || undefined,
          subject: formSubject,
          isPrivate: false,
        }),
      })
      const data = (await res.json()) as { group?: ApiGroup; error?: string }
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to create group')
        return
      }
      if (data.group) {
        const rawGroup: ApiGroup = { ...data.group, _count: { members: 1 } }
        setRawJoinedGroups((prev) => [rawGroup, ...prev])
        toast.success(`"${data.group.name}" created successfully!`)
      }
      setCreateOpen(false)
      setFormName('')
      setFormDesc('')
      setFormSubject('Mathematics')
    } catch (err) {
      console.error(err)
      toast.error('Failed to create group')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="bg-background text-foreground px-4 py-4 sm:px-6 md:px-12 lg:px-16">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Study Groups</h1>
          <p className="text-muted-foreground mt-1">
            Find and join study groups to collaborate with peers.
          </p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-lg sm:w-auto"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Create Group
        </Button>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="border-border bg-card text-foreground flex items-center gap-2 rounded-full border px-3 py-2 text-xs">
                {activeSort}
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {sortOptions.map((opt) => (
                <DropdownMenuItem key={opt} onClick={() => setActiveSort(opt)}>
                  {opt}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="relative flex-1 sm:flex-none">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search groups..."
              className="border-border bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring/40 w-full rounded-lg border py-2 pr-4 pl-10 text-sm focus:ring-2 focus:outline-none sm:w-64"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Your Groups */}
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-foreground text-sm font-semibold">Your Groups</h2>
        {!loadingJoined && joinedGroups.length > 0 && (
          <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-semibold">
            {joinedGroups.length}
          </span>
        )}
      </div>

      {loadingJoined ? (
        <div className="mb-8 flex justify-center py-8">
          <Loader2 className="text-primary h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="mb-6">
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {joined.length === 0 ? (
              <div className="border-border bg-card rounded-xl border border-dashed p-6 text-center">
                <div className="mb-1 font-bold">No groups yet</div>
                <div className="text-muted-foreground mb-3 text-xs">
                  Join a group below to get started.
                </div>
              </div>
            ) : (
              joined.map((g) => <GroupCard key={g.id} g={g} joined />)
            )}
          </div>
          {yourGroupsTotalPages > 1 && (
            <PaginationControls
              currentPage={yourGroupsPage}
              totalPages={yourGroupsTotalPages}
              onPrevious={() => setYourGroupsPage((p) => p - 1)}
              onNext={() => setYourGroupsPage((p) => p + 1)}
              isLoading={loadingJoined}
            />
          )}
        </div>
      )}

      {/* Discover Groups */}
      <div className="mb-3">
        <h2 className="text-foreground text-sm font-semibold">Discover Groups</h2>
        <p className="text-muted-foreground mt-0.5 text-xs">Groups you haven&apos;t joined yet</p>
      </div>

      {loadingDiscover ? (
        <div className="flex justify-center py-8">
          <Loader2 className="text-primary h-5 w-5 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {discover.length === 0 ? (
              <div className="border-border bg-card rounded-xl border border-dashed p-6 text-center">
                <div className="text-muted-foreground text-xs">No groups to discover.</div>
              </div>
            ) : (
              discover.map((g) => <GroupCard key={g.id} g={g} joined={false} />)
            )}
          </div>
          <PaginationControls
            currentPage={discoverPage}
            totalPages={discoverTotalPages}
            onPrevious={() => setDiscoverPage((p) => p - 1)}
            onNext={() => setDiscoverPage((p) => p + 1)}
            isLoading={loadingDiscover}
          />
        </>
      )}

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) {
            setFormNameError('')
          }
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
            <DialogDescription className="text-xs">
              Fill in the details to create your study group.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <div className="space-y-2">
              <label className="text-xs">Group Name</label>
              <input
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value)
                  setFormNameError('')
                }}
                placeholder="e.g., Linear Algebra Study"
                className="border-border bg-card text-foreground placeholder:text-muted-foreground h-10 w-full rounded-lg border px-3 text-sm"
              />
              {formNameError && <p className="text-xs text-red-500">{formNameError}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-xs">Subject</label>
              <select
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                className="border-border bg-card text-foreground h-10 w-full rounded-lg border px-3 text-sm"
              >
                {createSubjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs">Description</label>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Brief description"
                className="border-border bg-card text-foreground placeholder:text-muted-foreground min-h-[80px] w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" className="rounded-lg" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
                disabled={!formName.trim() || creating}
                onClick={handleCreate}
              >
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function GroupCard({ g, joined }: { g: Group; joined: boolean }) {
  const router = useRouter()

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border transition-shadow hover:shadow-md ${
        joined ? 'border-primary/30 bg-primary/5 dark:bg-primary/10' : 'border-border bg-card'
      }`}
    >
      {/* Banner */}
      <div className={`relative h-20 flex-shrink-0 ${joined ? 'bg-primary' : 'bg-muted'}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#ffffff22_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="absolute top-1/2 left-4 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm">
          {createElement(getSubjectIcon(g.subject), {
            className: `h-5 w-5 ${joined ? 'text-white' : 'text-muted-foreground'}`,
          })}
        </div>
        {joined && g.isOwner && (
          <div className="absolute top-2.5 right-3 flex items-center gap-1 rounded-full border border-white/20 bg-white/15 px-2 py-0.5 backdrop-blur-sm">
            <Crown className="h-2.5 w-2.5 text-white" />
            <span className="text-[10px] font-semibold text-white">OWNER</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex-1">
          <div className="mb-1">
            <span className="text-muted-foreground text-[10px] font-bold tracking-wider">
              {g.subject.toUpperCase()}
            </span>
          </div>
          <h3 className="text-foreground mb-1 leading-tight font-semibold">{g.name}</h3>
          <p className="text-muted-foreground mb-3 line-clamp-2 text-xs">{g.desc}</p>
        </div>

        {/* Member count */}
        <div className="mb-3">
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <Users className="h-3 w-3" />
            {g.capacity} member{g.capacity !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Action */}
        {joined ? (
          <Link href={`/groups/${g.id}`}>
            <button className="bg-primary text-primary-foreground hover:bg-primary/90 flex h-9 w-full items-center justify-center rounded-lg text-sm font-semibold transition-colors">
              Open Group <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </button>
          </Link>
        ) : (
          <button
            onClick={() => router.push(`/groups/${g.id}`)}
            className="border-primary text-primary hover:bg-primary/10 flex h-9 w-full items-center justify-center rounded-lg border bg-transparent text-sm font-semibold transition-colors"
          >
            View Group <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

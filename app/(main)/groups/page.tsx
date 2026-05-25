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
  ArrowRight,
  ChevronRight,
  FlaskConical,
  BookOpen,
  Loader2,
  Crown,
  Calculator,
  Brain,
  ShieldCheck,
  Wrench,
  Globe,
  Monitor,
  Lock,
  KeyRound,
  Languages,
  Landmark,
  Palette,
  type LucideIcon,
} from 'lucide-react'
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
  isPrivate: boolean
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

type FilterTab = 'discover' | 'joined'
type SortOption = 'most-popular' | 'newest'

function mapApiGroup(g: ApiGroup, currentUserId?: string): Group {
  return {
    id: g.id,
    name: g.name,
    subject: g.subject ?? 'General',
    capacity: g._count.members,
    desc: g.description ?? 'No description provided.',
    isOwner: !!currentUserId && g.ownerId === currentUserId,
    isPrivate: g.isPrivate,
  }
}

function getSubjectIcon(subject: string): LucideIcon {
  switch (subject) {
    case 'Mathematics':
      return Calculator
    case 'Sciences':
      return FlaskConical
    case 'Computer Science':
      return Monitor
    case 'Engineering':
      return Wrench
    case 'Humanities & Languages':
      return Languages
    case 'History & Social Studies':
      return Landmark
    case 'Literature & Arts':
      return Palette
    case 'Economics & Business':
      return Globe
    case 'Law':
      return ShieldCheck
    case 'Health & Medicine':
      return Brain
    default:
      return BookOpen
  }
}

const createSubjects = [
  'Mathematics',
  'Sciences',
  'Computer Science',
  'Engineering',
  'Humanities & Languages',
  'History & Social Studies',
  'Literature & Arts',
  'Economics & Business',
  'Law',
  'Health & Medicine',
  'Other',
]

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'most-popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest' },
]

const tabs: { key: FilterTab; label: string }[] = [
  { key: 'joined', label: 'Joined' },
  { key: 'discover', label: 'Discover' },
]

export default function StudyGroupsPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [rawGroups, setRawGroups] = useState<ApiGroup[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterTab>('joined')
  const [activeSort, setActiveSort] = useState<SortOption>('most-popular')
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const [formName, setFormName] = useState('')
  const [formSubject, setFormSubject] = useState('Mathematics')
  const [formDesc, setFormDesc] = useState('')
  const [formIsPrivate, setFormIsPrivate] = useState(false)
  const [formNameError, setFormNameError] = useState('')

  const [joinCodeOpen, setJoinCodeOpen] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinCodeError, setJoinCodeError] = useState('')
  const [joiningByCode, setJoiningByCode] = useState(false)

  useEffect(() => {
    fetch('/api/user/me')
      .then((r) => r.json())
      .then((data: { id?: string }) => setCurrentUserId(data.id))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    async function fetchGroups() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', '12')
        if (activeFilter === 'discover') params.set('excludeMyGroups', 'true')
        if (activeFilter === 'joined') params.set('myGroups', 'true')
        if (debouncedQuery) params.set('search', debouncedQuery)
        const res = await fetch(`/api/study-groups?${params.toString()}`)
        const data = await res.json()
        setRawGroups(data.groups ?? [])
        setTotalPages(data.meta?.pages ?? 1)
      } catch {
        // non-critical fetch failure — silently skip
      } finally {
        setLoading(false)
      }
    }
    void fetchGroups()
  }, [page, debouncedQuery, activeFilter])

  useEffect(() => {
    setGroups(rawGroups.map((g) => mapApiGroup(g, currentUserId)))
  }, [rawGroups, currentUserId])

  const sortedGroups = useMemo(() => {
    const list = [...groups]
    if (activeSort === 'most-popular') return list.sort((a, b) => b.capacity - a.capacity)
    if (activeSort === 'newest') return list.reverse()
    return list
  }, [groups, activeSort])

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
          isPrivate: formIsPrivate,
        }),
      })
      const data = (await res.json()) as { group?: ApiGroup; error?: string }
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to create group')
        return
      }
      if (data.group) {
        toast.success(`"${data.group.name}" created successfully!`)
        setActiveFilter('joined')
        setPage(1)
      }
      setCreateOpen(false)
      setFormName('')
      setFormDesc('')
      setFormSubject('Mathematics')
      setFormIsPrivate(false)
    } catch {
      toast.error('Failed to create group')
    } finally {
      setCreating(false)
    }
  }

  async function handleJoinByCode() {
    const code = joinCode.trim().toUpperCase()
    if (!code) return
    setJoiningByCode(true)
    setJoinCodeError('')
    try {
      const res = await fetch('/api/study-groups/join-by-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: code }),
      })
      const data = (await res.json()) as { groupId?: string; error?: string }
      if (!res.ok) {
        if (res.status === 400 && data.groupId) {
          // Already a member — just navigate there
          router.push(`/groups/${data.groupId}`)
          return
        }
        setJoinCodeError(data.error ?? 'Invalid invite code')
        return
      }
      toast.success('Joined group!')
      router.push(`/groups/${data.groupId}`)
    } catch {
      setJoinCodeError('Something went wrong. Please try again.')
    } finally {
      setJoiningByCode(false)
    }
  }

  return (
    <div className="bg-background text-foreground px-4 py-4 sm:px-6 md:px-12 lg:px-16">
      {/* Header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-foreground text-lg font-bold">Study Groups</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Find and join study groups to collaborate with peers.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or subject..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-border bg-card text-foreground focus:ring-ring w-full rounded-lg border py-2 pr-4 pl-9 text-sm focus:ring-2 focus:outline-none"
            />
          </div>
          <Button
            variant="outline"
            className="w-full rounded-lg sm:w-auto"
            onClick={() => setJoinCodeOpen(true)}
          >
            <KeyRound className="mr-2 h-4 w-4" /> Join with Code
          </Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-lg sm:w-auto"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Create Group
          </Button>
        </div>
      </div>

      {/* Filter tabs + sort */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="border-border flex gap-1 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveFilter(tab.key)
                setPage(1)
              }}
              className={`-mb-px border-b-2 px-4 pb-3 text-sm font-medium transition-colors ${
                activeFilter === tab.key
                  ? 'border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <select
          className="border-border bg-card text-foreground focus:border-ring focus:ring-ring rounded-md text-sm"
          value={activeSort}
          onChange={(e) => {
            setActiveSort(e.target.value as SortOption)
            setPage(1)
          }}
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Discover info note */}
      {activeFilter === 'discover' && (
        <p className="text-muted-foreground mb-4 text-xs">
          Private groups are not listed here. Use an invite code to join one.
        </p>
      )}

      {/* Groups list / grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="text-primary h-5 w-5 animate-spin" />
        </div>
      ) : sortedGroups.length === 0 ? (
        <div className="border-border bg-card rounded-xl border border-dashed p-10 text-center">
          <div className="text-foreground mb-1 text-sm font-semibold">
            {activeFilter === 'joined' ? 'No groups joined yet' : 'No groups found'}
          </div>
          <div className="text-muted-foreground text-xs">
            {activeFilter === 'joined'
              ? 'Switch to Discover to find groups to join.'
              : query
                ? 'Try different keywords or clear the search.'
                : 'No groups available right now.'}
          </div>
        </div>
      ) : activeFilter === 'joined' ? (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {sortedGroups.map((g) => (
            <GroupListRow key={g.id} g={g} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedGroups.map((g) => (
            <GroupCard key={g.id} g={g} />
          ))}
        </div>
      )}

      {!loading && (
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          onPrevious={() => setPage((p) => p - 1)}
          onNext={() => setPage((p) => p + 1)}
          isLoading={loading}
        />
      )}

      <Dialog
        open={joinCodeOpen}
        onOpenChange={(open) => {
          setJoinCodeOpen(open)
          if (!open) {
            setJoinCode('')
            setJoinCodeError('')
          }
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Join with Invite Code</DialogTitle>
            <DialogDescription className="text-xs">
              Enter the 6-character code shared by the group owner. Invite codes are only used for
              private groups.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-3">
            <input
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase())
                setJoinCodeError('')
              }}
              placeholder="e.g. A3F9C2"
              maxLength={6}
              className="border-border bg-card text-foreground placeholder:text-muted-foreground h-10 w-full rounded-lg border px-3 font-mono text-sm tracking-widest"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleJoinByCode()
              }}
            />
            {joinCodeError && <p className="text-xs text-red-500">{joinCodeError}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                className="rounded-lg"
                onClick={() => setJoinCodeOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
                disabled={!joinCode.trim() || joiningByCode}
                onClick={() => void handleJoinByCode()}
              >
                {joiningByCode && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Join
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
              <label htmlFor="form-group-name" className="text-xs">
                Group Name
              </label>
              <input
                id="form-group-name"
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
              <label htmlFor="form-group-subject" className="text-xs">
                Subject
              </label>
              <select
                id="form-group-subject"
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
              <label htmlFor="form-group-desc" className="text-xs">
                Description
              </label>
              <textarea
                id="form-group-desc"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Brief description"
                className="border-border bg-card text-foreground placeholder:text-muted-foreground min-h-[80px] w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <div className="border-border bg-muted/40 flex items-center justify-between rounded-lg border px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">Private group</p>
                  <p className="text-muted-foreground text-xs">
                    Only members with the invite code can join
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formIsPrivate}
                  onClick={() => setFormIsPrivate((v) => !v)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                    formIsPrivate ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      formIsPrivate ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-muted-foreground px-1 text-xs">
                This cannot be changed after the group is created.
              </p>
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

function GroupListRow({ g }: { g: Group }) {
  return (
    <Link href={`/groups/${g.id}`}>
      <div className="border-border hover:bg-muted/40 flex items-center gap-4 rounded-xl border px-5 py-3.5 transition-colors">
        <div className="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          {createElement(getSubjectIcon(g.subject), { className: 'h-4 w-4 text-primary' })}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-foreground truncate text-sm font-semibold">{g.name}</span>
            {g.isOwner && <Crown className="h-3 w-3 shrink-0 text-amber-500" />}
            {g.isPrivate && <Lock className="text-muted-foreground h-3 w-3 shrink-0" />}
          </div>
          <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
            <span>{g.subject}</span>
            <span className="text-muted-foreground/40">·</span>
            <Users className="h-3 w-3" />
            <span>{g.capacity}</span>
          </div>
        </div>
        <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
      </div>
    </Link>
  )
}

function GroupCard({ g }: { g: Group }) {
  const router = useRouter()

  return (
    <div className="border-border bg-card flex flex-col overflow-hidden rounded-xl border transition-shadow hover:shadow-md">
      {/* Banner */}
      <div className="bg-muted relative h-16 flex-shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#ffffff22_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="absolute top-1/2 left-4 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm">
          {createElement(getSubjectIcon(g.subject), {
            className: 'h-4 w-4 text-muted-foreground',
          })}
        </div>
        {g.isPrivate && (
          <div className="border-border bg-card/80 absolute top-2 right-3 flex items-center gap-1 rounded-full border px-2 py-0.5 backdrop-blur-sm">
            <Lock className="text-muted-foreground h-2.5 w-2.5" />
            <span className="text-muted-foreground text-[10px] font-semibold">PRIVATE</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex-1">
          <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            {g.subject}
          </span>
          <h3 className="text-foreground mt-0.5 mb-1 text-sm leading-tight font-semibold">
            {g.name}
          </h3>
          <p className="text-muted-foreground mb-3 line-clamp-2 text-xs">{g.desc}</p>
        </div>
        <div className="mb-3">
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <Users className="h-3 w-3" />
            {g.capacity} member{g.capacity !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={() => router.push(`/groups/${g.id}`)}
          className="border-primary text-primary hover:bg-primary/10 flex h-9 w-full items-center justify-center rounded-lg border bg-transparent text-sm font-semibold transition-colors"
        >
          View Group <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

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
      return BookOpen
    case 'History & Social Studies':
      return BookOpen
    case 'Literature & Arts':
      return BookOpen
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
  { key: 'discover', label: 'Discover' },
  { key: 'joined', label: 'Joined' },
]

export default function StudyGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [rawGroups, setRawGroups] = useState<ApiGroup[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterTab>('discover')
  const [activeSort, setActiveSort] = useState<SortOption>('most-popular')
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
      } catch (err) {
        console.error(err)
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
          isPrivate: false,
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
    } catch (err) {
      console.error(err)
      toast.error('Failed to create group')
    } finally {
      setCreating(false)
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

      {/* Groups grid */}
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
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedGroups.map((g) => (
            <GroupCard key={g.id} g={g} joined={activeFilter === 'joined'} />
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
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              {g.subject}
            </span>
          </div>
          <h3 className="text-foreground mb-1 text-sm leading-tight font-semibold">{g.name}</h3>
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

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ForumCard } from './ForumCard'
import { CreatePostModal } from './CreatePostModal'
import { Loader2, AlertCircle, MessageSquarePlus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { formatDate } from '@/lib/format'

const PAGE_LIMIT = 10

type FilterTab = 'all' | 'active' | 'unanswered'

interface ForumPost {
  id: string
  title: string
  content: string
  views: number
  upvotes: number
  hasUpvoted: boolean
  createdAt: string
  user: {
    id: string
    email: string
    name?: string | null
    profile?: {
      displayName?: string | null
      major?: string | null
    } | null
  }
  _count: {
    replies: number
  }
}

interface RecommendedThread {
  id: string
  title: string
  reason: string
}

export function ForumList() {
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [recommendations, setRecommendations] = useState<RecommendedThread[]>([])
  const [recommendationsLoading, setRecommendationsLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function fetchPosts() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', String(PAGE_LIMIT))
        if (activeTab === 'active') params.set('hasReplies', 'true')
        if (activeTab === 'unanswered') params.set('hasReplies', 'false')
        if (searchQuery) params.set('search', searchQuery)

        const response = await fetch(`/api/forums/posts?${params.toString()}`)

        if (!response.ok) {
          throw new Error('Failed to fetch posts')
        }

        const data = (await response.json()) as {
          posts: ForumPost[]
          meta: { pages: number }
        }
        if (!cancelled) {
          setPosts(data.posts ?? [])
          setTotalPages(data.meta?.pages ?? 1)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load posts')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (searchQuery) {
      const timer = setTimeout(fetchPosts, 300)
      return () => {
        cancelled = true
        clearTimeout(timer)
      }
    }

    fetchPosts()
    return () => {
      cancelled = true
    }
  }, [page, activeTab, searchQuery, refreshKey])

  useEffect(() => {
    async function fetchRecommendations() {
      setRecommendationsLoading(true)
      try {
        const response = await fetch('/api/recommendations/threads')
        const data = (await response.json()) as {
          recommendations?: RecommendedThread[]
          error?: string
        }
        setRecommendations(data.recommendations ?? [])
      } catch {
        // silently skip — recommendations are non-critical
      } finally {
        setRecommendationsLoading(false)
      }
    }

    fetchRecommendations()
  }, [])

  const recommendationMap = new Map(recommendations.map((r) => [r.id, r.reason]))

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'unanswered', label: 'Unanswered' },
  ]

  const emptyState = (() => {
    if (searchQuery)
      return { title: 'No results for that search', sub: 'Try different keywords.', cta: false }
    if (activeTab === 'unanswered')
      return {
        title: 'Every question has been answered',
        sub: 'Check back later or ask something new.',
        cta: true,
      }
    if (activeTab === 'active')
      return {
        title: 'No active discussions yet',
        sub: 'Be the first to ask a question.',
        cta: true,
      }
    return { title: 'No discussions yet', sub: 'Be the first to ask a question.', cta: true }
  })()

  const showSidebar = recommendationsLoading || recommendations.length > 0

  return (
    <div>
      <CreatePostModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      {/* Header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h2 className="text-foreground text-lg font-semibold">Discussions</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Ask questions and get answers — everything stays searchable for everyone.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="border-border bg-card text-foreground focus:ring-ring w-full rounded-lg border py-2 pr-4 pl-9 text-sm focus:ring-2 focus:outline-none"
            />
          </div>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-lg sm:w-auto"
          >
            <MessageSquarePlus className="mr-2 h-4 w-4" /> Ask a Question
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="border-border mb-6 flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key)
              setPage(1)
            }}
            className={`-mb-px border-b-2 px-4 pb-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content: posts (left/main) + recommendations sidebar (right) */}
      <div className={`flex flex-col gap-6 ${showSidebar ? 'lg:flex-row' : ''}`}>
        {/* Posts — main column */}
        <div className="min-w-0 flex-1">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
              <span className="text-muted-foreground ml-3">Loading discussions...</span>
            </div>
          )}

          {error && !loading && (
            <div className="border-semantic-error/30 bg-semantic-error/10 flex flex-col items-center justify-center rounded-xl border py-12">
              <AlertCircle className="text-semantic-error h-12 w-12" />
              <p className="text-semantic-error mt-4 text-lg font-normal">{error}</p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          )}

          {!loading && !error && posts.length === 0 && (
            <div className="border-border bg-muted flex flex-col items-center justify-center rounded-xl border py-16">
              <MessageSquarePlus className="text-muted-foreground h-12 w-12" />
              <p className="text-foreground mt-4 text-lg font-semibold">{emptyState.title}</p>
              <p className="text-muted-foreground mt-1 text-sm">{emptyState.sub}</p>
              {emptyState.cta && (
                <Button
                  onClick={() => setCreateModalOpen(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 mt-5"
                >
                  Ask a Question
                </Button>
              )}
            </div>
          )}

          {!loading && !error && posts.length > 0 && (
            <div>
              {posts.map((post) => (
                <ForumCard
                  key={post.id}
                  id={post.id}
                  title={post.title}
                  content={post.content}
                  author={
                    post.user.profile?.displayName ??
                    post.user.name ??
                    post.user.email.split('@')[0] ??
                    'Anonymous'
                  }
                  replies={post._count.replies}
                  views={post.views}
                  upvotes={post.upvotes}
                  hasUpvoted={post.hasUpvoted}
                  createdAt={formatDate(post.createdAt)}
                  isRecommended={recommendationMap.has(post.id)}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              onPrevious={() => setPage((p) => p - 1)}
              onNext={() => setPage((p) => p + 1)}
              isLoading={loading}
            />
          )}
        </div>

        {/* Recommendations sidebar — right, only when there's something to show */}
        {showSidebar && (
          <aside className="w-full lg:w-64 lg:shrink-0">
            <div className="border-border bg-background sticky top-4 rounded-xl border p-4">
              <h3 className="text-foreground mb-3 text-sm font-semibold">Trending discussions</h3>

              {recommendationsLoading && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-muted h-8 animate-pulse rounded" />
                  ))}
                </div>
              )}

              {!recommendationsLoading && recommendations.length > 0 && (
                <div className="space-y-0.5">
                  {recommendations.slice(0, 5).map((rec, index) => (
                    <Link
                      key={rec.id}
                      href={`/forums/${rec.id}`}
                      className="group -mx-2 flex items-start gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-black/5 dark:hover:bg-white/[0.04]"
                    >
                      <span className="text-muted-foreground/50 w-4 shrink-0 pt-0.5 text-xs tabular-nums">
                        {index + 1}
                      </span>
                      <p className="text-foreground/70 group-hover:text-foreground line-clamp-2 flex-1 text-xs leading-snug transition-colors">
                        {rec.title}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

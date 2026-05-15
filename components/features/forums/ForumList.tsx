'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ForumCard } from './ForumCard'
import { Loader2, AlertCircle, MessageSquarePlus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { formatDate } from '@/lib/format'

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
    profile?: {
      displayName?: string | null
      major?: string | null
    } | null
  }
  tags: { id: string; name: string }[]
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
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', '10')
        const response = await fetch(`/api/forums/posts?${params.toString()}`)

        if (!response.ok) {
          throw new Error('Failed to fetch posts')
        }

        const data = (await response.json()) as {
          posts: ForumPost[]
          meta: { pages: number }
        }
        setPosts(data.posts ?? [])
        setTotalPages(data.meta?.pages ?? 1)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load posts')
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [page])

  useEffect(() => {
    async function fetchRecommendations() {
      setRecommendationsLoading(true)
      setRecommendationsError(null)
      try {
        const response = await fetch('/api/recommendations/threads')
        const data = (await response.json()) as {
          recommendations?: RecommendedThread[]
          error?: string
        }

        if (!response.ok) {
          throw new Error(data.error ?? 'Failed to load recommendations')
        }

        setRecommendations(data.recommendations ?? [])
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load recommendations'
        setRecommendationsError(message)
      } finally {
        setRecommendationsLoading(false)
      }
    }

    fetchRecommendations()
  }, [])

  const filteredPosts = posts.filter((post) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      post.title.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query) ||
      post.tags.some((tag) => tag.name.toLowerCase().includes(query))
    )
  })

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h2 className="text-foreground text-2xl font-bold">Discussion Forums</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Ask questions, discuss topics, and share knowledge with your classmates.
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
          <Link href="/forums/create" className="w-full sm:w-auto">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-lg sm:w-auto">
              <MessageSquarePlus className="mr-2 h-4 w-4" /> New Discussion
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-6 lg:flex-row">
        {/* Recommended Threads — below on mobile, left column on desktop */}
        <div className="w-full lg:w-1/4 lg:shrink-0">
          <div className="border-border bg-card rounded-xl border p-4">
            <h3 className="text-foreground text-sm font-semibold">Recommended Threads</h3>
            {recommendationsLoading && (
              <div className="text-muted-foreground mt-3 flex items-center text-sm">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
              </div>
            )}

            {!recommendationsLoading && recommendationsError && (
              <p className="text-semantic-error mt-3 text-sm">{recommendationsError}</p>
            )}

            {!recommendationsLoading && !recommendationsError && recommendations.length === 0 && (
              <p className="text-muted-foreground mt-3 text-sm">
                No recommendations yet. Start posting to personalize this list.
              </p>
            )}

            {!recommendationsLoading && !recommendationsError && recommendations.length > 0 && (
              <div className="mt-3 space-y-2">
                {recommendations.slice(0, 5).map((recommendation) => (
                  <Link
                    key={recommendation.id}
                    href={`/forums/${recommendation.id}`}
                    className="border-border hover:border-primary block rounded-lg border px-3 py-2 transition-colors"
                  >
                    <p className="text-foreground text-sm font-medium">{recommendation.title}</p>
                    <p className="text-muted-foreground text-xs">{recommendation.reason}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Forum Posts — top on mobile, right column on desktop */}
        <div className="w-full lg:w-3/4">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
              <span className="text-muted-foreground ml-3">Loading discussions...</span>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="border-semantic-error/30 bg-semantic-error/10 flex flex-col items-center justify-center rounded-xl border py-12">
              <AlertCircle className="text-semantic-error h-12 w-12" />
              <p className="text-semantic-error mt-4 text-lg font-medium">{error}</p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredPosts.length === 0 && (
            <div className="border-border bg-muted flex flex-col items-center justify-center rounded-xl border py-12">
              <MessageSquarePlus className="text-muted-foreground h-12 w-12" />
              <p className="text-foreground mt-4 text-lg font-medium">
                {searchQuery
                  ? 'No discussions match your search'
                  : page > 1
                    ? 'No discussions on this page'
                    : 'No discussions yet'}
              </p>
              <p className="text-muted-foreground mt-2 text-sm">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Be the first to start a discussion!'}
              </p>
              {!searchQuery && (
                <Link href="/forums/create">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4">
                    Start a Discussion
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* Posts List */}
          {!loading && !error && filteredPosts.length > 0 && (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <ForumCard
                  key={post.id}
                  id={post.id}
                  title={post.title}
                  author={
                    post.user.profile?.displayName ?? post.user.email.split('@')[0] ?? 'Anonymous'
                  }
                  replies={post._count.replies}
                  views={post.views}
                  upvotes={post.upvotes}
                  hasUpvoted={post.hasUpvoted}
                  tags={post.tags.map((t) => t.name)}
                  createdAt={formatDate(post.createdAt)}
                />
              ))}
            </div>
          )}

          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            onPrevious={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
            isLoading={loading}
          />
        </div>
      </div>
    </div>
  )
}

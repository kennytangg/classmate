'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { MaterialCard } from 'components/features/materials/MaterialCard'
import { Search, Filter, Upload } from 'lucide-react'

interface MaterialApiItem {
  id: string
  title: string
  description: string | null
  fileUrl: string
  subject: string
  fileType: string | null
  downloads: number
  createdAt: string
  user: {
    email: string
    profile: {
      displayName: string | null
    } | null
  }
}

type SortOption = 'downloads' | 'createdAt'

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'downloads', label: 'Most Popular' },
  { value: 'createdAt', label: 'Newest First' },
]

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<MaterialApiItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('All Subjects')
  const [sortBy, setSortBy] = useState<SortOption>('downloads')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  async function loadMaterials(
    activeSortBy: SortOption,
    activeSubject: string,
    activePage: number
  ) {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('sortBy', activeSortBy)
      params.set('page', String(activePage))
      params.set('limit', '10')
      if (activeSubject && activeSubject !== 'All Subjects') {
        params.set('subject', activeSubject)
      }

      const response = await fetch(`/api/materials?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to load materials')
      }

      const data = (await response.json()) as {
        materials: MaterialApiItem[]
        meta: { pages: number }
      }
      setMaterials(Array.isArray(data.materials) ? data.materials : [])
      setTotalPages(data.meta?.pages ?? 1)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load materials')
      setMaterials([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadMaterials(sortBy, selectedSubject, page)
  }, [sortBy, selectedSubject, page])

  const filteredMaterials = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim()

    return materials.filter((material) => {
      return (
        !normalizedSearch ||
        material.title.toLowerCase().includes(normalizedSearch) ||
        material.subject.toLowerCase().includes(normalizedSearch) ||
        (material.description ?? '').toLowerCase().includes(normalizedSearch)
      )
    })
  }, [materials, search])

  async function handleDownload(materialId: number | string) {
    const response = await fetch(`/api/materials/${materialId}/download`, {
      method: 'POST',
    })

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string }
      setError(data.error ?? 'Unable to download this material right now.')
      return
    }

    const blob = await response.blob()
    const contentDisposition = response.headers.get('Content-Disposition') ?? ''
    const filenameMatch = contentDisposition.match(/filename="([^"]+)"/)
    const filename = filenameMatch?.[1] ? decodeURIComponent(filenameMatch[1]) : 'download'

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)

    setMaterials((current) =>
      current.map((item) =>
        item.id === String(materialId) ? { ...item, downloads: item.downloads + 1 } : item
      )
    )
  }

  const dynamicSubjects = Array.from(new Set(materials.map((material) => material.subject))).sort()

  return (
    <div className="px-4 py-4 sm:px-6 md:px-12 lg:px-16">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-foreground text-lg font-bold">Study Materials</h1>
          <p className="text-muted-foreground mt-1">
            Share and discover resources to boost your learning.
          </p>
        </div>
        <Link href="/materials/upload" className="w-full sm:w-auto">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-lg sm:w-auto">
            <Upload className="mr-2 h-4 w-4" />
            Upload Material
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Sidebar Filters — below content on mobile, left column on desktop */}
        <div className="order-2 space-y-6 lg:order-1 lg:col-span-1">
          <div className="border-border bg-card rounded-xl border p-5 shadow-sm">
            <div className="relative mb-4">
              <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
              <input
                type="text"
                placeholder="Search resources..."
                className="border-border bg-card text-foreground focus:ring-ring placeholder:text-muted-foreground w-full rounded-lg border py-2 pr-4 pl-9 text-sm focus:ring-2 focus:outline-none"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-foreground mb-3 flex items-center font-semibold">
                  <Filter className="mr-2 h-4 w-4" />
                  Subject
                </h3>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {['All Subjects', ...dynamicSubjects].map((subject) => (
                    <div key={subject} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="subject"
                        id={`subject-${subject}`}
                        className="border-border text-primary focus:ring-ring rounded"
                        checked={selectedSubject === subject}
                        onChange={() => {
                          setSelectedSubject(subject)
                          setPage(1)
                        }}
                      />
                      <label
                        htmlFor={`subject-${subject}`}
                        className="text-foreground cursor-pointer text-sm select-none"
                      >
                        {subject}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Materials Grid */}
        <div className="order-1 lg:order-2 lg:col-span-3">
          <div className="border-border bg-card mb-6 flex items-center justify-between rounded-lg border p-4 shadow-sm">
            <div className="text-muted-foreground text-sm">
              Showing{' '}
              <span className="text-foreground font-medium">{filteredMaterials.length}</span>{' '}
              resources
            </div>
            <select
              className="border-border bg-card text-foreground focus:border-ring focus:ring-ring rounded-md text-sm"
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value as SortOption)
                setPage(1)
              }}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {loading && (
            <div className="border-border bg-card text-muted-foreground rounded-lg border p-6 text-sm">
              Loading materials...
            </div>
          )}

          {!loading && error && (
            <div className="border-semantic-error/30 bg-semantic-error/10 text-semantic-error rounded-lg border p-6 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && filteredMaterials.length === 0 && (
            <div className="border-border bg-card text-muted-foreground rounded-lg border p-6 text-sm">
              {page > 1
                ? 'No materials on this page.'
                : 'No materials found for the current filters.'}
            </div>
          )}

          {!loading && !error && filteredMaterials.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredMaterials.map((material) => (
                <MaterialCard
                  key={material.id}
                  id={material.id}
                  title={material.title}
                  author={material.user.profile?.displayName || material.user.email}
                  subject={material.subject}
                  type={(material.fileType || 'unknown').toUpperCase()}
                  downloads={material.downloads}
                  uploadedAt={formatDistanceToNow(new Date(material.createdAt), {
                    addSuffix: true,
                  })}
                  onDownload={handleDownload}
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

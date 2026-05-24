'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { MaterialCard } from 'components/features/materials/MaterialCard'
import { EditMaterialModal } from 'components/features/materials/EditMaterialModal'
import { MaterialPreviewModal } from 'components/features/materials/MaterialPreviewModal'
import { UploadMaterialModal } from 'components/features/materials/UploadMaterialModal'
import { Search, Upload, Loader2, AlertCircle, BookOpen } from 'lucide-react'

interface MaterialApiItem {
  id: string
  title: string
  fileUrl: string
  fileType: string | null
  fileSize: number | null
  downloads: number
  createdAt: string
  user: {
    id: string
    name: string | null
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
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [mineOnly, setMineOnly] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('downloads')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [previewMaterial, setPreviewMaterial] = useState<MaterialApiItem | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [editingMaterial, setEditingMaterial] = useState<MaterialApiItem | null>(null)

  useEffect(() => {
    fetch('/api/user/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { id?: string; role?: string } | null) => {
        if (data?.id) setCurrentUserId(data.id)
        if (data?.role) setCurrentUserRole(data.role)
      })
      .catch(() => null)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  async function loadMaterials(
    activeSortBy: SortOption,
    activePage: number,
    activeSearch: string,
    activeMine: boolean,
    userId: string | null
  ) {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('sortBy', activeSortBy)
      params.set('page', String(activePage))
      params.set('limit', '10')
      if (activeSearch) params.set('search', activeSearch)
      if (activeMine && userId) params.set('userId', userId)

      const response = await fetch(`/api/materials?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to load materials')

      const data = (await response.json()) as {
        materials: MaterialApiItem[]
        meta: { total: number; pages: number }
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
    void loadMaterials(sortBy, page, debouncedSearch, mineOnly, currentUserId)
  }, [sortBy, page, debouncedSearch, mineOnly, currentUserId, refreshKey])

  async function handleDownload(materialId: number | string) {
    const response = await fetch(`/api/materials/${materialId}/download`, { method: 'POST' })

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

  function handleEditSuccess(id: string, updates: { title: string }) {
    setMaterials((current) =>
      current.map((item) => (item.id === id ? { ...item, ...updates } : item))
    )
    setPreviewMaterial((prev) => (prev?.id === id ? { ...prev, ...updates } : prev))
  }

  async function handleDelete(materialId: number | string) {
    const id = String(materialId)
    setMaterials((current) => current.filter((item) => item.id !== id))
    setPreviewMaterial((prev) => (prev?.id === id ? null : prev))

    const response = await fetch(`/api/materials/${id}`, { method: 'DELETE' })
    if (!response.ok) {
      toast.error('Failed to delete material.')
      void loadMaterials(sortBy, page, debouncedSearch, mineOnly, currentUserId)
    } else {
      toast.success('Material deleted.')
    }
  }

  return (
    <div className="px-4 py-4 sm:px-6 md:px-12 lg:px-16">
      {/* Header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-foreground text-lg font-bold">Study Materials</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Share and discover resources to boost your learning.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-border bg-card text-foreground focus:ring-ring w-full rounded-lg border py-2 pr-4 pl-9 text-sm focus:ring-2 focus:outline-none"
            />
          </div>
          <Button
            onClick={() => setUploadModalOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-lg sm:w-auto"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Material
          </Button>
        </div>
      </div>

      {/* Filter tabs + sort */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="border-border flex gap-1 border-b">
          <button
            onClick={() => {
              setMineOnly(false)
              setPage(1)
            }}
            className={`-mb-px border-b-2 px-4 pb-3 text-sm font-medium transition-colors ${
              !mineOnly
                ? 'border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            }`}
          >
            All
          </button>
          <button
            onClick={() => {
              setMineOnly(true)
              setPage(1)
            }}
            className={`-mb-px border-b-2 px-4 pb-3 text-sm font-medium transition-colors ${
              mineOnly
                ? 'border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            }`}
          >
            My Uploads
          </button>
        </div>
        <select
          className="border-border bg-card text-foreground focus:border-ring focus:ring-ring rounded-md text-sm"
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value as SortOption)
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

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <span className="text-muted-foreground ml-3 text-sm">Loading materials...</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="border-semantic-error/30 bg-semantic-error/10 flex flex-col items-center justify-center rounded-xl border py-12">
          <AlertCircle className="text-semantic-error h-10 w-10" />
          <p className="text-semantic-error mt-4 text-sm">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && materials.length === 0 && (
        <div className="border-border flex flex-col items-center justify-center rounded-xl border py-16">
          <BookOpen className="text-muted-foreground h-10 w-10" />
          <p className="text-foreground mt-4 text-sm font-semibold">No materials found</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {search
              ? 'Try different keywords or clear the search.'
              : mineOnly
                ? "You haven't uploaded any materials yet."
                : page > 1
                  ? 'No materials on this page.'
                  : 'Be the first to upload a resource.'}
          </p>
        </div>
      )}

      {/* Materials grid */}
      {!loading && !error && materials.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {materials.map((material) => (
            <MaterialCard
              key={material.id}
              id={material.id}
              title={material.title}
              author={
                material.user.profile?.displayName ??
                material.user.name ??
                material.user.email.split('@')[0] ??
                'Anonymous'
              }
              type={(material.fileType || 'unknown').toUpperCase()}
              fileType={material.fileType}
              downloads={material.downloads}
              uploadedAt={formatDistanceToNow(new Date(material.createdAt), { addSuffix: true })}
              isOwner={
                !!currentUserId &&
                (material.user.id === currentUserId || currentUserRole === 'OWNER')
              }
              onDownload={handleDownload}
              onPreview={() => setPreviewMaterial(material)}
              onEdit={() => setEditingMaterial(material)}
              onDelete={(id) => setPendingDeleteId(String(id))}
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

      <MaterialPreviewModal
        open={!!previewMaterial}
        onOpenChange={(open) => {
          if (!open) setPreviewMaterial(null)
        }}
        material={
          previewMaterial
            ? {
                id: previewMaterial.id,
                title: previewMaterial.title,
                fileType: previewMaterial.fileType,
                fileSize: previewMaterial.fileSize,
                author:
                  previewMaterial.user.profile?.displayName ??
                  previewMaterial.user.name ??
                  previewMaterial.user.email.split('@')[0] ??
                  'Anonymous',
                uploadedAt: formatDistanceToNow(new Date(previewMaterial.createdAt), {
                  addSuffix: true,
                }),
                downloads: previewMaterial.downloads,
              }
            : null
        }
        isOwner={!!currentUserId && previewMaterial?.user.id === currentUserId}
        onDownload={(id) => void handleDownload(id)}
        onDelete={(id) => setPendingDeleteId(id)}
      />

      <EditMaterialModal
        open={!!editingMaterial}
        onOpenChange={(open) => {
          if (!open) setEditingMaterial(null)
        }}
        material={editingMaterial}
        onSuccess={handleEditSuccess}
      />

      <UploadMaterialModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      <ConfirmDialog
        open={!!pendingDeleteId}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null)
        }}
        title="Delete material"
        description="This will permanently remove the file. This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (pendingDeleteId) void handleDelete(pendingDeleteId)
        }}
      />
    </div>
  )
}

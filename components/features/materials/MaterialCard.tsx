'use client'

import { useState } from 'react'
import { Download, Eye, FileText, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PdfThumbnail } from './PdfThumbnail'

interface MaterialCardProps {
  id: number | string
  title: string
  author: string
  type: string
  fileType: string | null
  downloads: number
  uploadedAt: string
  isOwner?: boolean
  onDownload?: (id: number | string) => void
  onPreview?: (id: number | string) => void
  onEdit?: (id: number | string) => void
  onDelete?: (id: number | string) => void
}

export function MaterialCard({
  id,
  title,
  author,
  fileType,
  downloads,
  uploadedAt,
  isOwner,
  onDownload,
  onPreview,
  onEdit,
  onDelete,
}: MaterialCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const isPdf = (fileType ?? '').toLowerCase() === 'pdf'

  return (
    <div
      onClick={() => onPreview?.(id)}
      className="border-border group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border transition-colors hover:bg-black/5 dark:hover:bg-white/[0.04]"
    >
      {/* Thumbnail area */}
      <div className="border-border relative h-36 shrink-0 overflow-hidden border-b">
        {isPdf ? (
          <PdfThumbnail materialId={String(id)} pageCount={1} className="h-full" />
        ) : (
          <div className="bg-primary/5 flex h-full items-center justify-center">
            <FileText className="text-primary/30 h-10 w-10" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/25">
          <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition-all group-hover:bg-white/20 group-hover:opacity-100">
            <Eye className="h-3.5 w-3.5" />
            Preview
          </span>
        </div>

        {/* 3-dot menu — revealed on hover, owners only */}
        {isOwner && (
          <div className="absolute top-2 right-2 z-10">
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  aria-label="More options"
                  className={`flex h-6 w-6 items-center justify-center rounded-md bg-black/50 text-white backdrop-blur-sm transition-opacity hover:bg-black/70 ${
                    menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem
                  className="gap-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit?.(id)
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive gap-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete?.(id)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3">
        <p className="text-foreground mb-1 line-clamp-2 text-sm leading-snug font-semibold break-words">
          {title}
        </p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {author} · {uploadedAt}
        </p>

        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <Download className="h-3 w-3" />
            {downloads}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDownload?.(id)
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            aria-label={`Download ${title}`}
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
        </div>
      </div>
    </div>
  )
}

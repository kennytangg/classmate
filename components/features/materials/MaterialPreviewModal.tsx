'use client'

import { Download, MoreHorizontal, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface PreviewMaterial {
  id: string
  title: string
  fileType: string | null
  fileSize: number | null
  author: string
  uploadedAt: string
  downloads: number
}

interface MaterialPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  material: PreviewMaterial | null
  isOwner?: boolean
  onDownload: (id: string) => void
  onDelete?: (id: string) => void
}

export function MaterialPreviewModal({
  open,
  onOpenChange,
  material,
  isOwner,
  onDownload,
  onDelete,
}: MaterialPreviewModalProps) {
  if (!material) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-w-3xl flex-col gap-0 overflow-hidden p-0"
        style={{ height: '88vh' }}
      >
        <DialogTitle className="sr-only">{material.title}</DialogTitle>

        {/* Title bar — pr-12 leaves room for the built-in X close button */}
        <div className="border-border flex shrink-0 items-center border-b px-4 py-3 pr-12">
          <p className="text-foreground truncate text-sm font-semibold">{material.title}</p>
        </div>

        {/* PDF viewer */}
        <iframe
          src={`/api/materials/${material.id}/preview`}
          className="min-h-0 w-full flex-1 border-0"
          title={material.title}
        />

        {/* Footer */}
        <div className="border-border flex shrink-0 items-center justify-between border-t px-4 py-3">
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <span>{material.author}</span>
            <span>·</span>
            <span>{material.uploadedAt}</span>
            {material.fileSize != null && (
              <>
                <span>·</span>
                <span>{formatBytes(material.fileSize)}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
                    aria-label="More options"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive gap-2"
                    onClick={() => onDelete?.(material.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <button
              onClick={() => onDownload(material.id)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

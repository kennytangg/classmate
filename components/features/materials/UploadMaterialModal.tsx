'use client'

import { useRef, useState } from 'react'
import { Loader2, Upload, FileText, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

const ALLOWED_EXTENSIONS = ['pdf']
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024
const TITLE_LIMIT = 60

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface UploadMaterialModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function UploadMaterialModal({ open, onOpenChange, onSuccess }: UploadMaterialModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  function resetForm() {
    setFile(null)
    setTitle('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) resetForm()
    onOpenChange(isOpen)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return

    const ext = selected.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error('File type not supported', {
        description: 'Only PDF files are accepted.',
      })
      e.target.value = ''
      return
    }

    if (selected.size > MAX_FILE_SIZE_BYTES) {
      toast.error('File too large', {
        description: 'Maximum file size is 50 MB.',
      })
      e.target.value = ''
      return
    }

    setFile(selected)
    if (!title) {
      setTitle(selected.name.replace(/\.[^/.]+$/, '').slice(0, TITLE_LIMIT))
    }
  }

  function clearFile() {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!file) {
      toast.error('Please select a file to upload.')
      return
    }
    if (!title.trim()) {
      toast.error('Please enter a title.')
      return
    }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', title.trim())

      const response = await fetch('/api/materials', { method: 'POST', body: fd })
      const data = (await response.json()) as { material?: { id: string }; error?: string }

      if (!response.ok) {
        toast.error(data.error ?? 'Upload failed. Please try again.')
        return
      }

      toast.success('Material uploaded successfully!')
      handleOpenChange(false)
      onSuccess?.()
    } catch {
      toast.error('Upload failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        <DialogHeader className="border-border border-b px-6 pt-6 pb-4">
          <DialogTitle className="text-sm font-semibold">Upload Study Material</DialogTitle>
          <DialogDescription className="text-muted-foreground mt-0.5 text-xs">
            Share PDF resources with your classmates. Max 50 MB per file.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-6 py-4">
            {/* File picker */}
            <div>
              <label className="text-foreground mb-1.5 block text-xs font-medium">
                File <span className="text-semantic-error">*</span>
              </label>
              {file ? (
                <div className="border-border bg-muted flex items-center justify-between rounded-lg border px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <FileText className="text-primary h-4 w-4 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-foreground truncate text-xs font-medium">{file.name}</p>
                      <p className="text-muted-foreground text-xs">{formatBytes(file.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="text-muted-foreground hover:text-foreground ml-3 shrink-0"
                    aria-label="Remove file"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-border hover:border-primary hover:bg-primary/5 w-full rounded-lg border-2 border-dashed py-6 text-center transition-colors"
                  disabled={loading}
                >
                  <Upload className="text-muted-foreground mx-auto mb-2 h-6 w-6" />
                  <p className="text-foreground text-sm font-medium">Click to choose a file</p>
                  <div className="mt-2 flex items-center justify-center gap-1.5">
                    <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-xs font-semibold text-red-400">
                      PDF
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-2 text-xs">Up to 50 MB</p>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={loading}
              />
            </div>

            {/* Title */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="upload-title" className="text-foreground text-xs font-medium">
                  Title <span className="text-semantic-error">*</span>
                </label>
                <span
                  className={`text-xs tabular-nums ${title.length > 50 ? 'text-semantic-error' : 'text-muted-foreground'}`}
                >
                  {title.length}/{TITLE_LIMIT}
                </span>
              </div>
              <input
                type="text"
                id="upload-title"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, TITLE_LIMIT))}
                placeholder="e.g., Calculus Chapter 5 Notes"
                className="border-border bg-muted text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                disabled={loading}
                maxLength={TITLE_LIMIT}
              />
            </div>
          </div>

          <div className="border-border bg-muted/30 flex items-center justify-end gap-2 border-t px-6 py-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !file || !title.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-3.5 w-3.5" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Upload, FileText, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'md', 'zip']
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024

const SUBJECTS = [
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function UploadMaterialPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return

    const ext = selected.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(`File type .${ext} is not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`)
      e.target.value = ''
      return
    }

    if (selected.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`File is too large. Maximum size is 50 MB.`)
      e.target.value = ''
      return
    }

    setFile(selected)
    if (!title) {
      setTitle(selected.name.replace(/\.[^/.]+$/, ''))
    }
  }

  function clearFile() {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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
    if (!subject) {
      toast.error('Please select a subject.')
      return
    }

    setLoading(true)

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', title.trim())
      fd.append('subject', subject)
      if (description.trim()) {
        fd.append('description', description.trim())
      }

      const response = await fetch('/api/materials', {
        method: 'POST',
        body: fd,
      })

      const data = (await response.json()) as { material?: { id: string }; error?: string }

      if (!response.ok) {
        toast.error(data.error ?? 'Upload failed. Please try again.')
        return
      }

      toast.success('Material uploaded successfully!')
      router.push('/materials')
    } catch {
      toast.error('Upload failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8 md:px-8">
      <Link
        href="/materials"
        className="text-muted-foreground hover:text-primary mb-6 inline-flex items-center"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Materials
      </Link>

      <div className="border-border bg-card rounded-xl border p-4 shadow-sm sm:p-6 md:p-8">
        <h1 className="text-foreground mb-2 text-2xl font-bold">Upload Study Material</h1>
        <p className="text-muted-foreground mb-6 text-sm break-words sm:mb-8">
          Share resources with your classmates. Accepted formats: {ALLOWED_EXTENSIONS.join(', ')} ·
          Max 50 MB
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File drop zone */}
          <div>
            <label className="text-foreground mb-1 block text-sm font-medium">
              File <span className="text-semantic-error">*</span>
            </label>
            {file ? (
              <div className="border-border bg-muted flex items-center justify-between rounded-lg border px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="text-primary h-5 w-5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-foreground truncate text-sm font-medium">{file.name}</p>
                    <p className="text-muted-foreground text-xs">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  className="text-muted-foreground hover:text-foreground ml-3 shrink-0"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="border-border hover:border-primary hover:bg-primary/5 w-full rounded-lg border-2 border-dashed p-8 text-center transition-colors"
                disabled={loading}
              >
                <Upload className="text-muted-foreground mx-auto mb-3 h-8 w-8" />
                <p className="text-foreground text-sm font-medium">Click to choose a file</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {ALLOWED_EXTENSIONS.join(', ')} · up to 50 MB
                </p>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.zip"
              onChange={handleFileChange}
              disabled={loading}
            />
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="text-foreground mb-1 block text-sm font-medium">
              Title <span className="text-semantic-error">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Calculus Chapter 5 Notes"
              className="border-border bg-muted text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none"
              disabled={loading}
            />
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="text-foreground mb-1 block text-sm font-medium">
              Subject <span className="text-semantic-error">*</span>
            </label>
            <select
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="border-border bg-muted text-foreground focus:ring-ring w-full rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none"
              disabled={loading}
            >
              <option value="">Select a subject</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="text-foreground mb-1 block text-sm font-medium">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe what's in this file..."
              className="border-border bg-muted text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none"
              disabled={loading}
            />
          </div>

          <div className="border-border flex justify-end gap-4 border-t pt-4">
            <Link href="/materials">
              <Button variant="outline" type="button" className="rounded-lg" disabled={loading}>
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

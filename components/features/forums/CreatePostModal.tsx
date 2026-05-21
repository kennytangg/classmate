'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ModerationAlert } from '@/components/ui/moderation-alert'

interface ModerationBlock {
  reason: string
  categories?: string[]
}

interface CreatePostModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreatePostModal({ open, onOpenChange, onSuccess }: CreatePostModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [moderationBlock, setModerationBlock] = useState<ModerationBlock | null>(null)

  function resetForm() {
    setTitle('')
    setContent('')
    setModerationBlock(null)
  }

  function handleOpenChange(open: boolean) {
    if (!open) resetForm()
    onOpenChange(open)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setModerationBlock(null)
    setLoading(true)

    try {
      const response = await fetch('/api/forums/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.moderation?.action === 'block') {
          setModerationBlock({
            reason: data.moderation.reason || '',
            categories: data.moderation.categories,
          })
          toast.error(data.moderation.reason || 'Content blocked by moderation')
          return
        }
        toast.error(data.error || 'Failed to create post')
        return
      }

      if (data.warning) {
        toast.warning(`Post created with warning: ${data.warning.reason}`)
      } else {
        toast.success('Discussion created successfully!')
      }

      handleOpenChange(false)
      onSuccess?.()

      const postId = data.id || data.post?.id
      if (postId) {
        router.push(`/forums/${postId}`)
      }
    } catch {
      toast.error('Failed to create discussion. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-border border-b px-6 pt-6 pb-4">
          <DialogTitle className="text-base font-semibold">Ask a Question</DialogTitle>
          <DialogDescription className="text-muted-foreground mt-0.5 text-xs">
            Your question stays searchable — others with the same question can find the answer
            later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-6 py-4">
            {moderationBlock && (
              <ModerationAlert
                reason={moderationBlock.reason}
                categories={moderationBlock.categories}
                onDismiss={() => setModerationBlock(null)}
              />
            )}

            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's your question or topic?"
                className="text-foreground placeholder:text-muted-foreground w-full border-0 bg-transparent py-1 text-base font-medium focus:ring-0 focus:outline-none"
                disabled={loading}
                autoFocus
              />
            </div>

            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe your question in detail..."
                rows={6}
                className="text-foreground placeholder:text-muted-foreground w-full resize-none border-0 bg-transparent py-1 text-sm focus:ring-0 focus:outline-none"
                disabled={loading}
              />
            </div>
          </div>

          <div className="border-border bg-muted/30 flex items-center justify-between border-t px-6 py-3">
            <p className="text-muted-foreground text-xs">
              {title.length > 0 || content.length > 0
                ? `${title.length} / ${content.length} chars`
                : ''}
            </p>
            <div className="flex gap-2">
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
                disabled={loading || !title.trim() || !content.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-5 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post'
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

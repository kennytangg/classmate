'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ModerationAlert } from '@/components/ui/moderation-alert'
import { Loader2, User } from 'lucide-react'
import { toast } from 'sonner'

interface ReplyFormProps {
  postId: string
  onReplyCreated?: () => void
}

interface ModerationBlock {
  reason: string
  categories?: string[]
}

export function ReplyForm({ postId, onReplyCreated }: ReplyFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [moderationBlock, setModerationBlock] = useState<ModerationBlock | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!content.trim()) {
      toast.error('Please enter a reply')
      return
    }

    setModerationBlock(null)
    setLoading(true)

    try {
      const response = await fetch('/api/forums/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
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
          return
        }
        toast.error(data.error || 'Failed to post reply')
        return
      }

      if (data.warning) {
        toast.warning(`Reply posted with warning: ${data.warning.reason}`)
      } else {
        toast.success('Reply posted successfully!')
      }

      setContent('')
      onReplyCreated?.()
    } catch (err) {
      console.error('Reply error:', err)
      toast.error('Failed to post reply. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-muted/40 rounded-xl px-4 py-4">
      {moderationBlock && (
        <div className="mb-3">
          <ModerationAlert
            reason={moderationBlock.reason}
            categories={moderationBlock.categories}
            onDismiss={() => setModerationBlock(null)}
          />
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="flex items-start gap-3">
          <div className="bg-muted text-muted-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
            <User className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <textarea
              rows={2}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Post your reply..."
              className="text-foreground placeholder:text-muted-foreground w-full resize-none bg-transparent pt-1.5 text-base leading-relaxed focus:outline-none disabled:opacity-50"
              disabled={loading}
            />
            <div className="mt-2 flex justify-end">
              <Button
                type="submit"
                disabled={loading || !content.trim()}
                className="h-8 rounded-full px-5 text-sm font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Reply'
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

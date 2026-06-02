'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

interface SummarizeButtonProps {
  threadContent: string
}

export function SummarizeButton({ threadContent }: SummarizeButtonProps) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSummarize() {
    if (loading) return

    setLoading(true)
    setSummary(null)

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread: threadContent }),
      })

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        const secs = retryAfter ? parseInt(retryAfter) : 3600
        const mins = Math.ceil(secs / 60)
        toast.error('AI summary limit reached', {
          description: `Try again in ${mins} minute${mins === 1 ? '' : 's'}.`,
        })
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to summarize')
      }

      setSummary(data.summary)
    } catch (err) {
      console.error('Summarize error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to generate summary')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Button
        onClick={handleSummarize}
        disabled={loading}
        variant="outline"
        className="border-border text-primary hover:bg-accent hover:text-accent-foreground rounded-lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Summarizing...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            AI Summary
          </>
        )}
      </Button>

      {summary && (
        <div className="border-border bg-accent mt-4 rounded-xl border p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary h-4 w-4" />
              <h4 className="text-accent-foreground font-semibold">AI Thread Summary</h4>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground h-6 w-6"
              onClick={() => setSummary(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-foreground text-sm leading-relaxed">{summary}</p>
        </div>
      )}
    </div>
  )
}

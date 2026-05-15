'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, Send } from 'lucide-react'

export function AiTutorInput() {
  const [query, setQuery] = useState('')
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function submit() {
    const trimmed = query.trim()
    if (!trimmed) return
    router.push(`/ai-tutor?q=${encodeURIComponent(trimmed)}`)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="bg-card border-border rounded-2xl border p-5">
      <div className="mb-4 flex items-center gap-2">
        <Bot className="text-muted-foreground h-4 w-4" />
        <span className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
          Ask AI Tutor
        </span>
      </div>

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything… e.g. Explain the Central Limit Theorem"
          rows={3}
          className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-primary/40 w-full resize-none rounded-xl border px-4 py-3 pr-12 text-sm focus:ring-2 focus:outline-none"
        />
        <button
          onClick={submit}
          disabled={!query.trim()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 absolute right-3 bottom-3 flex h-8 w-8 items-center justify-center rounded-lg transition-opacity disabled:opacity-40"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      <p className="text-muted-foreground mt-2 text-xs">
        Press Enter to open the AI Tutor · Shift+Enter for new line
      </p>
    </div>
  )
}

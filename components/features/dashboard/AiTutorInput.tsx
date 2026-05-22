'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, Send, Sparkles } from 'lucide-react'

const EXAMPLE_PROMPTS = [
  'Explain recursion with examples',
  'Summarise the French Revolution',
  'What is Big O notation?',
  'How does photosynthesis work?',
]

export function AiTutorInput() {
  const [query, setQuery] = useState('')
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function submit(q?: string) {
    const trimmed = (q ?? query).trim()
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
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="bg-primary/15 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
          <Bot className="text-primary h-5 w-5" />
        </div>
        <div>
          <h3 className="text-foreground font-semibold">Ask the AI Tutor</h3>
          <p className="text-muted-foreground text-xs">Get instant explanations on any topic</p>
        </div>
        <Sparkles className="text-primary/40 ml-auto h-4 w-4 shrink-0" />
      </div>

      <div className="relative mb-3">
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What do you want to learn today?"
          rows={2}
          className="border-border bg-background/80 text-foreground placeholder:text-muted-foreground focus:ring-primary/40 w-full resize-none rounded-xl border px-4 py-3 pr-12 text-sm focus:ring-2 focus:outline-none"
        />
        <button
          onClick={() => submit()}
          disabled={!query.trim()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 absolute right-3 bottom-3 flex h-8 w-8 items-center justify-center rounded-lg transition-opacity disabled:opacity-40"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="text-muted-foreground self-center text-xs">Try:</span>
        {EXAMPLE_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => submit(p)}
            className="border-border bg-background/60 text-muted-foreground hover:text-foreground hover:bg-background/90 rounded-full border px-3 py-1 text-xs transition-colors"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}

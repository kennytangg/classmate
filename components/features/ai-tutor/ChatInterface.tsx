'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, GraduationCap, Copy, Check, RotateCcw } from 'lucide-react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeRaw from 'rehype-raw'
import rehypeKatex from 'rehype-katex'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { nord } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import type { Message } from '../../../hooks/useChat'

// Normalise AI response quirks before passing to the markdown parser.
function preprocessContent(content: string): string {
  let out = content

  // 1. The model sometimes emits literal <br>/<br/> inside inline code spans.
  //    rehype-raw cannot fix those (code content is escaped), so replace them
  //    with newlines before parsing.
  out = out.replace(/<br\s*\/?>/gi, '\n')

  // 2. The model sometimes HTML-encodes apostrophes and other characters.
  //    Decode them before markdown parsing so they display correctly everywhere,
  //    including inside backtick code spans where rehype-raw has no effect.
  out = out.replace(/&#39;|&#x27;/g, "'")
  out = out.replace(/&quot;|&#34;/g, '"')
  out = out.replace(/&lt;/g, '<')
  out = out.replace(/&gt;/g, '>')

  // 3. The model sometimes wraps LaTeX in code fences — either with a label
  //    (```latex / ```math) or as a plain unlabelled ``` block.
  //    Unwrap both variants so remark-math can see the $...$ delimiters.
  out = out.replace(/```(?:latex|math)\n([\s\S]*?)```/gm, (_, inner: string) => {
    return '\n\n' + inner.trim() + '\n\n'
  })
  // Unlabelled fences: only unwrap when the block clearly contains display math
  // (i.e. has $$ markers or \begin{) to avoid breaking real code blocks.
  out = out.replace(/```\n([\s\S]*?)```/gm, (match, inner: string) => {
    if (inner.includes('$$') || inner.includes('\\begin{')) {
      return '\n\n' + inner.trim() + '\n\n'
    }
    return match
  })

  // 4. The model sometimes puts multi-line environments (aligned, align, gather,
  //    equation) inside inline $...$, which KaTeX cannot render in inline mode.
  //    Upgrade them to display math $$...$$ so they render correctly.
  const displayEnvPattern =
    /\$(\\begin\{(?:aligned|align\*?|gather\*?|multline\*?|equation\*?)\}[\s\S]*?\\end\{(?:aligned|align\*?|gather\*?|multline\*?|equation\*?)\})\$/g
  out = out.replace(displayEnvPattern, (_, inner: string) => `$$\n${inner}\n$$`)

  return out
}

const SUGGESTED_PROMPTS = [
  'Explain Big O notation with examples',
  'Help me understand integration by parts',
  'What is the difference between TCP and UDP?',
  'Explain the CAP theorem',
]

interface ChatInterfaceProps {
  messages: Message[]
  isLoading: boolean
  isLoadingHistory?: boolean
  error: string | null
  sendMessage: (content: string) => void
  onRegenerate?: () => void
}

const CODE_FONT = 'var(--font-jetbrains-mono), ui-monospace, monospace'

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="my-4 overflow-hidden rounded-xl bg-zinc-900">
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="text-xs text-zinc-500" style={{ fontFamily: CODE_FONT }}>
          {language || 'text'}
        </span>
        <button
          onClick={handleCopy}
          className="text-zinc-500 transition-colors hover:text-zinc-300"
          aria-label="Copy code"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={nord}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          padding: '0 1rem 1rem',
          fontSize: '0.8125rem',
          lineHeight: '1.65',
          fontFamily: CODE_FONT,
          background: 'transparent',
        }}
        codeTagProps={{ style: { fontFamily: CODE_FONT } }}
        PreTag="div"
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

const markdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  code({
    className,
    children,
    ...props
  }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
    const match = /language-(\w+)/.exec(className ?? '')
    const raw = String(children)
    // Fenced blocks with a language specifier have `className="language-xxx"`
    // Fenced blocks WITHOUT a language specifier have no className but always
    // end with `\n`, distinguishing them from inline code spans.
    const isBlock = Boolean(match) || raw.endsWith('\n')
    if (isBlock) {
      return <CodeBlock language={match?.[1] ?? 'plaintext'} code={raw.replace(/\n$/, '')} />
    }
    return (
      <code
        className="rounded bg-zinc-800 px-1.5 py-0.5 text-sm text-zinc-200"
        style={{ fontFamily: CODE_FONT }}
        {...props}
      >
        {children}
      </code>
    )
  },
  p({ children }: React.HTMLAttributes<HTMLParagraphElement>) {
    return <p className="mb-3 leading-relaxed last:mb-0">{children}</p>
  },
  h1({ children }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <h1 className="mt-8 mb-4 text-3xl font-bold tracking-tight first:mt-0">{children}</h1>
  },
  h2({ children }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
      <h2 className="border-border mt-7 mb-3 border-b pb-2 text-2xl font-bold tracking-tight first:mt-0">
        {children}
      </h2>
    )
  },
  h3({ children }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <h3 className="mt-5 mb-2 text-xl font-semibold first:mt-0">{children}</h3>
  },
  ul({ children }: React.HTMLAttributes<HTMLUListElement>) {
    return <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
  },
  ol({ children }: React.HTMLAttributes<HTMLOListElement>) {
    return <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
  },
  li({ children }: React.HTMLAttributes<HTMLLIElement>) {
    return <li className="leading-relaxed">{children}</li>
  },
  blockquote({ children }: React.HTMLAttributes<HTMLQuoteElement>) {
    return (
      <blockquote className="border-primary/50 text-muted-foreground my-3 border-l-4 pl-4 italic">
        {children}
      </blockquote>
    )
  },
  table({ children }: React.HTMLAttributes<HTMLTableElement>) {
    return (
      <div className="my-3 overflow-x-auto">
        <table className="border-border w-full border-collapse border text-sm">{children}</table>
      </div>
    )
  },
  thead({ children }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return <thead className="bg-muted">{children}</thead>
  },
  th({ children }: React.HTMLAttributes<HTMLTableCellElement>) {
    return <th className="border-border border px-3 py-2 text-left font-semibold">{children}</th>
  },
  td({ children }: React.HTMLAttributes<HTMLTableCellElement>) {
    return <td className="border-border border px-3 py-2 align-top">{children}</td>
  },
  hr() {
    return <hr className="border-border my-6 border-t-2 opacity-60" />
  },
  a({ href, children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 hover:opacity-80"
      >
        {children}
      </a>
    )
  },
  strong({ children }: React.HTMLAttributes<HTMLElement>) {
    return <strong className="font-bold">{children}</strong>
  },
}

interface MessageActionsProps {
  content: string
  isLast: boolean
  onRegenerate?: () => void
}

function MessageActions({ content, isLast, onRegenerate }: MessageActionsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    void navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
      <button
        onClick={handleCopy}
        className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-md p-1.5 transition-colors"
        aria-label="Copy response"
        title="Copy"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      {isLast && onRegenerate && (
        <button
          onClick={onRegenerate}
          className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-md p-1.5 transition-colors"
          aria-label="Regenerate response"
          title="Regenerate"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

export function ChatInterface({
  messages,
  isLoading,
  isLoadingHistory = false,
  error,
  sendMessage,
  onRegenerate,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const chatBoxRef = useRef<HTMLDivElement>(null)

  const lastAssistantIndex = messages.reduce(
    (last, msg, i) => (msg.role === 'assistant' ? i : last),
    -1
  )

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || isLoading) return
    const text = input
    setInput('')
    sendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="bg-card flex h-full min-w-0 flex-col overflow-hidden">
      {/* Chat Area */}
      <div className="relative flex-1 overflow-hidden">
        {/* Top fade — softens content appearing from the edge */}
        <div className="from-card pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b to-transparent" />

        <div
          ref={chatBoxRef}
          className="h-full space-y-6 overflow-x-hidden overflow-y-auto px-6 pt-10 pb-4"
        >
          {error && (
            <div className="bg-semantic-error/10 text-semantic-error rounded-xl p-3 text-center text-sm">
              {error}
            </div>
          )}

          {isLoadingHistory && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center opacity-50">
              <p className="text-muted-foreground text-sm">Loading conversation...</p>
            </div>
          )}

          {messages.length === 0 && !isLoading && !isLoadingHistory && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-2xl">
                <GraduationCap className="text-primary h-8 w-8" />
              </div>
              <div>
                <p className="text-foreground text-base font-semibold">Your AI Study Companion</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Ask anything — I&apos;ll help you understand, not just answer.
                </p>
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="border-border bg-muted hover:bg-accent text-foreground rounded-full border px-4 py-2 text-xs transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={msg.id}
              className={`group flex min-w-0 ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              <div className={`min-w-0 ${msg.role === 'user' ? 'max-w-[75%]' : 'w-full'}`}>
                {msg.role === 'user' ? (
                  <div className="bg-primary overflow-hidden rounded-2xl rounded-tr-none p-4 shadow-sm">
                    <p className="text-primary-foreground text-sm leading-relaxed break-words whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="prose dark:prose-invert max-w-none overflow-hidden font-[family-name:var(--font-playfair)] leading-loose break-words [&_code]:font-mono [&_pre]:font-mono">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[
                          rehypeRaw,
                          [
                            rehypeKatex,
                            { throwOnError: false, errorColor: '#6b7280', strict: false },
                          ],
                        ]}
                        components={markdownComponents}
                      >
                        {preprocessContent(msg.content)}
                      </ReactMarkdown>
                    </div>
                    {msg.content && (
                      <MessageActions
                        content={msg.content}
                        isLast={index === lastAssistantIndex && !isLoading}
                        onRegenerate={onRegenerate}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex h-5 items-center gap-1 px-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -4, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                  className="bg-primary/60 h-2 w-2 rounded-full"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-border border-t p-4">
        <div className="border-border bg-muted flex items-center gap-3 rounded-2xl border p-2 pr-2 shadow-sm transition-shadow hover:shadow-md">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a follow-up question..."
            className="text-foreground placeholder-muted-foreground flex-1 bg-transparent pl-2 text-sm focus:outline-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90 rounded-xl p-2 shadow-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-muted-foreground mt-3 text-center text-xs">
          AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  )
}

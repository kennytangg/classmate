'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, GraduationCap, Copy, Check, RotateCcw, ImageIcon, X } from 'lucide-react'
import { toast } from 'sonner'
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
  sendMessage: (content: string, imageUrl?: string) => void
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
    return <p className="mb-3 text-sm leading-relaxed last:mb-0">{children}</p>
  },
  h1({ children }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <h1 className="mt-8 mb-4 text-lg font-bold tracking-tight first:mt-0">{children}</h1>
  },
  h2({ children }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
      <h2 className="border-border mt-7 mb-3 border-b pb-2 text-lg font-semibold tracking-tight first:mt-0">
        {children}
      </h2>
    )
  },
  h3({ children }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <h3 className="mt-5 mb-2 text-lg font-semibold first:mt-0">{children}</h3>
  },
  ul({ children }: React.HTMLAttributes<HTMLUListElement>) {
    return <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
  },
  ol({ children }: React.HTMLAttributes<HTMLOListElement>) {
    return <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
  },
  li({ children }: React.HTMLAttributes<HTMLLIElement>) {
    return <li className="text-sm leading-relaxed">{children}</li>
  },
  blockquote({ children }: React.HTMLAttributes<HTMLQuoteElement>) {
    return (
      <blockquote className="border-primary/50 text-muted-foreground my-3 border-l-4 pl-4 text-sm italic">
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
    return (
      <th className="border-border border px-3 py-2 text-left text-sm font-semibold">{children}</th>
    )
  },
  td({ children }: React.HTMLAttributes<HTMLTableCellElement>) {
    return <td className="border-border border px-3 py-2 align-top text-sm">{children}</td>
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

const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export function ChatInterface({
  messages,
  isLoading,
  isLoadingHistory = false,
  error,
  sendMessage,
  onRegenerate,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null)
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const chatBoxRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const lastAssistantIndex = messages.reduce(
    (last, msg, i) => (msg.role === 'assistant' ? i : last),
    -1
  )

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight
    }
  }, [messages])

  function attachFile(file: File) {
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      toast.error('Only images are supported', {
        description: 'Please attach a PNG, JPG, or WebP file.',
      })
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Image too large', { description: 'Maximum file size is 10MB.' })
      return
    }
    if (pendingImageFile) URL.revokeObjectURL(pendingImagePreview ?? '')
    setPendingImageFile(file)
    setPendingImagePreview(URL.createObjectURL(file))
  }

  function handlePaste(e: React.ClipboardEvent) {
    const imageItem = Array.from(e.clipboardData.items).find((item) =>
      ACCEPTED_IMAGE_TYPES.has(item.type)
    )
    if (!imageItem) return
    const file = imageItem.getAsFile()
    if (!file) return
    e.preventDefault()
    attachFile(file)
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) attachFile(file)
  }

  function clearPendingImage() {
    if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview)
    setPendingImagePreview(null)
    setPendingImageFile(null)
  }

  const handleSend = async () => {
    if ((!input.trim() && !pendingImageFile) || isLoading || isUploading) return

    let imageUrl: string | undefined

    if (pendingImageFile) {
      setIsUploading(true)
      try {
        const formData = new FormData()
        formData.append('file', pendingImageFile)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const data = (await res.json()) as { fileUrl?: string; error?: string }
        if (!res.ok || !data.fileUrl) throw new Error(data.error ?? 'Upload failed')
        imageUrl = data.fileUrl
      } catch (err) {
        toast.error('Image upload failed', {
          description: err instanceof Error ? err.message : 'Please try again.',
        })
        setIsUploading(false)
        return
      }
      setIsUploading(false)
    }

    const text = input
    setInput('')
    clearPendingImage()
    sendMessage(text, imageUrl)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  return (
    <div className="bg-background flex h-full min-w-0 flex-col overflow-hidden">
      {/* Chat Area */}
      <div className="relative flex-1 overflow-hidden">
        {/* Top fade */}
        <div className="from-background pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b to-transparent" />

        {/* Bottom fade — subtler than the top so it doesn't distract */}
        <div className="from-background/60 pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t to-transparent" />

        <div ref={chatBoxRef} className="h-full overflow-x-hidden overflow-y-auto">
          <div className="mx-auto flex min-h-full max-w-3xl flex-col gap-6 px-6 pt-10 pb-4">
            {error && (
              <div className="bg-semantic-error/10 text-semantic-error rounded-xl p-3 text-center text-sm">
                {error}
              </div>
            )}

            {isLoadingHistory && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center opacity-50">
                <p className="text-muted-foreground text-sm">Loading conversation...</p>
              </div>
            )}

            {messages.length === 0 && !isLoading && !isLoadingHistory && (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-2xl">
                  <GraduationCap className="text-primary h-8 w-8" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-semibold">Your AI Study Companion</p>
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
                    <div className="flex flex-col items-end gap-1">
                      {msg.imageUrl && (
                        <a
                          href={msg.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={msg.imageUrl}
                            alt="attached image"
                            className="max-h-[220px] max-w-[260px] rounded-2xl object-cover shadow-md transition-opacity hover:opacity-90"
                          />
                        </a>
                      )}
                      {msg.content && (
                        <div className="bg-primary overflow-hidden rounded-2xl rounded-tr-none p-4 shadow-sm">
                          <p className="text-primary-foreground text-sm leading-relaxed break-words whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="prose prose-sm dark:prose-invert max-w-none overflow-hidden font-[family-name:var(--font-playfair)] leading-loose break-words [&_code]:font-mono [&_pre]:font-mono">
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
      </div>

      {/* Input Area */}
      <div className="px-6 py-4">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageSelect}
        />

        <div className="mx-auto max-w-3xl">
          {/* Single card that contains both the image preview (when present) and the text input */}
          <div className="border-border bg-muted rounded-2xl border shadow-sm transition-shadow hover:shadow-md">
            {/* Image preview — lives inside the card, above the text field */}
            {pendingImagePreview && (
              <div className="px-3 pt-3">
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pendingImagePreview}
                    alt="preview"
                    className="h-24 w-auto max-w-[200px] rounded-xl object-cover shadow-sm"
                  />
                  <button
                    onClick={clearPendingImage}
                    className="bg-background border-border hover:bg-muted absolute -top-1.5 -right-1.5 rounded-full border p-0.5 shadow-sm transition-colors"
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Text input row */}
            <div className="flex items-center gap-2 p-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isUploading}
                className="text-muted-foreground hover:text-foreground hover:bg-accent ml-1 rounded-xl p-1.5 transition-colors disabled:opacity-40"
                aria-label="Attach image (PNG, JPG, WebP)"
                title="Attach image — PNG, JPG, WebP only"
              >
                <ImageIcon className="h-4 w-4" />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder="Ask a question or attach an image..."
                className="text-foreground placeholder-muted-foreground flex-1 bg-transparent text-sm focus:outline-none"
                disabled={isLoading || isUploading}
              />
              <button
                onClick={() => void handleSend()}
                disabled={isLoading || isUploading || (!input.trim() && !pendingImageFile)}
                className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90 rounded-xl p-2 shadow-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

          <p className="text-muted-foreground mt-3 text-center text-xs">
            AI can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </div>
  )
}

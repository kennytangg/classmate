'use client'

import { useCallback, useEffect, useMemo, useRef, useState, use } from 'react'
import { Button } from '@/components/ui/button'
import { Send, ArrowLeft, Loader2, Paperclip, X, FileText, Download } from 'lucide-react'
import Link from 'next/link'

const AVATAR_COLORS = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-fuchsia-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-indigo-500',
]

function getAvatarColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? 'bg-violet-500'
}

const POLL_INTERVAL_MS = 5000
const MAX_FILE_SIZE = 10 * 1024 * 1024

type Message = {
  id: string
  senderId: string
  recipientId: string
  content: string
  fileUrl: string | null
  fileName: string | null
  fileType: string | null
  fileSize: number | null
  isRead: boolean
  createdAt: string
}

type Participant = {
  id: string
  email: string
  displayName: string | null
  avatarUrl: string | null
}

type PendingFile = {
  file: File
  previewUrl: string | null
}

function formatMessageTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImage(fileType: string | null): boolean {
  return !!fileType?.startsWith('image/')
}

function FileAttachment({
  fileUrl,
  fileName,
  fileType,
  fileSize,
  isMe,
}: {
  fileUrl: string
  fileName: string | null
  fileType: string | null
  fileSize: number | null
  isMe: boolean
}) {
  if (isImage(fileType)) {
    return (
      <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fileUrl}
          alt={fileName ?? 'image'}
          className="max-h-[200px] max-w-[240px] rounded-xl object-cover"
        />
      </a>
    )
  }

  return (
    <a
      href={fileUrl}
      download={fileName ?? true}
      className={`mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
        isMe
          ? 'text-primary-foreground bg-white/20 hover:bg-white/30'
          : 'bg-muted hover:bg-muted/80 text-foreground'
      } transition-colors`}
    >
      <FileText className="h-5 w-5 shrink-0" />
      <div className="min-w-0">
        <p className="max-w-[180px] truncate font-medium">{fileName ?? 'File'}</p>
        {fileSize !== null && <p className="text-[10px] opacity-70">{formatFileSize(fileSize)}</p>}
      </div>
      <Download className="ml-auto h-4 w-4 shrink-0" />
    </a>
  )
}

export default function ChatConversationPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const participantName = useMemo(() => {
    if (!participant) return 'Conversation'
    return participant.displayName ?? participant.email
  }, [participant])

  const participantInitial = participantName.charAt(0).toUpperCase() || 'U'

  const loadThread = useCallback(
    async (silent = false) => {
      if (!userId || userId === 'undefined') return
      if (!silent) setLoading(true)
      try {
        const res = await fetch(`/api/messages/conversations/${userId}?limit=50`, {
          cache: 'no-store',
        })
        const data = (await res.json()) as {
          participant?: Participant
          messages?: Message[]
          error?: string
        }

        if (!res.ok) {
          setError(data.error ?? 'Unable to load messages.')
          return
        }

        setParticipant(data.participant ?? null)
        setMessages(data.messages ?? [])
        setError(null)
      } catch {
        setError('Unable to load messages.')
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [userId]
  )

  const markRead = useCallback(async () => {
    if (!userId || userId === 'undefined') return
    try {
      await fetch(`/api/messages/conversations/${userId}/read`, { method: 'POST' })
    } catch {
      // Ignore read-state update failures to avoid blocking thread usage.
    }
  }, [userId])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      setError('File too large (max 10MB)')
      return
    }

    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    setPendingFile({ file, previewUrl })
    e.target.value = ''
  }

  function clearPendingFile() {
    if (pendingFile?.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl)
    setPendingFile(null)
  }

  async function handleSendMessage() {
    const content = input.trim()
    if ((!content && !pendingFile) || sending || uploading) return

    setSending(true)
    setError(null)

    try {
      let fileUrl: string | undefined
      let fileName: string | undefined
      let fileType: string | undefined
      let fileSize: number | undefined

      if (pendingFile) {
        setUploading(true)
        const formData = new FormData()
        formData.append('file', pendingFile.file)

        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
        const uploadData = (await uploadRes.json()) as {
          fileUrl?: string
          fileName?: string
          fileType?: string
          fileSize?: number
          error?: string
        }

        setUploading(false)

        if (!uploadRes.ok || !uploadData.fileUrl) {
          setError(uploadData.error ?? 'File upload failed.')
          return
        }

        fileUrl = uploadData.fileUrl
        fileName = uploadData.fileName
        fileType = uploadData.fileType
        fileSize = uploadData.fileSize
      }

      const res = await fetch(`/api/messages/conversations/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, fileUrl, fileName, fileType, fileSize }),
      })
      const data = (await res.json()) as {
        message?: Message
        error?: string
      }

      if (!res.ok || !data.message) {
        setError(data.error ?? 'Unable to send message.')
        return
      }

      setMessages((prev) => [...prev, data.message as Message])
      setInput('')
      clearPendingFile()
    } catch {
      setError('Unable to send message.')
    } finally {
      setSending(false)
      setUploading(false)
    }
  }

  useEffect(() => {
    if (!userId || userId === 'undefined') return
    void loadThread()
    void markRead()

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadThread(true)
      }
    }, POLL_INTERVAL_MS)

    return () => window.clearInterval(intervalId)
  }, [loadThread, markRead, userId])

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  if (!userId || userId === 'undefined') {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">
          Invalid conversation. Please select a user to chat with.
        </p>
      </div>
    )
  }

  const canSend = (input.trim().length > 0 || pendingFile !== null) && !sending && !uploading

  return (
    <div className="bg-card flex h-full flex-col">
      {/* Chat Header */}
      <div className="border-border bg-card z-10 flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="md:hidden">
            <Button variant="ghost" size="icon" className="rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div
            className={`${getAvatarColor(participantName)} flex h-10 w-10 items-center justify-center rounded-full font-bold text-white`}
          >
            {participantInitial}
          </div>
          <div className="min-w-0">
            <h3 className="text-foreground truncate font-semibold">{participantName}</h3>
            <span className="text-muted-foreground text-xs">Direct messages</span>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div ref={messagesContainerRef} className="bg-muted flex-1 space-y-4 overflow-y-auto p-4">
        {loading && (
          <div className="text-muted-foreground flex h-full items-center justify-center">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading messages...
          </div>
        )}

        {!loading && error && (
          <div className="border-semantic-error/30 bg-semantic-error/10 text-semantic-error mb-2 rounded-lg border px-3 py-2 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            No messages yet. Start the conversation.
          </div>
        )}

        {!loading &&
          messages.map((msg) => {
            const isMe = msg.senderId !== userId
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
                    isMe
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'border-border bg-card text-foreground rounded-bl-none border'
                  }`}
                >
                  {msg.fileUrl && (
                    <FileAttachment
                      fileUrl={msg.fileUrl}
                      fileName={msg.fileName}
                      fileType={msg.fileType}
                      fileSize={msg.fileSize}
                      isMe={isMe}
                    />
                  )}
                  {msg.content && (
                    <p className="mt-1 text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                  )}
                  <p
                    className={`mt-1 text-right text-[10px] ${
                      isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}
                  >
                    {formatMessageTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            )
          })}
      </div>

      {/* Chat Input */}
      <div className="border-border bg-card border-t p-4">
        {/* File preview */}
        {pendingFile && (
          <div className="border-border bg-muted mb-2 flex items-center gap-2 rounded-xl border px-3 py-2">
            {pendingFile.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pendingFile.previewUrl}
                alt="preview"
                className="h-10 w-10 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <FileText className="text-muted-foreground h-8 w-8 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{pendingFile.file.name}</p>
              <p className="text-muted-foreground text-xs">
                {formatFileSize(pendingFile.file.size)}
              </p>
            </div>
            <button
              onClick={clearPendingFile}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
            onChange={handleFileSelect}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || uploading}
            className="text-muted-foreground hover:text-foreground h-10 w-10 shrink-0 rounded-full"
            aria-label="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void handleSendMessage()
                }
              }}
              className="bg-muted text-foreground focus:bg-card focus:ring-ring w-full rounded-full border border-transparent py-3 pr-10 pl-4 text-sm transition-colors focus:ring-2 focus:outline-none"
            />
          </div>
          <Button
            size="icon"
            disabled={!canSend}
            onClick={() => void handleSendMessage()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-10 shrink-0 rounded-full"
          >
            {uploading || sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="ml-0.5 h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

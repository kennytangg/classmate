'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  imageUrl?: string
  timestamp: Date
}

interface UseChatOptions {
  sessionId?: string
}

interface StoredMessage {
  id: string
  role: string
  content: string
  createdAt: string
}

// Sentinel key for a new chat that has no session ID yet.
const NEW_CHAT_KEY = '__new__'

export function useChat({ sessionId: initialSessionId }: UseChatOptions = {}) {
  // Per-session message storage so switching sessions never loses in-progress streaming.
  const [sessionMessages, setSessionMessages] = useState<Map<string, Message[]>>(new Map())
  // Tracks which session key has an in-flight request (per-session, not global).
  const [streamingSessionId, setStreamingSessionId] = useState<string | undefined>(undefined)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(initialSessionId)

  const sessionKey = activeSessionId ?? NEW_CHAT_KEY
  const messages = useMemo(
    () => sessionMessages.get(sessionKey) ?? [],
    [sessionMessages, sessionKey]
  )
  const isLoading = streamingSessionId !== undefined
  const isCurrentSessionLoading =
    streamingSessionId !== undefined && streamingSessionId === sessionKey

  const loadMessages = useCallback(async (sessionId: string) => {
    setIsLoadingHistory(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/messages`)
      if (!res.ok) return
      const data = (await res.json()) as { messages: StoredMessage[] }
      const loaded = data.messages.map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(m.createdAt),
      }))
      setSessionMessages((prev) => {
        const existing = prev.get(sessionId) ?? []
        // If DB returned fewer messages than what we have in memory (race with DB write
        // after streaming finished), keep the in-memory version.
        if (loaded.length < existing.length) return prev
        return new Map(prev).set(sessionId, loaded)
      })
    } catch {
      // Silently fail — user can still start a new conversation
    } finally {
      setIsLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    if (initialSessionId) {
      setActiveSessionId(initialSessionId)
      void loadMessages(initialSessionId)
    }
  }, [initialSessionId, loadMessages])

  const sendMessageInternal = useCallback(
    async (content: string, contextOverride?: Message[], imageUrl?: string) => {
      if (!content.trim() && !imageUrl) return
      const thisKey = activeSessionId ?? NEW_CHAT_KEY
      if (streamingSessionId === thisKey) return

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        imageUrl,
        timestamp: new Date(),
      }

      setSessionMessages((prev) => {
        const current = prev.get(thisKey) ?? []
        return new Map(prev).set(thisKey, [...current, userMessage])
      })
      setStreamingSessionId(thisKey)
      setError(null)

      const assistantMessageId = crypto.randomUUID()

      setSessionMessages((prev) => {
        const current = prev.get(thisKey) ?? []
        return new Map(prev).set(thisKey, [
          ...current,
          {
            id: assistantMessageId,
            role: 'assistant' as const,
            content: '',
            timestamp: new Date(),
          },
        ])
      })

      // Read context before we updated state (userMessage added separately in the body).
      const msgContext = contextOverride ?? sessionMessages.get(thisKey) ?? []

      // Mutable so it can be updated when the server returns a real session ID.
      let currentKey = thisKey

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...msgContext, userMessage].map((m) => ({
              role: m.role,
              content: m.imageUrl
                ? [
                    { type: 'image_url', image_url: { url: m.imageUrl } },
                    { type: 'text', text: m.content },
                  ]
                : m.content,
            })),
            sessionId: activeSessionId,
          }),
        })

        if (!response.ok) {
          const errData = (await response.json().catch(() => ({}))) as { error?: string }
          throw new Error(errData.error ?? 'Failed to get response')
        }

        // Capture new session ID from header (set when server auto-creates a session).
        const returnedSessionId = response.headers.get('X-Session-Id')
        if (returnedSessionId && returnedSessionId !== activeSessionId) {
          setActiveSessionId(returnedSessionId)
          setStreamingSessionId(returnedSessionId)
          // Snapshot currentKey NOW — React defers functional updaters to reconciliation,
          // by which point the `let currentKey` would already be mutated to returnedSessionId,
          // causing prev.get(currentKey) to find nothing and silently drop all messages.
          const keyToMove = currentKey
          setSessionMessages((prev) => {
            const next = new Map(prev)
            const msgs = next.get(keyToMove) ?? []
            if (keyToMove !== returnedSessionId) {
              next.delete(keyToMove)
              next.set(returnedSessionId, msgs)
            }
            return next
          })
          currentKey = returnedSessionId
        }

        if (!response.body) throw new Error('No response body')

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith('data: ')) continue

            const data = trimmed.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data) as {
                choices?: Array<{ delta?: { content?: string } }>
                text?: string
              }

              const text = parsed.choices?.[0]?.delta?.content ?? parsed.text ?? ''

              if (text) {
                setSessionMessages((prev) => {
                  const msgs = prev.get(currentKey) ?? []
                  return new Map(prev).set(
                    currentKey,
                    msgs.map((msg) =>
                      msg.id === assistantMessageId ? { ...msg, content: msg.content + text } : msg
                    )
                  )
                })
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
        setSessionMessages((prev) => {
          const msgs = prev.get(currentKey) ?? []
          return new Map(prev).set(
            currentKey,
            msgs.filter((m) => m.id !== assistantMessageId)
          )
        })
      } finally {
        setStreamingSessionId(undefined)
      }
    },
    [sessionMessages, activeSessionId, streamingSessionId]
  )

  const sendMessage = useCallback(
    (content: string, imageUrl?: string) => sendMessageInternal(content, undefined, imageUrl),
    [sendMessageInternal]
  )

  const clearMessages = useCallback(() => {
    setSessionMessages((prev) => new Map(prev).set(sessionKey, []))
    setError(null)
  }, [sessionKey])

  const switchSession = useCallback(
    async (sessionId: string) => {
      setError(null)
      setActiveSessionId(sessionId)

      if (streamingSessionId === sessionId) {
        // This session is actively streaming — show the live in-memory content,
        // skip the DB reload so we don't overwrite the partial response.
        return
      }

      await loadMessages(sessionId)
    },
    [loadMessages, streamingSessionId]
  )

  const newChat = useCallback(() => {
    setError(null)
    setActiveSessionId(undefined)
    setSessionMessages((prev) => {
      const next = new Map(prev)
      next.delete(NEW_CHAT_KEY)
      return next
    })
  }, [])

  const regenerate = useCallback(async () => {
    if (streamingSessionId !== undefined) return

    let lastUserIndex = -1
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      if (msg?.role === 'user') {
        lastUserIndex = i
        break
      }
    }
    if (lastUserIndex === -1) return

    const targetMessage = messages[lastUserIndex]
    if (!targetMessage) return
    const content = targetMessage.content
    const imageUrl = targetMessage.imageUrl
    const historyBeforeLastUser = messages.slice(0, lastUserIndex)

    setSessionMessages((prev) => new Map(prev).set(sessionKey, historyBeforeLastUser))

    await sendMessageInternal(content, historyBeforeLastUser, imageUrl)
  }, [messages, sessionKey, streamingSessionId, sendMessageInternal])

  return {
    messages,
    isLoading,
    isCurrentSessionLoading,
    streamingSessionId,
    isLoadingHistory,
    error,
    activeSessionId,
    sendMessage,
    regenerate,
    clearMessages,
    switchSession,
    newChat,
    loadMessages,
  }
}

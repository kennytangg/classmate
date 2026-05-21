'use client'

import { useState, useCallback, useEffect } from 'react'

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

export function useChat({ sessionId: initialSessionId }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(initialSessionId)

  const loadMessages = useCallback(async (sessionId: string) => {
    setIsLoadingHistory(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/messages`)
      if (!res.ok) return
      const data = (await res.json()) as { messages: StoredMessage[] }
      setMessages(
        data.messages.map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.createdAt),
        }))
      )
    } catch {
      // Silently fail — user can still start a new conversation
    } finally {
      setIsLoadingHistory(false)
    }
  }, [])

  // Load message history when an initial session is provided
  useEffect(() => {
    if (initialSessionId) {
      setActiveSessionId(initialSessionId)
      void loadMessages(initialSessionId)
    }
  }, [initialSessionId, loadMessages])

  const sendMessageInternal = useCallback(
    async (content: string, contextOverride?: Message[], imageUrl?: string) => {
      if (!content.trim() && !imageUrl) return
      if (isLoading) return

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        imageUrl,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)
      setError(null)

      const assistantMessageId = crypto.randomUUID()

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        },
      ])

      const msgContext = contextOverride ?? messages

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

        // Capture new session ID from header (set when server auto-creates a session)
        const returnedSessionId = response.headers.get('X-Session-Id')
        if (returnedSessionId && returnedSessionId !== activeSessionId) {
          setActiveSessionId(returnedSessionId)
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

          // Keep the last incomplete line in the buffer
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

              // OpenAI / Groq format: choices[0].delta.content
              const text = parsed.choices?.[0]?.delta?.content ?? parsed.text ?? ''

              if (text) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId ? { ...msg, content: msg.content + text } : msg
                  )
                )
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
        setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId))
      } finally {
        setIsLoading(false)
      }
    },
    [messages, activeSessionId, isLoading]
  )

  const sendMessage = useCallback(
    (content: string, imageUrl?: string) => sendMessageInternal(content, undefined, imageUrl),
    [sendMessageInternal]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  const switchSession = useCallback(
    async (sessionId: string) => {
      setMessages([])
      setError(null)
      setActiveSessionId(sessionId)
      await loadMessages(sessionId)
    },
    [loadMessages]
  )

  const newChat = useCallback(() => {
    setMessages([])
    setError(null)
    setActiveSessionId(undefined)
  }, [])

  const regenerate = useCallback(async () => {
    if (isLoading) return

    // Find the last user message from the end
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

    // Remove the last user message and any AI responses that follow it
    setMessages(historyBeforeLastUser)

    await sendMessageInternal(content, historyBeforeLastUser, imageUrl)
  }, [messages, isLoading, sendMessageInternal])

  return {
    messages,
    isLoading,
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

'use client'

import { useRef, useEffect, Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
import { ChatInterface } from 'components/features/ai-tutor/ChatInterface'
import { SessionSidebar } from 'components/features/ai-tutor/SessionSidebar'
import { useChat } from '../../../hooks/useChat'

function AITutorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''
  const autoSentRef = useRef(false)

  const {
    messages,
    isCurrentSessionLoading,
    streamingSessionId,
    isLoadingHistory,
    error,
    activeSessionId,
    sendMessage,
    regenerate,
    switchSession,
    newChat,
  } = useChat({})

  // Auto-send the query typed on the dashboard
  useEffect(() => {
    if (!initialQuery || autoSentRef.current || isLoadingHistory) return
    autoSentRef.current = true
    void sendMessage(initialQuery)
    // Clean the URL so a page refresh doesn't re-send the message
    router.replace('/ai-tutor', { scroll: false })
  }, [initialQuery, isLoadingHistory, sendMessage, router])

  const [showMobileSessions, setShowMobileSessions] = useState(false)

  const handleDeleteSession = (sessionId: string) => {
    if (sessionId === activeSessionId) {
      newChat()
    }
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Session Sidebar — desktop only */}
      <div className="border-border hidden h-full w-80 min-w-[280px] shrink-0 flex-col border-r md:flex">
        <SessionSidebar
          activeSessionId={activeSessionId}
          onSelectSession={switchSession}
          onNewChat={newChat}
          onDeleteSession={handleDeleteSession}
          streamingSessionId={streamingSessionId}
        />
      </div>

      {/* Chat Interface */}
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <ChatInterface
          messages={messages}
          isLoading={isCurrentSessionLoading}
          isLoadingHistory={isLoadingHistory}
          error={error}
          sendMessage={sendMessage}
          onRegenerate={regenerate}
        />
      </div>

      {/* Mobile Sessions Drawer */}
      {showMobileSessions && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileSessions(false)}
          />
          <div className="bg-card relative z-10 max-h-[70vh] overflow-hidden rounded-t-2xl">
            <div className="border-border flex items-center justify-between border-b px-4 py-3">
              <span className="text-foreground font-semibold">Chat History</span>
              <button
                onClick={() => setShowMobileSessions(false)}
                className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 57px)' }}>
              <SessionSidebar
                activeSessionId={activeSessionId}
                onSelectSession={(id) => {
                  switchSession(id)
                  setShowMobileSessions(false)
                }}
                onNewChat={() => {
                  newChat()
                  setShowMobileSessions(false)
                }}
                onDeleteSession={handleDeleteSession}
                streamingSessionId={streamingSessionId}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AITutorPage() {
  return (
    <Suspense>
      <AITutorContent />
    </Suspense>
  )
}

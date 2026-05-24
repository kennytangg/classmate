'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from 'components/ui/dialog'

interface ChatSession {
  id: string
  title: string
  updatedAt: string
  _count: { messages: number }
}

interface SessionSidebarProps {
  activeSessionId: string | undefined
  onSelectSession: (sessionId: string) => void
  onNewChat: () => void
  onDeleteSession: (sessionId: string) => void
  streamingSessionId?: string
}

type SessionGroup = 'Today' | 'Yesterday' | 'This Week' | 'Older'
const GROUP_ORDER: SessionGroup[] = ['Today', 'Yesterday', 'This Week', 'Older']

function getSessionGroup(updatedAt: string): SessionGroup {
  const date = new Date(updatedAt)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return 'This Week'
  return 'Older'
}

export function SessionSidebar({
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  streamingSessionId,
}: SessionSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions')
      if (!res.ok) return
      const data = (await res.json()) as { sessions: ChatSession[] }
      setSessions(data.sessions)
    } catch {
      // Silently fail — user can still chat
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchSessions()
  }, [fetchSessions, activeSessionId])

  const confirmDelete = async () => {
    if (!pendingDelete) return
    const { id } = pendingDelete
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/sessions?sessionId=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== id))
        onDeleteSession(id)
        setPendingDelete(null)
      } else {
        toast.error('Could not delete chat', { description: 'Please try again.' })
      }
    } catch {
      toast.error('Could not delete chat', { description: 'Check your connection and try again.' })
    } finally {
      setIsDeleting(false)
    }
  }

  // Group sessions by date
  const grouped = sessions.reduce<Map<SessionGroup, ChatSession[]>>((acc, session) => {
    const group = getSessionGroup(session.updatedAt)
    const existing = acc.get(group)
    if (existing) {
      existing.push(session)
    } else {
      acc.set(group, [session])
    }
    return acc
  }, new Map())

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="p-3">
          <button
            onClick={onNewChat}
            className="hover:bg-muted text-foreground flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {loading && <p className="text-muted-foreground px-3 py-1 text-xs">Loading...</p>}

          {!loading && sessions.length === 0 && (
            <p className="text-muted-foreground px-3 py-1 text-xs">No past chats yet.</p>
          )}

          {GROUP_ORDER.filter((g) => grouped.has(g)).map((group) => (
            <div key={group}>
              <p className="text-muted-foreground px-3 py-2 text-xs">{group}</p>
              {grouped.get(group)!.map((session) => (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onSelectSession(session.id)}
                  className={`group hover:bg-muted flex cursor-pointer items-center justify-between gap-1 rounded-lg px-3 py-1.5 transition-colors ${
                    session.id === activeSessionId ? 'bg-accent' : ''
                  }`}
                >
                  <p className="text-foreground truncate text-sm">{session.title}</p>
                  <div className="ml-auto flex shrink-0 items-center gap-1">
                    {streamingSessionId === session.id && session.id !== activeSessionId && (
                      <span
                        className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full"
                        title="AI is responding in this chat"
                      />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setPendingDelete({ id: session.id, title: session.title })
                      }}
                      className="text-muted-foreground hover:text-destructive hidden rounded p-0.5 transition-colors group-hover:block"
                      aria-label="Delete session"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <Dialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && !isDeleting && setPendingDelete(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete chat?</DialogTitle>
            <DialogDescription className="pt-1">
              &ldquo;{pendingDelete?.title}&rdquo; will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setPendingDelete(null)}
              disabled={isDeleting}
              className="hover:bg-muted text-foreground rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => void confirmDelete()}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground flex min-w-[72px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-80"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Deleting…
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

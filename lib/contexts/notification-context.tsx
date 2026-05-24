'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'

export interface Notification {
  id: string
  type: string
  message: string
  isRead: boolean
  sourceType: string | null
  sourceId: string | null
  createdAt: string
}

interface NotificationContextValue {
  notifications: Notification[]
  unreadCount: number
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  deleteAllRead: () => Promise<void>
  refresh: () => void
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  markRead: async () => {},
  markAllRead: async () => {},
  deleteNotification: async () => {},
  deleteAllRead: async () => {},
  refresh: () => {},
})

export function useNotificationContext(): NotificationContextValue {
  return useContext(NotificationContext)
}

const POLL_INTERVAL_MS = 15_000

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const seenIdsRef = useRef<Set<string> | null>(null)
  const pathnameRef = useRef(pathname)
  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = (await res.json()) as {
        notifications: Notification[]
        unreadCount: number
      }

      const incoming = data.notifications

      if (seenIdsRef.current === null) {
        seenIdsRef.current = new Set(incoming.map((n) => n.id))
      } else {
        for (const n of incoming) {
          if (!seenIdsRef.current.has(n.id)) {
            seenIdsRef.current.add(n.id)
            const current = pathnameRef.current
            const onChatPage = current.startsWith('/chat')
            const onThisForumPost =
              n.sourceType === 'forum_reply' &&
              n.sourceId != null &&
              current === `/forums/${n.sourceId}`
            if (onChatPage || onThisForumPost) continue
            if (localStorage.getItem('classmate_notif_popups') === 'false') continue
            const href =
              n.sourceType === 'chat' && n.sourceId
                ? `/chat/${n.sourceId}`
                : n.sourceType === 'connection_request' && n.sourceId
                  ? `/profile/${n.sourceId}`
                  : '/notifications'
            toast(n.message, {
              action: { label: 'View', onClick: () => router.push(href) },
            })
          }
        }
      }

      setNotifications(incoming)
      setUnreadCount(data.unreadCount)
    } catch {
      // non-critical — skip silently
    }
  }, [router])

  useEffect(() => {
    const initialFetch = setTimeout(() => void fetchNotifications(), 0)

    function startPolling() {
      intervalRef.current = setInterval(() => void fetchNotifications(), POLL_INTERVAL_MS)
    }

    function stopPolling() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        stopPolling()
      } else {
        void fetchNotifications()
        startPolling()
      }
    }

    startPolling()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearTimeout(initialFetch)
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchNotifications])

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }, [])

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    })
  }, [])

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    await fetch('/api/notifications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }, [])

  const deleteAllRead = useCallback(async () => {
    setNotifications((prev) => prev.filter((n) => !n.isRead))
    await fetch('/api/notifications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deleteAllRead: true }),
    })
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markRead,
        markAllRead,
        deleteNotification,
        deleteAllRead,
        refresh: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

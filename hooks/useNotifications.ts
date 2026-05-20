'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export interface Notification {
  id: string
  type: string
  message: string
  isRead: boolean
  sourceType: string | null
  sourceId: string | null
  createdAt: string
}

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  refresh: () => void
}

const POLL_INTERVAL_MS = 30_000

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = (await res.json()) as {
        notifications: Notification[]
        unreadCount: number
      }
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch {
      // silently ignore network errors
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchNotifications()

    function startPolling() {
      intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL_MS)
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
        fetchNotifications()
        startPolling()
      }
    }

    startPolling()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
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

  return { notifications, unreadCount, markRead, markAllRead, refresh: fetchNotifications }
}

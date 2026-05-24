'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationRow } from '@/components/features/notifications/NotificationRow'
import { useNotifications } from '@/hooks/useNotifications'
import type { Notification } from '@/hooks/useNotifications'

const PAGE_SIZE = 20
const NOTIF_POPUPS_KEY = 'classmate_notif_popups'

export default function NotificationsPage() {
  const router = useRouter()
  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    deleteNotification,
    deleteAllRead,
    refresh,
  } = useNotifications()
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [popupsEnabled, setPopupsEnabled] = useState(true)

  useEffect(() => {
    setPopupsEnabled(localStorage.getItem(NOTIF_POPUPS_KEY) !== 'false')
  }, [])

  useEffect(() => {
    if (unreadCount > 0) void markAllRead()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function togglePopups() {
    const next = !popupsEnabled
    setPopupsEnabled(next)
    localStorage.setItem(NOTIF_POPUPS_KEY, String(next))
  }

  function sourceUrl(n: Notification): string {
    if (n.sourceType === 'chat' && n.sourceId) return `/chat/${n.sourceId}`
    if (n.sourceType === 'forum_reply' && n.sourceId) return `/forums/${n.sourceId}`
    if (n.sourceType === 'connection_request' && n.sourceId) return `/profile/${n.sourceId}`
    return '/notifications'
  }

  async function handleClick(n: Notification) {
    if (!n.isRead) await markRead(n.id)
    router.push(sourceUrl(n))
  }

  const visible = notifications.slice(0, visibleCount)
  const hasMore = visibleCount < notifications.length
  const hasReadNotifications = notifications.some((n) => n.isRead)

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 md:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-muted-foreground mt-0.5 text-sm">{unreadCount} unread</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Pop-ups toggle */}
          <button
            onClick={togglePopups}
            className="flex items-center gap-2 text-sm"
            aria-label={
              popupsEnabled ? 'Disable pop-up notifications' : 'Enable pop-up notifications'
            }
          >
            <span className="text-muted-foreground">Pop-ups</span>
            <span
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${popupsEnabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${popupsEnabled ? 'translate-x-4' : 'translate-x-0'}`}
              />
            </span>
          </button>

          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              Mark all read
            </Button>
          )}

          {hasReadNotifications && (
            <Button variant="outline" size="sm" onClick={deleteAllRead}>
              Delete read
            </Button>
          )}
        </div>
      </div>

      <div className="border-border border-t">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Bell className="text-muted-foreground/30 h-10 w-10" />
            <p className="text-muted-foreground mt-1 font-medium">You&apos;re all caught up</p>
            <p className="text-muted-foreground/60 text-sm">New notifications will appear here</p>
          </div>
        ) : (
          visible.map((n) => (
            <NotificationRow
              key={n.id}
              notification={n}
              onClick={handleClick}
              onDelete={deleteNotification}
            />
          ))
        )}
      </div>

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            onClick={() => {
              setVisibleCount((c) => c + PAGE_SIZE)
              refresh()
            }}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}

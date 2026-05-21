'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationRow } from '@/components/features/notifications/NotificationRow'
import { useNotifications } from '@/hooks/useNotifications'
import type { Notification } from '@/hooks/useNotifications'

const PAGE_SIZE = 20

export default function NotificationsPage() {
  const router = useRouter()
  const { notifications, unreadCount, markRead, markAllRead, refresh } = useNotifications()
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  function sourceUrl(n: Notification): string {
    if (n.sourceType === 'chat' && n.sourceId) return `/chat/${n.sourceId}`
    if (n.sourceType === 'forum_reply' && n.sourceId) return `/forums/${n.sourceId}`
    return '/notifications'
  }

  async function handleClick(n: Notification) {
    if (!n.isRead) await markRead(n.id)
    router.push(sourceUrl(n))
  }

  const visible = notifications.slice(0, visibleCount)
  const hasMore = visibleCount < notifications.length

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 md:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-muted-foreground mt-0.5 text-sm">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      <div className="border-border border-t">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Bell className="text-muted-foreground/30 h-10 w-10" />
            <p className="text-muted-foreground mt-1 font-medium">You&apos;re all caught up</p>
            <p className="text-muted-foreground/60 text-sm">New notifications will appear here</p>
          </div>
        ) : (
          visible.map((n) => <NotificationRow key={n.id} notification={n} onClick={handleClick} />)
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

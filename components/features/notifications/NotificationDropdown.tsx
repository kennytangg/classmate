'use client'

import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotificationRow } from './NotificationRow'
import { useNotifications } from '@/hooks/useNotifications'
import type { Notification } from '@/hooks/useNotifications'
import Link from 'next/link'

export function NotificationDropdown() {
  const router = useRouter()
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()

  function sourceUrl(n: Notification): string {
    if (n.sourceType === 'chat' && n.sourceId) return `/chat/${n.sourceId}`
    if (n.sourceType === 'forum_reply' && n.sourceId) return `/forums/${n.sourceId}`
    return '/notifications'
  }

  async function handleClick(n: Notification) {
    if (!n.isRead) await markRead(n.id)
    router.push(sourceUrl(n))
  }

  const preview = notifications.slice(0, 5)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground relative rounded-lg"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] leading-none font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0" forceMount>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-blue-500 hover:underline">
              Mark all as read
            </button>
          )}
        </div>

        {/* Notification list */}
        <div className="max-h-80 overflow-y-auto py-1">
          {preview.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-8 text-center">
              <Bell className="text-muted-foreground/40 h-8 w-8" />
              <p className="text-muted-foreground text-sm">You&apos;re all caught up</p>
            </div>
          ) : (
            preview.map((n) => (
              <NotificationRow key={n.id} notification={n} onClick={handleClick} />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-2 text-center">
          <Link href="/notifications" className="text-xs text-blue-500 hover:underline">
            See all notifications
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

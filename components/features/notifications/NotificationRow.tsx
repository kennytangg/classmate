'use client'

import { MessageCircle, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Notification } from '@/hooks/useNotifications'

interface NotificationRowProps {
  notification: Notification
  onClick: (notification: Notification) => void
}

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  chat: <MessageCircle className="h-4 w-4 shrink-0 text-blue-500" />,
  forum_reply: <MessageSquare className="h-4 w-4 shrink-0 text-emerald-500" />,
}

export function NotificationRow({ notification, onClick }: NotificationRowProps) {
  const icon = TYPE_ICON[notification.type] ?? (
    <MessageCircle className="text-muted-foreground h-4 w-4 shrink-0" />
  )

  return (
    <button
      onClick={() => onClick(notification)}
      className={cn(
        'hover:bg-accent flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
        !notification.isRead && 'border-l-2 border-blue-500 bg-blue-500/5'
      )}
    >
      <span className="mt-0.5">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="text-foreground block text-sm leading-snug">{notification.message}</span>
        <span className="text-muted-foreground mt-0.5 block text-xs">
          {formatRelativeTime(notification.createdAt)}
        </span>
      </span>
      {!notification.isRead && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
      )}
    </button>
  )
}

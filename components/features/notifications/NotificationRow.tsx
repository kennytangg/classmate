'use client'

import { Calendar, MessageCircle, MessageSquare, UserPlus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Notification } from '@/hooks/useNotifications'

interface NotificationRowProps {
  notification: Notification
  onDelete?: (notification: Notification) => void
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
  connection_request: <UserPlus className="h-4 w-4 shrink-0 text-violet-500" />,
  event: <Calendar className="h-4 w-4 shrink-0 text-amber-500" />,
}

export function NotificationRow({ notification, onDelete }: NotificationRowProps) {
  const icon = TYPE_ICON[notification.type] ?? (
    <MessageCircle className="text-muted-foreground h-4 w-4 shrink-0" />
  )

  return (
    <div
      className={cn(
        'group hover:bg-muted/40 flex w-full items-start gap-3 rounded-lg px-4 py-3 transition-colors',
        !notification.isRead && 'bg-blue-500/[0.04]'
      )}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="text-foreground block text-sm leading-snug">{notification.message}</span>
        <span className="text-muted-foreground mt-1 block text-xs">
          {formatRelativeTime(notification.createdAt)}
        </span>
      </span>

      <div className="mt-1.5 flex shrink-0 items-center gap-2">
        {!notification.isRead && <span className="h-2 w-2 rounded-full bg-blue-500" />}
        {onDelete && (
          <button
            onClick={() => onDelete(notification)}
            className="text-muted-foreground/40 hover:text-semantic-error opacity-0 transition-all group-hover:opacity-100"
            aria-label="Delete notification"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

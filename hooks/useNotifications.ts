'use client'

import { useNotificationContext } from '@/lib/contexts/notification-context'
export type { Notification } from '@/lib/contexts/notification-context'

export function useNotifications() {
  return useNotificationContext()
}

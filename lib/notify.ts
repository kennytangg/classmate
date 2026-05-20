import { prisma } from '@/lib/prisma'

interface CreateNotificationInput {
  userId: string
  type: string
  message: string
  sourceType?: string
  sourceId?: string
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  if (input.sourceType === 'chat') {
    const existing = await prisma.notification.findFirst({
      where: {
        userId: input.userId,
        sourceType: 'chat',
        sourceId: input.sourceId,
        isRead: false,
      },
    })
    if (existing) return
  }

  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      message: input.message,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
    },
  })
}

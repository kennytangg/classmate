import { prisma } from '@/lib/prisma'

interface CreateNotificationInput {
  userId: string
  type: string
  message: string
  sourceType?: string
  sourceId?: string
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
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

const DAY_MS = 24 * 60 * 60 * 1000

function computeEventStart(date: Date, startTime: string | null): Date {
  const match = startTime ? /^(\d{2}):(\d{2})$/.exec(startTime) : null
  if (!match) return date

  const start = new Date(date)
  start.setHours(Number(match[1]), Number(match[2]), 0, 0)
  return start
}

// Generates "event starting now" notifications for events that have just started.
// Called lazily on each notifications poll; skips events that already have one.
export async function generateEventNotifications(userId: string): Promise<void> {
  const now = new Date()
  const cutoff = new Date(now.getTime() - DAY_MS)

  const memberships = await prisma.studyGroupMember.findMany({
    where: { userId },
    select: { groupId: true },
  })
  const memberGroupIds = memberships.map((m) => m.groupId)

  const events = await prisma.event.findMany({
    where: {
      // date is the calendar day; startTime can shift the actual start later within that day,
      // so widen the query window and filter precisely below with computeEventStart.
      date: { gte: new Date(cutoff.getTime() - DAY_MS), lte: now },
      OR: [
        { userId },
        ...(memberGroupIds.length > 0 ? [{ studyGroupId: { in: memberGroupIds } }] : []),
      ],
    },
    select: { id: true, title: true, date: true, startTime: true },
  })

  for (const event of events) {
    const start = computeEventStart(event.date, event.startTime)
    if (start > now || start <= cutoff) continue

    const existing = await prisma.notification.findFirst({
      where: { userId, sourceType: 'event', sourceId: event.id },
      select: { id: true },
    })
    if (existing) continue

    await createNotification({
      userId,
      type: 'event',
      message: `Your session "${event.title}" is starting now`,
      sourceType: 'event',
      sourceId: event.id,
    })
  }
}

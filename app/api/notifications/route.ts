import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, generalLimiter } from '@/lib/rate-limit'

const patchSchema = z.object({
  id: z.string().optional(),
  markAllRead: z.boolean().optional(),
})

// GET /api/notifications — fetch latest 20 notifications for the current user
export async function GET(_req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = await checkRateLimit(session.id, generalLimiter)
    if (limited) return limited

    const notifications = await prisma.notification.findMany({
      where: { userId: session.id },
      orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
      take: 20,
      select: {
        id: true,
        type: true,
        message: true,
        isRead: true,
        sourceType: true,
        sourceId: true,
        createdAt: true,
      },
    })

    const unreadCount = await prisma.notification.count({
      where: { userId: session.id, isRead: false },
    })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error('[GET /api/notifications]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/notifications — mark one or all as read
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = patchSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { id, markAllRead } = parsed.data

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: session.id, isRead: false },
        data: { isRead: true },
      })
      return NextResponse.json({ ok: true })
    }

    if (id) {
      await prisma.notification.updateMany({
        where: { id, userId: session.id },
        data: { isRead: true },
      })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Provide id or markAllRead' }, { status: 400 })
  } catch (error) {
    console.error('[PATCH /api/notifications]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, generalLimiter, writeLimiter } from '@/lib/rate-limit'
import { createConnectionSchema } from '@/lib/schemas'
import { zodErrorToString } from '@/lib/errors'
import { createNotification } from '@/lib/notify'

// POST /api/connections — send a connection request
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = await checkRateLimit(session.id, writeLimiter)
    if (limited) return limited

    const parsed = createConnectionSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: zodErrorToString(parsed.error) }, { status: 400 })
    }
    const { recipientId } = parsed.data

    if (session.id === recipientId) {
      return NextResponse.json({ error: 'Cannot connect with yourself' }, { status: 400 })
    }

    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true },
    })

    if (!recipient) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if a connection already exists in either direction
    const existing = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: session.id, recipientId },
          { senderId: recipientId, recipientId: session.id },
        ],
      },
    })

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        return NextResponse.json({ error: 'Already connected' }, { status: 409 })
      }
      if (existing.senderId === session.id) {
        return NextResponse.json({ error: 'Connection request already sent' }, { status: 409 })
      }
      // Reverse request exists — auto-accept mutual connection
      const updated = await prisma.connection.update({
        where: { id: existing.id },
        data: { status: 'ACCEPTED' },
      })
      return NextResponse.json({ connection: updated }, { status: 200 })
    }

    const connection = await prisma.connection.create({
      data: {
        senderId: session.id,
        recipientId,
        status: 'PENDING',
      },
    })

    ;(async () => {
      try {
        const senderName = session.name ?? session.email?.split('@')[0] ?? 'Someone'
        await createNotification({
          userId: recipientId,
          type: 'connection_request',
          message: `${senderName} sent you a connection request`,
          sourceType: 'connection_request',
          sourceId: session.id,
        })
      } catch (err) {
        console.error('[notify] connection_request notification failed:', err)
      }
    })()

    return NextResponse.json({ connection }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// GET /api/connections?userId=xxx&status=accepted|pending_received|pending_sent
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = await checkRateLimit(session.id, generalLimiter)
    if (limited) return limited

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') ?? 'accepted'

    let connections

    if (status === 'accepted') {
      connections = await prisma.connection.findMany({
        where: {
          OR: [
            { senderId: session.id, status: 'ACCEPTED' },
            { recipientId: session.id, status: 'ACCEPTED' },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              profile: {
                select: { displayName: true, avatarUrl: true, university: true, major: true },
              },
            },
          },
          recipient: {
            select: {
              id: true,
              name: true,
              profile: {
                select: { displayName: true, avatarUrl: true, university: true, major: true },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      })
    } else if (status === 'pending_received') {
      connections = await prisma.connection.findMany({
        where: { recipientId: session.id, status: 'PENDING' },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              profile: {
                select: { displayName: true, avatarUrl: true, university: true, major: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    } else if (status === 'pending_sent') {
      connections = await prisma.connection.findMany({
        where: { senderId: session.id, status: 'PENDING' },
        include: {
          recipient: {
            select: {
              id: true,
              name: true,
              profile: {
                select: { displayName: true, avatarUrl: true, university: true, major: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    } else {
      return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 })
    }

    return NextResponse.json({ connections })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

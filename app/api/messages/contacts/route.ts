import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, generalLimiter } from '@/lib/rate-limit'

// GET /api/messages/contacts
// Returns only users the current user is connected with (accepted connections).
export async function GET(_req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = await checkRateLimit(session.id, generalLimiter)
    if (limited) return limited

    const connections = await prisma.connection.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ senderId: session.id }, { recipientId: session.id }],
      },
      select: {
        sender: {
          select: {
            id: true,
            email: true,
            name: true,
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        },
        recipient: {
          select: {
            id: true,
            email: true,
            name: true,
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    const contacts = connections.map((conn) => {
      const user = conn.sender.id === session.id ? conn.recipient : conn.sender
      return {
        id: user.id,
        email: user.email,
        displayName: user.profile?.displayName ?? user.name ?? null,
        avatarUrl: user.profile?.avatarUrl ?? null,
      }
    })

    return NextResponse.json({ contacts })
  } catch (error) {
    console.error('[GET /api/messages/contacts]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

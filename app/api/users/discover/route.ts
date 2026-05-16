import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getConnectionStatus, getMutualConnectionCount } from '@/lib/connections'
import { checkRateLimit, generalLimiter } from '@/lib/rate-limit'

const PAGE_SIZE = 20

type DiscoverFilter = 'discover' | 'connected' | 'pending' | 'all'

async function getFilteredUserIds(
  sessionId: string,
  filter: DiscoverFilter
): Promise<{ in: string[] } | { notIn: string[] } | null> {
  if (filter === 'all') return null

  const connections = await prisma.connection.findMany({
    where: {
      OR: [{ senderId: sessionId }, { recipientId: sessionId }],
    },
    select: { senderId: true, recipientId: true, status: true },
  })

  const connectedIds = connections
    .filter((c) => c.status === 'ACCEPTED')
    .map((c) => (c.senderId === sessionId ? c.recipientId : c.senderId))

  const pendingIds = connections
    .filter((c) => c.status === 'PENDING')
    .map((c) => (c.senderId === sessionId ? c.recipientId : c.senderId))

  const allConnectedIds = [...connectedIds, ...pendingIds]

  if (filter === 'connected') return { in: connectedIds }
  if (filter === 'pending') return { in: pendingIds }
  // discover: users with no connection to current user
  return { notIn: allConnectedIds }
}

// GET /api/users/discover?page=1&search=xxx&filter=discover
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = await checkRateLimit(session.id, generalLimiter)
    if (limited) return limited

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const search = searchParams.get('search') ?? ''
    const rawFilter = searchParams.get('filter') ?? 'discover'
    const filter: DiscoverFilter = ['discover', 'connected', 'pending', 'all'].includes(rawFilter)
      ? (rawFilter as DiscoverFilter)
      : 'discover'

    const idFilter = await getFilteredUserIds(session.id, filter)

    const where = {
      id: {
        not: session.id,
        ...(idFilter ?? {}),
      },
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { profile: { displayName: { contains: search, mode: 'insensitive' as const } } },
              { profile: { university: { contains: search, mode: 'insensitive' as const } } },
              { profile: { major: { contains: search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
          profile: {
            select: {
              displayName: true,
              avatarUrl: true,
              bio: true,
              university: true,
              major: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.user.count({ where }),
    ])

    // Attach connection status and mutual connection count for each user
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const [{ status, connectionId }, mutualConnectionCount] = await Promise.all([
          getConnectionStatus(session.id, user.id),
          filter === 'discover'
            ? getMutualConnectionCount(session.id, user.id)
            : Promise.resolve(0),
        ])
        return { ...user, connectionStatus: status, connectionId, mutualConnectionCount }
      })
    )

    return NextResponse.json({
      users: usersWithStatus,
      meta: {
        total,
        page,
        limit: PAGE_SIZE,
        pages: Math.ceil(total / PAGE_SIZE),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

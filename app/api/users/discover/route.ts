import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
type ConnectionStatus = 'connected' | 'pending_sent' | 'pending_received' | 'not_connected'
import { checkRateLimit, generalLimiter } from '@/lib/rate-limit'

const PAGE_SIZE = 20

type DiscoverFilter = 'discover' | 'connected' | 'pending' | 'all'

interface ConnectionData {
  idFilter: { in: string[] } | { notIn: string[] } | null
  connLookup: Map<string, { id: string; status: ConnectionStatus }>
  acceptedNeighborIds: Set<string>
}

async function getConnectionData(
  sessionId: string,
  filter: DiscoverFilter
): Promise<ConnectionData> {
  if (filter === 'all') {
    return { idFilter: null, connLookup: new Map(), acceptedNeighborIds: new Set() }
  }

  const connections = await prisma.connection.findMany({
    where: { OR: [{ senderId: sessionId }, { recipientId: sessionId }] },
    select: { id: true, senderId: true, recipientId: true, status: true },
  })

  const connectedIds: string[] = []
  const pendingIds: string[] = []
  const acceptedNeighborIds = new Set<string>()
  const connLookup = new Map<string, { id: string; status: ConnectionStatus }>()

  for (const c of connections) {
    const otherId = c.senderId === sessionId ? c.recipientId : c.senderId
    if (c.status === 'ACCEPTED') {
      connectedIds.push(otherId)
      acceptedNeighborIds.add(otherId)
      connLookup.set(otherId, { id: c.id, status: 'connected' })
    } else if (c.status === 'PENDING') {
      pendingIds.push(otherId)
      connLookup.set(otherId, {
        id: c.id,
        status: c.senderId === sessionId ? 'pending_sent' : 'pending_received',
      })
    }
  }

  const idFilter =
    filter === 'connected'
      ? { in: connectedIds }
      : filter === 'pending'
        ? { in: pendingIds }
        : { notIn: [...connectedIds, ...pendingIds] }

  return { idFilter, connLookup, acceptedNeighborIds }
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

    const { idFilter, connLookup, acceptedNeighborIds } = await getConnectionData(
      session.id,
      filter
    )

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

    // Batch load page-user connections for mutual count (1 query instead of N×2)
    const mutualCountMap = new Map<string, number>()
    if (filter === 'discover' && users.length > 0) {
      const pageUserIds = users.map((u) => u.id)
      const pageUserIdSet = new Set(pageUserIds)
      const pageConnections = await prisma.connection.findMany({
        where: {
          status: 'ACCEPTED',
          AND: [
            { OR: [{ senderId: { in: pageUserIds } }, { recipientId: { in: pageUserIds } }] },
            { senderId: { not: session.id } },
            { recipientId: { not: session.id } },
          ],
        },
        select: { senderId: true, recipientId: true },
      })
      for (const pageUserId of pageUserIds) mutualCountMap.set(pageUserId, 0)
      for (const conn of pageConnections) {
        if (pageUserIdSet.has(conn.senderId) && acceptedNeighborIds.has(conn.recipientId)) {
          mutualCountMap.set(conn.senderId, (mutualCountMap.get(conn.senderId) ?? 0) + 1)
        }
        if (pageUserIdSet.has(conn.recipientId) && acceptedNeighborIds.has(conn.senderId)) {
          mutualCountMap.set(conn.recipientId, (mutualCountMap.get(conn.recipientId) ?? 0) + 1)
        }
      }
    }

    // Attach connection status and mutual count — all resolved from in-memory lookups
    const usersWithStatus = users.map((user) => {
      const conn = connLookup.get(user.id)
      return {
        ...user,
        connectionStatus: conn?.status ?? 'not_connected',
        connectionId: conn?.id ?? null,
        mutualConnectionCount: mutualCountMap.get(user.id) ?? 0,
      }
    })

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

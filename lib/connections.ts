import { prisma } from '@/lib/prisma'

type ConnectionStatus = 'connected' | 'pending_sent' | 'pending_received' | 'not_connected'

interface ConnectionStatusResult {
  status: ConnectionStatus
  connectionId: string | null
}

/**
 * Get the connection status between two users.
 * Returns the status and the connection ID (if one exists).
 */
export async function getConnectionStatus(
  currentUserId: string,
  otherUserId: string
): Promise<ConnectionStatusResult> {
  if (currentUserId === otherUserId) {
    return { status: 'not_connected', connectionId: null }
  }

  const connection = await prisma.connection.findFirst({
    where: {
      OR: [
        { senderId: currentUserId, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: currentUserId },
      ],
    },
    select: { id: true, status: true, senderId: true },
  })

  if (!connection) {
    return { status: 'not_connected', connectionId: null }
  }

  if (connection.status === 'ACCEPTED') {
    return { status: 'connected', connectionId: connection.id }
  }

  if (connection.status === 'PENDING') {
    if (connection.senderId === currentUserId) {
      return { status: 'pending_sent', connectionId: connection.id }
    }
    return { status: 'pending_received', connectionId: connection.id }
  }

  return { status: 'not_connected', connectionId: null }
}

/**
 * Count the number of accepted connections for a user.
 */
export async function getConnectionCount(userId: string): Promise<number> {
  return prisma.connection.count({
    where: {
      OR: [
        { senderId: userId, status: 'ACCEPTED' },
        { recipientId: userId, status: 'ACCEPTED' },
      ],
    },
  })
}

/**
 * Count pending connection requests received by a user (not yet accepted/rejected).
 */
export async function getPendingConnectionCount(userId: string): Promise<number> {
  return prisma.connection.count({
    where: { recipientId: userId, status: 'PENDING' },
  })
}

/**
 * Count mutual connections between two users via a single SQL query.
 */
export async function getMutualConnectionCount(userIdA: string, userIdB: string): Promise<number> {
  const result = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) AS count
    FROM (
      SELECT CASE WHEN "senderId" = ${userIdA} THEN "recipientId" ELSE "senderId" END AS neighbor_id
      FROM "Connection"
      WHERE status = 'ACCEPTED'
        AND ("senderId" = ${userIdA} OR "recipientId" = ${userIdA})
    ) a
    WHERE a.neighbor_id IN (
      SELECT CASE WHEN "senderId" = ${userIdB} THEN "recipientId" ELSE "senderId" END
      FROM "Connection"
      WHERE status = 'ACCEPTED'
        AND ("senderId" = ${userIdB} OR "recipientId" = ${userIdB})
    )
    AND a.neighbor_id != ${userIdA}
    AND a.neighbor_id != ${userIdB}
  `
  return Number(result[0].count)
}

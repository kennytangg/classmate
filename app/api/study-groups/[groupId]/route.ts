import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { checkRateLimit, generalLimiter } from '@/lib/rate-limit'

// GET /api/study-groups/[groupId]
export async function GET(_req: NextRequest, context: { params: Promise<{ groupId: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await checkRateLimit(session.id, generalLimiter)
  if (limited) return limited

  const { groupId } = await context.params

  try {
    const group = await prisma.studyGroup.findUnique({
      where: { id: groupId },
      include: {
        owner: { select: { id: true, name: true, image: true } },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                profile: { select: { avatarUrl: true } },
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    })

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    const isCurrentUserMember = group.members.some((m) => m.userId === session.id)
    const isCurrentUserOwner = group.ownerId === session.id

    // Only expose inviteCode to the owner
    const { inviteCode, ...groupWithoutCode } = group
    return NextResponse.json({
      ...groupWithoutCode,
      ...(isCurrentUserOwner ? { inviteCode } : {}),
      memberCount: group.members.length,
      isCurrentUserMember,
      isCurrentUserOwner,
    })
  } catch (err) {
    console.error('[GET /api/study-groups/[groupId]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

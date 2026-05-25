import { randomBytes } from 'crypto'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { checkRateLimit, writeLimiter } from '@/lib/rate-limit'

// POST /api/study-groups/[groupId]/invite-code — regenerate invite code (owner only)
export async function POST(_req: NextRequest, context: { params: Promise<{ groupId: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await checkRateLimit(session.id, writeLimiter)
  if (limited) return limited

  const { groupId } = await context.params

  try {
    const group = await prisma.studyGroup.findUnique({ where: { id: groupId } })
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    if (group.ownerId !== session.id)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (!group.isPrivate)
      return NextResponse.json({ error: 'Public groups do not use invite codes' }, { status: 403 })

    const inviteCode = randomBytes(4).toString('hex').toUpperCase()
    await prisma.studyGroup.update({ where: { id: groupId }, data: { inviteCode } })

    return NextResponse.json({ inviteCode })
  } catch (err) {
    console.error('[POST /api/study-groups/[groupId]/invite-code]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

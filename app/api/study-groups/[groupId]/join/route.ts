import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, writeLimiter } from '@/lib/rate-limit'
import { getSession } from '@/lib/auth'
import { joinGroupSchema } from '@/lib/schemas'

// POST /api/study-groups/[groupId]/join
export async function POST(req: NextRequest, context: { params: Promise<{ groupId: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { groupId } = await context.params
  const rawJoinBody = await req.json().catch(() => ({}))
  const joinParsed = joinGroupSchema.safeParse(rawJoinBody)
  const { inviteCode } = joinParsed.success ? joinParsed.data : {}
  const userId = session.id

  const limited = await checkRateLimit(userId, writeLimiter)
  if (limited) return limited

  try {
    const group = await prisma.studyGroup.findUnique({ where: { id: groupId } })
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    // Check private group invite code
    if (group.isPrivate && group.inviteCode !== inviteCode)
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 403 })

    // Check if already a member
    const existing = await prisma.studyGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    })
    if (existing) return NextResponse.json({ error: 'Already a member' }, { status: 400 })

    await prisma.$transaction(async (tx) => {
      await tx.studyGroupMember.create({
        data: { groupId, userId, role: 'member' },
      })

      await tx.studyGroup.update({
        where: { id: groupId },
        data: { memberCount: { increment: 1 } },
      })
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/study-groups/[groupId]/join]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/study-groups/[groupId]/join — leave group
export async function DELETE(req: NextRequest, context: { params: Promise<{ groupId: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { groupId } = await context.params
  const userId = session.id

  const limited = await checkRateLimit(userId, writeLimiter)
  if (limited) return limited

  try {
    const deleted = await prisma.studyGroupMember.deleteMany({
      where: { groupId, userId },
    })

    if (deleted.count > 0) {
      await prisma.studyGroup.update({
        where: { id: groupId },
        data: { memberCount: { decrement: 1 } },
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/study-groups/[groupId]/join]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

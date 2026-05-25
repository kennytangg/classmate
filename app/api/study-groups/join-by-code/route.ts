import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { checkRateLimit, writeLimiter } from '@/lib/rate-limit'
import { z } from 'zod'

const schema = z.object({
  inviteCode: z.string().min(1).max(8),
})

// POST /api/study-groups/join-by-code
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await checkRateLimit(session.id, writeLimiter)
  if (limited) return limited

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success)
    return NextResponse.json({ error: 'inviteCode is required' }, { status: 400 })

  const { inviteCode } = parsed.data
  const userId = session.id

  try {
    const group = await prisma.studyGroup.findFirst({
      where: { inviteCode: inviteCode.toUpperCase() },
    })
    if (!group) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })

    const existing = await prisma.studyGroupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId } },
    })
    if (existing)
      return NextResponse.json({ error: 'Already a member', groupId: group.id }, { status: 400 })

    await prisma.$transaction(async (tx) => {
      await tx.studyGroupMember.create({
        data: { groupId: group.id, userId, role: 'member' },
      })
      await tx.studyGroup.update({
        where: { id: group.id },
        data: { memberCount: { increment: 1 } },
      })
    })

    return NextResponse.json({ groupId: group.id })
  } catch (err) {
    console.error('[POST /api/study-groups/join-by-code]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

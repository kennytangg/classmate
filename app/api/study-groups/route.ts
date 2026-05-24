import { randomBytes } from 'crypto'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { checkRateLimit, writeLimiter } from '@/lib/rate-limit'
import { sanitizeText } from '@/lib/sanitize'
import { getErrorResponse, zodErrorToString } from '@/lib/errors'
import { createStudyGroupSchema } from '@/lib/schemas'

// GET /api/study-groups?search=math&myGroups=true&excludeMyGroups=true
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim() ?? ''
  const myGroups = searchParams.get('myGroups')
  const excludeMyGroups = searchParams.get('excludeMyGroups') === 'true'
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '12', 10) || 12))

  const searchFilter = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { subject: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  try {
    let groups
    let total: number

    if (myGroups === 'true') {
      const session = await getSession()
      if (!session) {
        return NextResponse.json({
          groups: [],
          meta: { total: 0, page: 1, limit, pages: 1 },
        })
      }
      const where = {
        members: { some: { userId: session.id } },
        ...searchFilter,
      }
      total = await prisma.studyGroup.count({ where })
      groups = await prisma.studyGroup.findMany({
        where,
        include: {
          owner: { include: { profile: true } },
          _count: { select: { members: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      })
    } else {
      // Optionally exclude groups the current user has already joined
      let excludeUserId: string | undefined
      if (excludeMyGroups) {
        const session = await getSession()
        if (session) excludeUserId = session.id
      }

      const where = {
        isPrivate: false,
        ...searchFilter,
        ...(excludeUserId ? { members: { none: { userId: excludeUserId } } } : {}),
      }
      total = await prisma.studyGroup.count({ where })
      groups = await prisma.studyGroup.findMany({
        where,
        include: {
          owner: { include: { profile: true } },
          _count: { select: { members: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      })
    }

    return NextResponse.json({
      groups,
      meta: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) },
    })
  } catch (err) {
    console.error('[GET /api/study-groups]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/study-groups — create a group
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limited = await checkRateLimit(session.id, writeLimiter)
  if (limited) return limited

  const parsed = createStudyGroupSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: zodErrorToString(parsed.error) }, { status: 400 })
  }
  const { name, subject, description, isPrivate } = parsed.data

  const sanitizedName = sanitizeText(name)
  const sanitizedSubject = sanitizeText(subject)
  const sanitizedDescription = description ? sanitizeText(description) : null

  if (!sanitizedName || !sanitizedSubject)
    return NextResponse.json({ error: 'name and subject must contain valid text' }, { status: 400 })

  // Always use the authenticated session user as the owner — never trust client-supplied ownerId
  const ownerId = session.id

  try {
    const inviteCode = randomBytes(3).toString('hex').toUpperCase()

    const group = await prisma.$transaction(async (tx) => {
      const newGroup = await tx.studyGroup.create({
        data: {
          name: sanitizedName,
          description: sanitizedDescription ?? null,
          subject: sanitizedSubject,
          ownerId,
          isPrivate: isPrivate ?? false,
          inviteCode,
        },
      })

      // Auto-add owner as member with role 'owner'
      await tx.studyGroupMember.create({
        data: { groupId: newGroup.id, userId: ownerId, role: 'owner' },
      })

      return newGroup
    })

    return NextResponse.json({ group })
  } catch (err) {
    console.error('[POST /api/study-groups]', err)
    const { message, status } = getErrorResponse(err)
    return NextResponse.json({ error: message }, { status })
  }
}

// DELETE /api/study-groups?groupId=xxx
export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const groupId = searchParams.get('groupId')
  if (!groupId) return NextResponse.json({ error: 'groupId is required' }, { status: 400 })

  try {
    // Only delete if the authenticated user is the owner — no client-supplied userId needed
    await prisma.studyGroup.deleteMany({
      where: { id: groupId, ownerId: session.id },
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/study-groups]', err)
    const { message, status } = getErrorResponse(err)
    return NextResponse.json({ error: message }, { status })
  }
}

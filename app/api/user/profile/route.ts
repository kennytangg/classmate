import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, generalLimiter, writeLimiter, getClientIp } from '@/lib/rate-limit'
import { getErrorResponse, zodErrorToString } from '@/lib/errors'
import { updateProfileSchema } from '@/lib/schemas'
import { getSession } from '@/lib/auth'

// GET /api/user/profile?userId=xxx
export async function GET(req: NextRequest) {
  const limited = await checkRateLimit(getClientIp(req), generalLimiter)
  if (limited) return limited

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  try {
    const [user, profile] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.userProfile.findUnique({ where: { userId } }),
    ])

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        displayName: profile?.displayName ?? null,
        bio: profile?.bio ?? null,
        university: profile?.university ?? null,
        major: profile?.major ?? null,
        avatarUrl: profile?.avatarUrl ?? null,
      },
    })
  } catch (err) {
    console.error('[GET /api/user/profile]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/user/profile — update profile
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await checkRateLimit(session.id, writeLimiter)
  if (limited) return limited

  const parsed = updateProfileSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: zodErrorToString(parsed.error) }, { status: 400 })
  }
  const { userId, displayName, bio, university, major, avatarUrl } = parsed.data

  if (userId !== session.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        ...(displayName !== undefined && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(university !== undefined && { university }),
        ...(major !== undefined && { major }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      create: {
        userId,
        displayName: displayName ?? null,
        bio: bio ?? null,
        university: university ?? null,
        major: major ?? null,
        avatarUrl: avatarUrl ?? null,
      },
    })
    return NextResponse.json({ profile })
  } catch (err) {
    console.error('[PATCH /api/user/profile]', err)
    const { message, status } = getErrorResponse(err)
    return NextResponse.json({ error: message }, { status })
  }
}

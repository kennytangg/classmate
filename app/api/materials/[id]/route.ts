import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canModerate, requireRole } from '@/lib/authorize'
import { sanitizeText } from '@/lib/sanitize'
import { checkRateLimit, generalLimiter, writeLimiter, getClientIp } from '@/lib/rate-limit'
import { updateMaterialSchema } from '@/lib/schemas'
import { zodErrorToString } from '@/lib/errors'
import { deleteFile } from '@/lib/storage'

const USER_SELECT = {
  select: {
    id: true,
    email: true,
    profile: { select: { displayName: true, avatarUrl: true } },
  },
} as const

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const limited = await checkRateLimit(getClientIp(request), generalLimiter)
    if (limited) return limited

    const { id } = await context.params

    const material = await prisma.studyMaterial.findUnique({
      where: { id },
      include: { user: USER_SELECT },
    })

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    return NextResponse.json({ material }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch material' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = await checkRateLimit(session.id, writeLimiter)
    if (limited) return limited

    const { id } = await context.params

    const material = await prisma.studyMaterial.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    const authorized = await canModerate(session, material.userId)
    if (!authorized) {
      return NextResponse.json({ error: 'Not authorized to edit this material' }, { status: 403 })
    }

    const matParsed = updateMaterialSchema.safeParse(await request.json())
    if (!matParsed.success) {
      return NextResponse.json({ error: zodErrorToString(matParsed.error) }, { status: 400 })
    }
    const { title: titleRaw, description: descriptionRaw } = matParsed.data

    const data: Record<string, unknown> = {}
    if (titleRaw !== undefined) {
      const sanitized = sanitizeText(titleRaw)
      if (!sanitized)
        return NextResponse.json({ error: 'title must contain valid text' }, { status: 400 })
      data.title = sanitized
    }
    if (descriptionRaw !== undefined) {
      data.description = descriptionRaw ? sanitizeText(descriptionRaw) || null : null
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const updated = await prisma.studyMaterial.update({
      where: { id },
      data,
      include: { user: USER_SELECT },
    })

    return NextResponse.json({ material: updated }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Failed to update material' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = await checkRateLimit(session.id, writeLimiter)
    if (limited) return limited

    const { id } = await context.params

    const material = await prisma.studyMaterial.findUnique({
      where: { id },
      select: { userId: true, fileUrl: true },
    })

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    const isUploader = session.id === material.userId
    const isOwnerRole = await requireRole(session, ['OWNER'])
    if (!isUploader && !isOwnerRole) {
      return NextResponse.json({ error: 'Not authorized to delete this material' }, { status: 403 })
    }

    await prisma.studyMaterial.delete({ where: { id } })
    await deleteFile(material.fileUrl)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 })
  }
}

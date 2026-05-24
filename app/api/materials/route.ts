import path from 'path'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadFile } from '@/lib/storage'
import { sanitizeText } from '@/lib/sanitize'
import { checkRateLimit, writeLimiter } from '@/lib/rate-limit'
import { getErrorResponse } from '@/lib/errors'

const ALLOWED_FILE_TYPES = ['pdf'] as const

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024

type SortBy = 'createdAt' | 'downloads'

function normalizeSortBy(input: string | null): SortBy {
  if (input === 'downloads') {
    return input
  }
  return 'createdAt'
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const sortBy = normalizeSortBy(searchParams.get('sortBy'))
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10) || 10))

    const where: { userId?: string } = {}
    if (userId) {
      where.userId = userId
    }

    const orderBy =
      sortBy === 'downloads' ? { downloads: 'desc' as const } : { createdAt: 'desc' as const }

    const total = await prisma.studyMaterial.count({ where })

    const materials = await prisma.studyMaterial.findMany({
      where,
      orderBy,
      take: limit,
      skip: (page - 1) * limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      materials,
      meta: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) },
    })
  } catch (error) {
    console.error('Materials GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = await checkRateLimit(session.id, writeLimiter)
    if (limited) return limited

    const formData = await request.formData()

    const file = formData.get('file')
    const titleRaw = formData.get('title')

    if (!(file instanceof File) || !titleRaw) {
      return NextResponse.json({ error: 'file and title are required' }, { status: 400 })
    }

    const fileExt = path.extname(file.name).toLowerCase().replace('.', '')
    if (!ALLOWED_FILE_TYPES.includes(fileExt as (typeof ALLOWED_FILE_TYPES)[number])) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_FILE_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File size exceeds 50MB limit (${MAX_FILE_SIZE_BYTES} bytes)` },
        { status: 400 }
      )
    }

    const sanitizedTitle = sanitizeText(String(titleRaw))

    if (!sanitizedTitle) {
      return NextResponse.json({ error: 'title must contain valid text' }, { status: 400 })
    }

    if (sanitizedTitle.length > 60) {
      return NextResponse.json({ error: 'Title must be 60 characters or fewer' }, { status: 400 })
    }

    const fileUrl = await uploadFile(file, session.id)

    const createdMaterial = await prisma.studyMaterial.create({
      data: {
        userId: session.id,
        title: sanitizedTitle,
        fileUrl,
        fileType: fileExt,
        fileSize: file.size,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        },
      },
    })

    return NextResponse.json({ material: createdMaterial }, { status: 201 })
  } catch (error) {
    console.error('Materials POST error:', error)
    const { message, status } = getErrorResponse(error)
    return NextResponse.json({ error: message }, { status })
  }
}

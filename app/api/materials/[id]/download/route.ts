import { Readable } from 'stream'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, writeLimiter } from '@/lib/rate-limit'
import { getFileStream } from '@/lib/storage'

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
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
      select: { id: true, fileUrl: true, title: true, fileType: true },
    })

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    if (!material.fileUrl.startsWith('/uploads/')) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
    }

    // Guard against path traversal
    if (material.fileUrl.includes('..')) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
    }

    await prisma.studyMaterial.update({
      where: { id },
      data: { downloads: { increment: 1 } },
    })

    const nodeStream = await getFileStream(material.fileUrl)
    if (!nodeStream) {
      return NextResponse.json({ error: 'Failed to retrieve file' }, { status: 500 })
    }
    const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>
    const filename = `${material.title}.${material.fileType}`

    return new NextResponse(webStream, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    })
  } catch (error) {
    console.error('Material download error:', error)
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}

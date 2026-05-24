import { Readable } from 'stream'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getFileStream } from '@/lib/storage'

const PREVIEW_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  txt: 'text/plain; charset=utf-8',
  md: 'text/plain; charset=utf-8',
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const material = await prisma.studyMaterial.findUnique({
      where: { id },
      select: { fileUrl: true, title: true, fileType: true },
    })

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    if (!material.fileUrl.startsWith('/uploads/') || material.fileUrl.includes('..')) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
    }

    const fileType = (material.fileType ?? '').toLowerCase()
    const mimeType = PREVIEW_MIME[fileType]
    if (!mimeType) {
      return NextResponse.json(
        { error: 'Preview not available for this file type' },
        { status: 415 }
      )
    }

    const nodeStream = await getFileStream(material.fileUrl)
    const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>

    return new NextResponse(webStream, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(material.title)}.${fileType}"`,
        'X-Frame-Options': 'SAMEORIGIN',
      },
    })
  } catch (error) {
    console.error('Material preview error:', error)
    return NextResponse.json({ error: 'Preview failed' }, { status: 500 })
  }
}

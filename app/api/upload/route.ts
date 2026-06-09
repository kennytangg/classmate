import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getSession } from '@/lib/auth'
import { checkRateLimit, writeLimiter } from '@/lib/rate-limit'
import { uploadRaw, validateMimeFromBuffer } from '@/lib/storage'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'txt',
  'zip',
])
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/zip',
])

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = await checkRateLimit(session.id, writeLimiter)
    if (limited) return limited

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }
    try {
      await validateMimeFromBuffer(file, '.' + ext)
    } catch (validationError) {
      return NextResponse.json(
        {
          error:
            validationError instanceof Error ? validationError.message : 'File validation failed',
        },
        { status: 400 }
      )
    }

    const safeName = `${randomUUID()}.${ext}`
    const objectKey = `uploads/chat/${safeName}`

    const bytes = await file.arrayBuffer()
    await uploadRaw(objectKey, Buffer.from(bytes), file.type)

    return NextResponse.json({
      fileUrl: `/${objectKey}`,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    })
  } catch (error) {
    console.error('[POST /api/upload]', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

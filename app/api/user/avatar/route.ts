import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadFile, deleteFile } from '@/lib/storage'

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Only JPG, PNG, and WebP images are allowed' },
      { status: 400 }
    )
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File must be under 5 MB' }, { status: 400 })
  }

  let avatarUrl: string
  try {
    avatarUrl = await uploadFile(file, session.id)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const existing = await prisma.userProfile.findUnique({
    where: { userId: session.id },
    select: { avatarUrl: true },
  })
  const oldUrl = existing?.avatarUrl ?? null

  try {
    await prisma.userProfile.upsert({
      where: { userId: session.id },
      create: { userId: session.id, avatarUrl },
      update: { avatarUrl },
    })
  } catch {
    await deleteFile(avatarUrl)
    return NextResponse.json({ error: 'Failed to save avatar' }, { status: 500 })
  }

  if (oldUrl) {
    await deleteFile(oldUrl)
  }

  return NextResponse.json({ avatarUrl })
}

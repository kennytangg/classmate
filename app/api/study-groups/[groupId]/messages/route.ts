import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeMarkdown } from '@/lib/sanitize'
import { checkRateLimit, generalLimiter, writeLimiter } from '@/lib/rate-limit'
import { studyGroupMessageSchema } from '@/lib/schemas'
import { zodErrorToString } from '@/lib/errors'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

function parseLimit(input: string | null): number {
  if (!input) return DEFAULT_LIMIT
  const value = Number.parseInt(input, 10)
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_LIMIT
  return Math.min(value, MAX_LIMIT)
}

async function isMember(groupId: string, userId: string): Promise<boolean> {
  const membership = await prisma.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  })
  return membership !== null
}

// GET /api/study-groups/[groupId]/messages?limit=50&cursor=ISO_DATE
export async function GET(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = await checkRateLimit(session.id, generalLimiter)
    if (limited) return limited

    const { groupId } = await params

    const group = await prisma.studyGroup.findUnique({
      where: { id: groupId },
      select: { id: true, name: true, subject: true, memberCount: true, ownerId: true },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const member = await isMember(groupId, session.id)
    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseLimit(searchParams.get('limit'))
    const cursor = searchParams.get('cursor')

    const cursorDate = cursor ? new Date(cursor) : null
    if (cursor && (!cursorDate || Number.isNaN(cursorDate.getTime()))) {
      return NextResponse.json({ error: 'Invalid cursor value' }, { status: 400 })
    }

    const messages = await prisma.studyGroupMessage.findMany({
      where: {
        groupId,
        ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        senderId: true,
        content: true,
        fileUrl: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            name: true,
            profile: {
              select: { displayName: true, avatarUrl: true },
            },
          },
        },
      },
    })

    const ordered = [...messages].reverse()
    const nextCursor =
      messages.length === limit && messages.at(-1)
        ? (messages.at(-1)?.createdAt.toISOString() ?? null)
        : null

    return NextResponse.json({
      group,
      messages: ordered.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        content: m.content,
        fileUrl: m.fileUrl ?? null,
        fileName: m.fileName ?? null,
        fileType: m.fileType ?? null,
        fileSize: m.fileSize ?? null,
        createdAt: m.createdAt,
        sender: {
          id: m.sender.id,
          displayName: m.sender.profile?.displayName ?? m.sender.name ?? 'User',
          avatarUrl: m.sender.profile?.avatarUrl ?? null,
        },
      })),
      pagination: { limit, nextCursor },
    })
  } catch (error) {
    console.error('[GET /api/study-groups/[groupId]/messages]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/study-groups/[groupId]/messages
export async function POST(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = await checkRateLimit(session.id, writeLimiter)
    if (limited) return limited

    const { groupId } = await params

    const group = await prisma.studyGroup.findUnique({ where: { id: groupId } })
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const member = await isMember(groupId, session.id)
    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const msgParsed = studyGroupMessageSchema.safeParse(await request.json())
    if (!msgParsed.success) {
      return NextResponse.json({ error: zodErrorToString(msgParsed.error) }, { status: 400 })
    }
    const sanitizedContent = sanitizeMarkdown(msgParsed.data.content).trim()
    const { fileUrl, fileName, fileType, fileSize } = msgParsed.data

    if (!sanitizedContent && !fileUrl) {
      return NextResponse.json({ error: 'Message must have text or a file' }, { status: 400 })
    }

    const message = await prisma.studyGroupMessage.create({
      data: {
        groupId,
        senderId: session.id,
        content: sanitizedContent,
        fileUrl,
        fileName,
        fileType,
        fileSize,
      },
      select: {
        id: true,
        senderId: true,
        content: true,
        fileUrl: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            name: true,
            profile: {
              select: { displayName: true, avatarUrl: true },
            },
          },
        },
      },
    })

    const senderDisplayName = message.sender.profile?.displayName ?? message.sender.name ?? 'User'
    const notifMessage = `${senderDisplayName} sent a message in ${group.name}`

    // Notify all other group members (fire-and-forget — never block the response)
    void notifyGroupMembers(groupId, session.id, notifMessage)

    return NextResponse.json(
      {
        message: {
          id: message.id,
          senderId: message.senderId,
          content: message.content,
          fileUrl: message.fileUrl ?? null,
          fileName: message.fileName ?? null,
          fileType: message.fileType ?? null,
          fileSize: message.fileSize ?? null,
          createdAt: message.createdAt,
          sender: {
            id: message.sender.id,
            displayName: senderDisplayName,
            avatarUrl: message.sender.profile?.avatarUrl ?? null,
          },
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/study-groups/[groupId]/messages]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function notifyGroupMembers(
  groupId: string,
  senderId: string,
  notifMessage: string
): Promise<void> {
  try {
    const members = await prisma.studyGroupMember.findMany({
      where: { groupId, NOT: { userId: senderId } },
      select: { userId: true },
    })

    if (members.length === 0) return

    const memberIds = members.map((m) => m.userId)

    // Find existing unread group_chat notifications for this group
    const existing = await prisma.notification.findMany({
      where: {
        userId: { in: memberIds },
        sourceType: 'group_chat',
        sourceId: groupId,
        isRead: false,
      },
      select: { id: true, userId: true },
    })

    const existingUserIds = new Set(existing.map((n) => n.userId))
    const newUserIds = memberIds.filter((id) => !existingUserIds.has(id))

    // Update existing unread notifications so they bubble back up
    if (existing.length > 0) {
      await prisma.notification.updateMany({
        where: { id: { in: existing.map((n) => n.id) } },
        data: { message: notifMessage, createdAt: new Date() },
      })
    }

    // Create fresh notifications for members with no existing unread one
    if (newUserIds.length > 0) {
      await prisma.notification.createMany({
        data: newUserIds.map((userId) => ({
          userId,
          type: 'group_chat',
          message: notifMessage,
          sourceType: 'group_chat',
          sourceId: groupId,
        })),
      })
    }
  } catch (err) {
    console.error('[notifyGroupMembers]', err)
  }
}

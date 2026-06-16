import { NextRequest } from 'next/server'
import { GET, PATCH, DELETE } from '@/app/api/notifications/route'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateEventNotifications } from '@/lib/notify'

jest.mock('@/lib/auth', () => ({ getSession: jest.fn() }))
jest.mock('@/lib/prisma')
jest.mock('@/lib/notify', () => ({
  generateEventNotifications: jest.fn().mockResolvedValue(undefined),
  createNotification: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockResolvedValue(null),
  generalLimiter: {},
}))

afterEach(() => {
  jest.clearAllMocks()
})

// ─── GET /api/notifications ───────────────────────────────────────────────────

describe('GET /api/notifications', () => {
  it('returns 401 when unauthenticated', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/notifications')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns notifications and unread count', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1' })
    ;(prisma.notification.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'n-1',
        type: 'chat',
        message: 'Alice sent you a message',
        isRead: false,
        sourceType: 'chat',
        sourceId: 'user-2',
        createdAt: new Date(),
      },
    ])
    ;(prisma.notification.count as jest.Mock).mockResolvedValue(1)

    const req = new NextRequest('http://localhost/api/notifications')
    const res = await GET(req)
    const body = (await res.json()) as { notifications: unknown[]; unreadCount: number }

    expect(res.status).toBe(200)
    expect(body.notifications).toHaveLength(1)
    expect(body.unreadCount).toBe(1)
  })

  it('calls generateEventNotifications on each poll', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1' })
    ;(prisma.notification.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.notification.count as jest.Mock).mockResolvedValue(0)

    const req = new NextRequest('http://localhost/api/notifications')
    await GET(req)

    expect(generateEventNotifications).toHaveBeenCalledWith('user-1')
  })
})

// ─── PATCH /api/notifications ─────────────────────────────────────────────────

describe('PATCH /api/notifications', () => {
  it('returns 401 when unauthenticated', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ markAllRead: true }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req)
    expect(res.status).toBe(401)
  })

  it('marks a single notification as read', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1' })
    ;(prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 1 })

    const req = new NextRequest('http://localhost/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ id: 'n-1' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
    expect(prisma.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: 'n-1', userId: 'user-1' }) })
    )
  })

  it('marks all notifications as read', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1' })
    ;(prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 5 })

    const req = new NextRequest('http://localhost/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ markAllRead: true }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
    expect(prisma.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-1', isRead: false }),
      })
    )
  })

  it('returns 400 when neither id nor markAllRead is provided', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1' })

    const req = new NextRequest('http://localhost/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
  })
})

// ─── DELETE /api/notifications ────────────────────────────────────────────────

describe('DELETE /api/notifications', () => {
  it('returns 401 when unauthenticated', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/notifications', {
      method: 'DELETE',
      body: JSON.stringify({ deleteAllRead: true }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await DELETE(req)
    expect(res.status).toBe(401)
  })

  it('deletes a single read notification belonging to the user', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1' })
    ;(prisma.notification.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })

    const req = new NextRequest('http://localhost/api/notifications', {
      method: 'DELETE',
      body: JSON.stringify({ id: 'n-1' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await DELETE(req)
    expect(res.status).toBe(200)
    expect(prisma.notification.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: 'n-1', userId: 'user-1' }) })
    )
  })

  it('deletes all read notifications for the user', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1' })
    ;(prisma.notification.deleteMany as jest.Mock).mockResolvedValue({ count: 3 })

    const req = new NextRequest('http://localhost/api/notifications', {
      method: 'DELETE',
      body: JSON.stringify({ deleteAllRead: true }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await DELETE(req)
    expect(res.status).toBe(200)
    expect(prisma.notification.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-1', isRead: true }),
      })
    )
  })
})

// ─── generateEventNotifications ───────────────────────────────────────────────

describe('generateEventNotifications', () => {
  type NotifyModule = { generateEventNotifications: (userId: string) => Promise<void> }
  const { generateEventNotifications: realGenerate } =
    jest.requireActual<NotifyModule>('@/lib/notify')

  afterEach(() => jest.clearAllMocks())

  it('creates a notification for an event that just started', async () => {
    const now = new Date()
    const eventId = 'evt-1'

    ;(prisma.studyGroupMember.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.event.findMany as jest.Mock).mockResolvedValue([
      { id: eventId, title: 'Study session', date: now, startTime: null },
    ])
    ;(prisma.notification.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 1 })

    await realGenerate('user-1')

    expect(prisma.notification.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ userId: 'user-1', type: 'event', sourceId: eventId }),
        ]),
        skipDuplicates: true,
      })
    )
  })

  it('skips events that already have a notification', async () => {
    const now = new Date()
    const eventId = 'evt-2'

    ;(prisma.studyGroupMember.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.event.findMany as jest.Mock).mockResolvedValue([
      { id: eventId, title: 'Already notified', date: now, startTime: null },
    ])
    ;(prisma.notification.findMany as jest.Mock).mockResolvedValue([{ sourceId: eventId }])
    ;(prisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 0 })

    await realGenerate('user-1')

    expect(prisma.notification.createMany).not.toHaveBeenCalled()
  })
})

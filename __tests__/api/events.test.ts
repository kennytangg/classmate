import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/events/route'
import { PATCH, DELETE } from '@/app/api/events/[id]/route'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/auth', () => ({
  getSession: jest.fn(),
}))

jest.mock('@/lib/prisma')

afterEach(() => {
  jest.clearAllMocks()
})

describe('/api/events GET', () => {
  it('returns 401 for unauthenticated requests', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)

    const res = await GET()

    expect(res.status).toBe(401)
  })

  it('returns only current user events', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.studyGroupMember.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.event.findMany as jest.Mock).mockResolvedValue([{ id: 'event-1' }])

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.events).toEqual([{ id: 'event-1' }])
    expect(prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ userId: 'user-1' }] },
      })
    )
  })
})

describe('/api/events POST', () => {
  it('creates an event and sanitizes text fields', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.event.create as jest.Mock).mockResolvedValue({ id: 'event-1' })

    const req = new NextRequest('http://localhost/api/events', {
      method: 'POST',
      body: JSON.stringify({
        title: '<script>alert(1)</script>Study Session',
        description: '<b>Linear Algebra</b>',
        date: '2026-04-10T09:00:00.000Z',
        startTime: '09:00',
        endTime: '10:00',
        category: '<img src=x onerror=alert(1)>Math',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)

    expect(res.status).toBe(201)
    expect(prisma.event.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          title: 'Study Session',
          description: 'Linear Algebra',
          category: 'Math',
          startTime: '09:00',
          endTime: '10:00',
        }),
      })
    )
  })

  it('returns 400 for invalid payload', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })

    const req = new NextRequest('http://localhost/api/events', {
      method: 'POST',
      body: JSON.stringify({
        title: '',
        date: 'invalid-date',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)

    expect(res.status).toBe(400)
  })
})

describe('/api/events/[id] PATCH', () => {
  it('returns 403 for non-owner non-admin', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-2', email: 'u2@test.com' })
    ;(prisma.event.findUnique as jest.Mock).mockResolvedValue({ id: 'event-1', userId: 'user-1' })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'STUDENT' })

    const req = new NextRequest('http://localhost/api/events/event-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await PATCH(req, { params: Promise.resolve({ id: 'event-1' }) })

    expect(res.status).toBe(403)
  })
})

describe('/api/events/[id] DELETE', () => {
  it('allows owner to delete event', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.event.findUnique as jest.Mock).mockResolvedValue({ id: 'event-1', userId: 'user-1' })

    const req = new NextRequest('http://localhost/api/events/event-1', {
      method: 'DELETE',
    })

    const res = await DELETE(req, { params: Promise.resolve({ id: 'event-1' }) })

    expect(res.status).toBe(200)
    expect(prisma.event.delete).toHaveBeenCalledWith({ where: { id: 'event-1' } })
  })
})

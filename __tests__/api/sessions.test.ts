import { NextRequest } from 'next/server'
import { GET, POST, DELETE } from '@/app/api/sessions/route'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

jest.mock('@/lib/prisma')
jest.mock('@/lib/auth', () => ({ getSession: jest.fn() }))

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>

const AUTHED_USER = { id: 'user-1', email: 'user@test.com', name: 'Test User', image: null }

afterEach(() => {
  jest.clearAllMocks()
})

// ─── GET /api/sessions ────────────────────────────────────────────────────────

describe('GET /api/sessions', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValueOnce(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns 200 with sessions array for the authenticated user', async () => {
    mockGetSession.mockResolvedValueOnce(AUTHED_USER)
    const mockSessions = [
      {
        id: 'session-1',
        userId: 'user-1',
        title: 'Calculus Help',
        updatedAt: new Date(),
        _count: { messages: 5 },
      },
    ]
    ;(prisma.chatSession.findMany as jest.Mock).mockResolvedValueOnce(mockSessions)

    const res = await GET()

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('sessions')
    expect(Array.isArray(body.sessions)).toBe(true)
    expect(body.sessions).toHaveLength(1)
    expect(body.sessions[0].id).toBe('session-1')
    // Must query using the session user's ID, not an arbitrary param
    expect(prisma.chatSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } })
    )
  })

  it('returns an empty sessions array when the user has no sessions', async () => {
    mockGetSession.mockResolvedValueOnce(AUTHED_USER)
    ;(prisma.chatSession.findMany as jest.Mock).mockResolvedValueOnce([])

    const res = await GET()

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.sessions).toHaveLength(0)
  })
})

// ─── POST /api/sessions ───────────────────────────────────────────────────────

describe('POST /api/sessions', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 200 and creates a session with default title when title is omitted', async () => {
    mockGetSession.mockResolvedValueOnce(AUTHED_USER)
    const mockSession = {
      id: 'new-session-id',
      userId: 'user-1',
      title: 'New Session',
    }
    ;(prisma.chatSession.create as jest.Mock).mockResolvedValueOnce(mockSession)

    const req = new NextRequest('http://localhost/api/sessions', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('session')
    expect(body.session.id).toBe('new-session-id')
    expect(prisma.chatSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          title: 'New Session',
        }),
      })
    )
  })

  it('returns 200 and creates a session with the provided title', async () => {
    mockGetSession.mockResolvedValueOnce(AUTHED_USER)
    const mockSession = {
      id: 'session-cs',
      userId: 'user-1',
      title: 'Data Structures Q&A',
    }
    ;(prisma.chatSession.create as jest.Mock).mockResolvedValueOnce(mockSession)

    const req = new NextRequest('http://localhost/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ title: 'Data Structures Q&A' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.session.title).toBe('Data Structures Q&A')
  })
})

// ─── DELETE /api/sessions ─────────────────────────────────────────────────────

describe('DELETE /api/sessions', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/sessions?sessionId=session-1')
    const res = await DELETE(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when sessionId query param is missing', async () => {
    mockGetSession.mockResolvedValueOnce(AUTHED_USER)
    const req = new NextRequest('http://localhost/api/sessions')
    const res = await DELETE(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/sessionId/i)
  })

  it('returns 404 when session does not belong to the authenticated user', async () => {
    mockGetSession.mockResolvedValueOnce(AUTHED_USER)
    ;(prisma.chatSession.findFirst as jest.Mock).mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost/api/sessions?sessionId=other-session')
    const res = await DELETE(req)
    expect(res.status).toBe(404)
  })

  it('returns 200 and deletes messages before deleting the session', async () => {
    mockGetSession.mockResolvedValueOnce(AUTHED_USER)
    ;(prisma.chatSession.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 'session-1',
      userId: 'user-1',
    })
    ;(prisma.chatMessage.deleteMany as jest.Mock).mockResolvedValueOnce({ count: 3 })
    ;(prisma.chatSession.delete as jest.Mock).mockResolvedValueOnce({ id: 'session-1' })

    const req = new NextRequest('http://localhost/api/sessions?sessionId=session-1')
    const res = await DELETE(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)

    // Messages must be deleted before the session (foreign key order)
    const deleteManyOrder = (prisma.chatMessage.deleteMany as jest.Mock).mock.invocationCallOrder[0]
    const deleteOrder = (prisma.chatSession.delete as jest.Mock).mock.invocationCallOrder[0]
    expect(deleteManyOrder).toBeLessThan(deleteOrder)
  })
})

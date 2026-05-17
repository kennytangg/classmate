import { GET as getConversations } from '@/app/api/messages/conversations/route'
import {
  GET as getThread,
  POST as postMessage,
} from '@/app/api/messages/conversations/[userId]/route'
import { POST as markRead } from '@/app/api/messages/conversations/[userId]/read/route'
import { GET as getContacts } from '@/app/api/messages/contacts/route'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/auth', () => ({
  getSession: jest.fn(),
}))

jest.mock('@/lib/prisma')

jest.mock('@/lib/connections', () => ({
  getConnectionStatus: jest.fn().mockResolvedValue({ status: 'connected', connectionId: 'conn-1' }),
}))

jest.mock('@/lib/sanitize', () => ({
  sanitizeMarkdown: (value: string) => value,
}))

afterEach(() => {
  jest.clearAllMocks()
})

describe('Messages API', () => {
  it('returns 401 for unauthenticated conversation list requests', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)

    const res = await getConversations()

    expect(res.status).toBe(401)
  })

  it('returns 400 when sending invalid content', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-2' })

    const req = new Request('http://localhost/api/messages/conversations/user-2', {
      method: 'POST',
      body: JSON.stringify({ content: '   ' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await postMessage(req, { params: Promise.resolve({ userId: 'user-2' }) })

    expect(res.status).toBe(400)
  })

  it('returns 403 for forbidden self-thread access', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })

    const req = new Request('http://localhost/api/messages/conversations/user-1?limit=50')

    const res = await getThread(req, { params: Promise.resolve({ userId: 'user-1' }) })

    expect(res.status).toBe(403)
  })

  it('returns 201 and persists a valid message', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-2' })
    ;(prisma.chatMessage.create as jest.Mock).mockResolvedValue({
      id: 'message-1',
      senderId: 'user-1',
      recipientId: 'user-2',
      content: 'Hello there',
      isRead: false,
      createdAt: new Date('2026-03-20T10:00:00.000Z'),
    })

    const req = new Request('http://localhost/api/messages/conversations/user-2', {
      method: 'POST',
      body: JSON.stringify({ content: 'Hello there' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await postMessage(req, { params: Promise.resolve({ userId: 'user-2' }) })

    expect(res.status).toBe(201)
    expect(prisma.chatMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          senderId: 'user-1',
          recipientId: 'user-2',
          content: 'Hello there',
        }),
      })
    )
  })

  it('marks unread messages as read and returns updated count', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-2' })
    ;(prisma.chatMessage.updateMany as jest.Mock).mockResolvedValue({ count: 3 })

    const req = new Request('http://localhost/api/messages/conversations/user-2/read', {
      method: 'POST',
    })

    const res = await markRead(req, { params: Promise.resolve({ userId: 'user-2' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.updatedCount).toBe(3)
    expect(prisma.chatMessage.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          senderId: 'user-2',
          recipientId: 'user-1',
          isRead: false,
        }),
      })
    )
  })

  it('returns 401 for unauthenticated contacts requests', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)

    const req = new Request('http://localhost/api/messages/contacts')
    const res = await getContacts(req)

    expect(res.status).toBe(401)
  })

  it('returns all users except current user', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.connection.findMany as jest.Mock).mockResolvedValue([
      {
        sender: { id: 'user-1', email: 'u1@test.com', name: null, profile: null },
        recipient: {
          id: 'user-2',
          email: 'b@test.com',
          name: null,
          profile: { displayName: 'Bob', avatarUrl: null },
        },
      },
      {
        sender: { id: 'user-1', email: 'u1@test.com', name: null, profile: null },
        recipient: { id: 'user-3', email: 'c@test.com', name: null, profile: null },
      },
    ])

    const req = new Request('http://localhost/api/messages/contacts')
    const res = await getContacts(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.contacts).toHaveLength(2)
    expect(body.contacts[0]).toEqual({
      id: 'user-2',
      email: 'b@test.com',
      displayName: 'Bob',
      avatarUrl: null,
    })
    expect(prisma.connection.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'ACCEPTED' }),
      })
    )
  })

  it('returns null displayName and avatarUrl for users without a profile', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.connection.findMany as jest.Mock).mockResolvedValue([
      {
        sender: { id: 'user-1', email: 'u1@test.com', name: null, profile: null },
        recipient: { id: 'user-2', email: 'b@test.com', name: null, profile: null },
      },
    ])

    const req = new Request('http://localhost/api/messages/contacts')
    const res = await getContacts(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.contacts[0].displayName).toBeNull()
    expect(body.contacts[0].avatarUrl).toBeNull()
  })

  it('returns empty contacts list when no other users exist', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.connection.findMany as jest.Mock).mockResolvedValue([])

    const req = new Request('http://localhost/api/messages/contacts')
    const res = await getContacts(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.contacts).toEqual([])
  })

  it('supports cursor pagination for thread messages', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-2',
      email: 'u2@test.com',
      profile: null,
    })
    ;(prisma.chatMessage.findMany as jest.Mock).mockResolvedValue([])

    const req = new Request(
      'http://localhost/api/messages/conversations/user-2?limit=20&cursor=2026-03-20T00:00:00.000Z'
    )

    const res = await getThread(req, { params: Promise.resolve({ userId: 'user-2' }) })

    expect(res.status).toBe(200)
    const callArg = (prisma.chatMessage.findMany as jest.Mock).mock.calls[0][0] as {
      take: number
      where: {
        AND: Array<Record<string, unknown>>
      }
    }

    expect(callArg.take).toBe(20)
    expect(callArg.where.AND).toHaveLength(2)
  })
})

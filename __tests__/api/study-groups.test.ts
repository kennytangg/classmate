// app/api/study-groups/__tests__/route.test.ts
import { NextRequest } from 'next/server'
import { GET, POST, DELETE } from '@/app/api/study-groups/route'
import { POST as joinByCode } from '@/app/api/study-groups/join-by-code/route'

jest.mock('@/lib/auth', () => ({ getSession: jest.fn() }))
jest.mock('@/lib/prisma')
jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockResolvedValue(null),
  generalLimiter: {},
  writeLimiter: {},
}))
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

afterEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/study-groups', () => {
  it('returns 200 with an empty groups array when no filters are applied', async () => {
    ;(prisma.studyGroup.findMany as jest.Mock).mockResolvedValue([])
    const req = new NextRequest('http://localhost/api/study-groups')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = (await res.json()) as { groups: unknown[] }
    expect(Array.isArray(body.groups)).toBe(true)
  })
})

describe('POST /api/study-groups', () => {
  it('returns 400 when name is missing', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1' })
    const req = new NextRequest('http://localhost/api/study-groups', {
      method: 'POST',
      body: JSON.stringify({ subject: 'Math' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('returns 400 when subject is missing', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1' })
    const req = new NextRequest('http://localhost/api/study-groups', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Group' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('returns 400 when name is only 1 character', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1' })
    const req = new NextRequest('http://localhost/api/study-groups', {
      method: 'POST',
      body: JSON.stringify({ name: 'A', subject: 'Math' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toMatch(/at least 2/i)
  })

  it('returns 400 when name exceeds 100 characters', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1' })
    const req = new NextRequest('http://localhost/api/study-groups', {
      method: 'POST',
      body: JSON.stringify({ name: 'A'.repeat(101), subject: 'Math' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/study-groups', () => {
  it('returns 400 when groupId is missing', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1' })
    const req = new NextRequest(
      'http://localhost/api/study-groups?userId=user-1'
      // groupId intentionally omitted
    )
    const res = await DELETE(req)

    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toMatch(/groupId/i)
  })

  it('returns 200 when only groupId is provided (userId not required)', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1' })
    ;(prisma.studyGroup.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })
    const req = new NextRequest(
      'http://localhost/api/study-groups?groupId=group-1'
      // userId not needed — handler uses session.id
    )
    const res = await DELETE(req)

    expect(res.status).toBe(200)
  })

  it('returns 400 when groupId is missing entirely', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1' })
    const req = new NextRequest('http://localhost/api/study-groups')
    const res = await DELETE(req)

    expect(res.status).toBe(400)
  })
})

describe('POST /api/study-groups/join-by-code', () => {
  it('returns 401 when unauthenticated', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/study-groups/join-by-code', {
      method: 'POST',
      body: JSON.stringify({ inviteCode: 'ABC123' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await joinByCode(req)

    expect(res.status).toBe(401)
  })

  it('returns 400 when inviteCode is missing', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1' })
    const req = new NextRequest('http://localhost/api/study-groups/join-by-code', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await joinByCode(req)

    expect(res.status).toBe(400)
  })

  it('returns 404 when invite code does not match any group', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1' })
    ;(prisma.studyGroup.findFirst as jest.Mock).mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/study-groups/join-by-code', {
      method: 'POST',
      body: JSON.stringify({ inviteCode: 'NOPE99' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await joinByCode(req)

    expect(res.status).toBe(404)
  })

  it('returns 400 when user is already a member', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1' })
    ;(prisma.studyGroup.findFirst as jest.Mock).mockResolvedValue({ id: 'group-1' })
    ;(prisma.studyGroupMember.findUnique as jest.Mock).mockResolvedValue({
      groupId: 'group-1',
      userId: 'user-1',
    })
    const req = new NextRequest('http://localhost/api/study-groups/join-by-code', {
      method: 'POST',
      body: JSON.stringify({ inviteCode: 'ABC123' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await joinByCode(req)

    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toMatch(/already a member/i)
  })

  it('returns 200 with groupId on successful join', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1' })
    ;(prisma.studyGroup.findFirst as jest.Mock).mockResolvedValue({ id: 'group-1' })
    ;(prisma.studyGroupMember.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.$transaction as jest.Mock).mockResolvedValue(undefined)
    const req = new NextRequest('http://localhost/api/study-groups/join-by-code', {
      method: 'POST',
      body: JSON.stringify({ inviteCode: 'ABC123' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await joinByCode(req)

    expect(res.status).toBe(200)
    const body = (await res.json()) as { groupId: string }
    expect(body.groupId).toBe('group-1')
  })
})

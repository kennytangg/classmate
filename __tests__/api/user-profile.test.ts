// app/api/user/profile/__tests__/route.test.ts
import { NextRequest } from 'next/server'
import { GET, PATCH } from '@/app/api/user/profile/route'

jest.mock('@/lib/auth', () => ({ getSession: jest.fn() }))
jest.mock('@/lib/prisma')
jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockResolvedValue(null),
  getClientIp: jest.fn().mockReturnValue(null),
  writeLimiter: {},
  generalLimiter: {},
}))

import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

afterEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/user/profile', () => {
  it('returns 400 when userId query param is missing', async () => {
    const req = new NextRequest('http://localhost/api/user/profile')
    const res = await GET(req)

    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toMatch(/userId/i)
  })

  it('returns 200 when userId is provided', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' })
    ;(prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/user/profile?userId=user-1')
    const res = await GET(req)

    expect(res.status).toBe(200)
  })
})

describe('PATCH /api/user/profile', () => {
  beforeEach(() => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1' })
  })

  it('returns 400 when userId is missing from request body', async () => {
    const req = new NextRequest('http://localhost/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify({ display_name: 'Alice' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req)

    expect(res.status).toBe(400)
  })

  it('returns 200 when userId is present', async () => {
    ;(prisma.userProfile.upsert as jest.Mock).mockResolvedValue({ userId: 'user-1' })
    const req = new NextRequest('http://localhost/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify({ userId: 'user-1', display_name: 'Alice' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req)

    expect(res.status).toBe(200)
  })

  it('returns 400 when displayName is only 1 character', async () => {
    const req = new NextRequest('http://localhost/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify({ userId: 'user-1', displayName: 'A' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req)

    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toMatch(/at least 2/i)
  })

  it('returns 400 when displayName exceeds 50 characters', async () => {
    const req = new NextRequest('http://localhost/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify({ userId: 'user-1', displayName: 'A'.repeat(51) }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req)

    expect(res.status).toBe(400)
  })

  it('returns 400 when bio exceeds 500 characters', async () => {
    const req = new NextRequest('http://localhost/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify({ userId: 'user-1', bio: 'b'.repeat(501) }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req)

    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toMatch(/bio/i)
  })
})

import { GET } from '@/app/api/recommendations/threads/route'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/auth', () => ({
  getSession: jest.fn(),
}))

jest.mock('@/lib/prisma')

afterEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/recommendations/threads', () => {
  it('returns 401 when unauthenticated', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)

    const res = await GET()

    expect(res.status).toBe(401)
    expect(prisma.forumPost.findMany).not.toHaveBeenCalled()
  })

  it('returns deterministic recommendations with reasons', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      forumPosts: [
        {
          tags: [{ name: 'calculus' }],
        },
      ],
    })
    ;(prisma.flaggedContent.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'post-a',
        title: 'Integration techniques',
        createdAt: new Date('2026-03-20T08:00:00.000Z'),
        upvotes: 4,
        views: 80,
        repliesCount: 6,
        tags: [{ name: 'calculus' }],
      },
      {
        id: 'post-b',
        title: 'History essay tips',
        createdAt: new Date('2026-03-18T08:00:00.000Z'),
        upvotes: 1,
        views: 12,
        repliesCount: 0,
        tags: [{ name: 'essay' }],
      },
    ])

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.fallbackUsed).toBe(false)
    expect(data.recommendations[0].id).toBe('post-a')
    expect(data.recommendations[0].reason).toBeTruthy()
    expect(typeof data.recommendations[0].score).toBe('number')
  })

  it('uses fallback mode when user has sparse history', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-2', email: 'u2@test.com' })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ forumPosts: [] })
    ;(prisma.flaggedContent.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'post-1',
        title: 'General discussion thread',
        createdAt: new Date('2026-03-19T10:00:00.000Z'),
        upvotes: 2,
        views: 50,
        repliesCount: 3,
        tags: [{ name: 'general' }],
      },
    ])

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.fallbackUsed).toBe(true)
    expect(data.recommendations).toHaveLength(1)
    expect(data.recommendations[0].reason).toContain('discussion')
  })

  it('excludes blocked or flagged-ineligible posts', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-3', email: 'u3@test.com' })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ forumPosts: [] })
    ;(prisma.flaggedContent.findMany as jest.Mock).mockResolvedValue([
      { contentId: 'post-blocked-1' },
      { contentId: 'post-blocked-2' },
    ])
    ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'post-safe-1',
        title: 'Allowed thread',
        createdAt: new Date('2026-03-19T10:00:00.000Z'),
        upvotes: 2,
        views: 50,
        repliesCount: 3,
        tags: [{ name: 'biology' }],
      },
    ])

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.recommendations).toHaveLength(1)
    expect(data.recommendations[0].id).toBe('post-safe-1')
    expect(prisma.forumPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { notIn: ['post-blocked-1', 'post-blocked-2'] } },
      })
    )
  })
})

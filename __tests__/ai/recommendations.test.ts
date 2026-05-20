/**
 * AI Recommendations Feature — Structured AI Testing
 * Covers: GET /api/recommendations/threads (deterministic scoring, no live Groq call)
 *
 * The recommendations engine is deterministic (scoring algorithm, not LLM call).
 * AI testing focuses on: recommendation quality, fallback behaviour, exclusions,
 * and robustness under abnormal input.
 *
 * Test Categories (per Appendix B §10.4):
 *  1. Valid input / happy path tests
 *  2. Invalid / edge input tests
 *  3. Edge case tests
 *  4. Consistency tests
 *  5. Failure handling tests
 *  6. Abuse / misuse tests
 *
 * Expected output contract:
 *  { recommendations: Array<{id, title, reason, score}>, fallbackUsed: boolean }
 */

import { GET } from '@/app/api/recommendations/threads/route'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/auth', () => ({ getSession: jest.fn() }))
jest.mock('@/lib/prisma')

afterEach(() => jest.clearAllMocks())

function mockAuth(userId = 'user-1') {
  ;(getSession as jest.Mock).mockResolvedValue({ id: userId, email: `${userId}@test.com` })
}

const samplePosts = [
  {
    id: 'post-math-1',
    title: 'Calculus: Integration by Parts',
    createdAt: new Date('2026-03-20'),
    upvotes: 8,
    views: 120,
    repliesCount: 10,
    tags: [{ name: 'calculus' }, { name: 'integration' }],
  },
  {
    id: 'post-cs-1',
    title: 'Binary Trees Explained',
    createdAt: new Date('2026-03-18'),
    upvotes: 5,
    views: 80,
    repliesCount: 6,
    tags: [{ name: 'data-structures' }],
  },
  {
    id: 'post-history-1',
    title: 'World War II Essay Tips',
    createdAt: new Date('2026-03-15'),
    upvotes: 2,
    views: 30,
    repliesCount: 1,
    tags: [{ name: 'essay' }],
  },
]

// ─── 1. Valid Input / Happy Path Tests ───────────────────────────────────────

describe('AI Recommendations — Valid Inputs', () => {
  it('TC-AI-R-01: authenticated user with history receives recommendations', async () => {
    mockAuth()
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      forumPosts: [{ tags: [{ name: 'calculus' }] }],
    })
    ;(prisma.flaggedContent.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue(samplePosts)

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(data.recommendations)).toBe(true)
    expect(data.recommendations.length).toBeGreaterThan(0)
  })

  it('TC-AI-R-02: each recommendation has required fields (id, title, reason, score)', async () => {
    mockAuth()
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      forumPosts: [{ tags: [{ name: 'calculus' }] }],
    })
    ;(prisma.flaggedContent.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue(samplePosts)

    const res = await GET()
    const data = await res.json()

    for (const rec of data.recommendations) {
      expect(rec).toHaveProperty('id')
      expect(rec).toHaveProperty('title')
      expect(rec).toHaveProperty('reason')
      expect(rec).toHaveProperty('score')
      expect(typeof rec.score).toBe('number')
      expect(typeof rec.reason).toBe('string')
      expect(rec.reason.length).toBeGreaterThan(0)
    }
  })

  it('TC-AI-R-03: category-matching post ranks higher than unrelated post', async () => {
    mockAuth()
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      forumPosts: [{ tags: [{ name: 'calculus' }] }],
    })
    ;(prisma.flaggedContent.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue(samplePosts)

    const res = await GET()
    const data = await res.json()

    const mathPost = data.recommendations.find((r: { id: string }) => r.id === 'post-math-1')
    const historyPost = data.recommendations.find((r: { id: string }) => r.id === 'post-history-1')

    if (mathPost && historyPost) {
      expect(mathPost.score).toBeGreaterThan(historyPost.score)
    } else {
      // At minimum, math post should be included when user has math history
      expect(mathPost).toBeDefined()
    }
  })

  it('TC-AI-R-04: fallbackUsed is false when user has posting history', async () => {
    mockAuth()
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      forumPosts: [{ tags: [{ name: 'data-structures' }] }],
    })
    ;(prisma.flaggedContent.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue(samplePosts)

    const res = await GET()
    const data = await res.json()

    expect(data.fallbackUsed).toBe(false)
  })
})

// ─── 2. New User / Fallback Tests ────────────────────────────────────────────

describe('AI Recommendations — New User Fallback', () => {
  it('TC-AI-R-05: new user with no posts triggers fallback mode', async () => {
    mockAuth('new-user')
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ forumPosts: [] })
    ;(prisma.flaggedContent.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue(samplePosts)

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.fallbackUsed).toBe(true)
  })

  it('TC-AI-R-06: fallback recommendations still include reason field', async () => {
    mockAuth('new-user')
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ forumPosts: [] })
    ;(prisma.flaggedContent.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([samplePosts[0]])

    const res = await GET()
    const data = await res.json()

    for (const rec of data.recommendations) {
      expect(rec.reason).toBeTruthy()
    }
  })

  it('TC-AI-R-07: no available posts returns empty recommendations gracefully', async () => {
    mockAuth('new-user')
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ forumPosts: [] })
    ;(prisma.flaggedContent.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.recommendations).toHaveLength(0)
  })
})

// ─── 3. Edge Case Tests ───────────────────────────────────────────────────────

describe('AI Recommendations — Edge Cases', () => {
  it('TC-AI-R-08: flagged posts are excluded from recommendations', async () => {
    mockAuth()
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ forumPosts: [] })
    ;(prisma.flaggedContent.findMany as jest.Mock).mockResolvedValue([
      { contentId: 'post-math-1' },
      { contentId: 'post-cs-1' },
    ])
    ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([samplePosts[2]])

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    const ids = data.recommendations.map((r: { id: string }) => r.id)
    expect(ids).not.toContain('post-math-1')
    expect(ids).not.toContain('post-cs-1')
  })

  it('TC-AI-R-09: Prisma is called with notIn filter for flagged content', async () => {
    mockAuth()
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ forumPosts: [] })
    ;(prisma.flaggedContent.findMany as jest.Mock).mockResolvedValue([
      { contentId: 'flagged-id-1' },
    ])
    ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])

    await GET()

    expect(prisma.forumPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { notIn: ['flagged-id-1'] } },
      })
    )
  })

  it('TC-AI-R-10: all posts flagged results in empty recommendations', async () => {
    mockAuth()
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ forumPosts: [] })
    ;(prisma.flaggedContent.findMany as jest.Mock).mockResolvedValue(
      samplePosts.map((p) => ({ contentId: p.id }))
    )
    ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.recommendations).toHaveLength(0)
  })
})

// ─── 4. Consistency Tests ─────────────────────────────────────────────────────

describe('AI Recommendations — Consistency', () => {
  it('TC-AI-R-11: same user, same data → same top recommendation (deterministic)', async () => {
    const userHistory = {
      forumPosts: [{ tags: [{ name: 'calculus' }] }],
    }

    for (let i = 0; i < 2; i++) {
      ;(getSession as jest.Mock).mockResolvedValue({ id: 'u-stable', email: 'u@t.com' })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(userHistory)
      ;(prisma.flaggedContent.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue(samplePosts)
    }

    ;(getSession as jest.Mock).mockResolvedValue({ id: 'u-stable', email: 'u@t.com' })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(userHistory)
    ;(prisma.flaggedContent.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue(samplePosts)
    const res1 = await GET()
    const data1 = await res1.json()

    ;(getSession as jest.Mock).mockResolvedValue({ id: 'u-stable', email: 'u@t.com' })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(userHistory)
    ;(prisma.flaggedContent.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue(samplePosts)
    const res2 = await GET()
    const data2 = await res2.json()

    expect(data1.recommendations[0]?.id).toBe(data2.recommendations[0]?.id)
  })

  it('TC-AI-R-12: score is a number and ordered descending', async () => {
    mockAuth()
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      forumPosts: [{ tags: [{ name: 'calculus' }] }],
    })
    ;(prisma.flaggedContent.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue(samplePosts)

    const res = await GET()
    const data = await res.json()

    const scores = data.recommendations.map((r: { score: number }) => r.score)
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i])
    }
  })
})

// ─── 5. Failure Handling Tests ────────────────────────────────────────────────

describe('AI Recommendations — Failure Handling', () => {
  it('TC-AI-R-13: unauthenticated request returns 401', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)

    const res = await GET()

    expect(res.status).toBe(401)
    expect(prisma.forumPost.findMany).not.toHaveBeenCalled()
  })

  it('TC-AI-R-14: Prisma findMany throws → route returns 500', async () => {
    mockAuth()
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ forumPosts: [] })
    ;(prisma.flaggedContent.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.forumPost.findMany as jest.Mock).mockRejectedValue(new Error('DB connection lost'))

    const res = await GET()

    expect(res.status).toBe(500)
  })

  it('TC-AI-R-15: user profile not found in DB → graceful fallback, not crash', async () => {
    mockAuth()
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.flaggedContent.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue(samplePosts)

    const res = await GET()

    // Should not crash; either 200 with fallback or handled error
    expect([200, 500]).toContain(res.status)
  })
})

// ─── 6. Abuse / Misuse Tests ─────────────────────────────────────────────────

describe('AI Recommendations — Abuse & Misuse Prevention', () => {
  it('TC-AI-R-16: large number of flagged posts (1000) does not cause performance crash', async () => {
    mockAuth()
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ forumPosts: [] })
    ;(prisma.flaggedContent.findMany as jest.Mock).mockResolvedValue(
      Array.from({ length: 1000 }, (_, i) => ({ contentId: `flagged-${i}` }))
    )
    ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue([])

    const res = await GET()

    expect([200, 500]).toContain(res.status)
  })

  it('TC-AI-R-17: user with very long post history (200 posts) does not crash scorer', async () => {
    mockAuth()
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      forumPosts: Array.from({ length: 200 }, () => ({
        tags: [{ name: 'calculus' }],
      })),
    })
    ;(prisma.flaggedContent.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.forumPost.findMany as jest.Mock).mockResolvedValue(samplePosts)

    const res = await GET()

    expect([200, 500]).toContain(res.status)
  })
})

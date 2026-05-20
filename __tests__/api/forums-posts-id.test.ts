import { NextRequest } from 'next/server'
import { GET as getPost, PATCH as patchPost } from '@/app/api/forums/posts/[id]/route'
import { PATCH as patchReply } from '@/app/api/forums/replies/[id]/route'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/auth', () => ({ getSession: jest.fn() }))
jest.mock('@/lib/prisma')
jest.mock('@/lib/sanitize', () => ({
  sanitizeText: jest.fn((v: string) => v?.trim() || ''),
  sanitizeMarkdown: jest.fn((v: string) => v?.trim() || ''),
}))

afterEach(() => {
  jest.clearAllMocks()
})

// ---------------------------------------------------------------------------
// GET /api/forums/posts/[id]
// ---------------------------------------------------------------------------

describe('GET /api/forums/posts/[id]', () => {
  it('returns 200 with the post when it exists', async () => {
    const mockPost = {
      id: 'post-1',
      title: 'Test Post',
      content: 'Content',
      user: { id: 'user-1', email: 'u1@test.com', role: 'STUDENT', profile: null },
      tags: [],
      _count: { replies: 0 },
    }
    ;(prisma.forumPost.findUnique as jest.Mock).mockResolvedValue(mockPost)

    const req = new NextRequest('http://localhost/api/forums/posts/post-1')
    const res = await getPost(req, { params: Promise.resolve({ id: 'post-1' }) })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.id).toBe('post-1')
  })

  it('increments view count after fetching', async () => {
    const mockPost = {
      id: 'post-1',
      title: 'Test Post',
      user: { id: 'user-1', email: 'u1@test.com', role: 'STUDENT', profile: null },
      tags: [],
      _count: { replies: 0 },
    }
    ;(prisma.forumPost.findUnique as jest.Mock).mockResolvedValue(mockPost)

    const req = new NextRequest('http://localhost/api/forums/posts/post-1')
    await getPost(req, { params: Promise.resolve({ id: 'post-1' }) })

    expect(prisma.forumPost.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'post-1' },
        data: { views: { increment: 1 } },
      })
    )
  })

  it('returns 404 when post does not exist', async () => {
    ;(prisma.forumPost.findUnique as jest.Mock).mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/forums/posts/nonexistent')
    const res = await getPost(req, { params: Promise.resolve({ id: 'nonexistent' }) })

    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toMatch(/not found/i)
  })
})

// ---------------------------------------------------------------------------
// PATCH /api/forums/posts/[id]
// ---------------------------------------------------------------------------

describe('PATCH /api/forums/posts/[id]', () => {
  it('returns 401 when unauthenticated', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/forums/posts/post-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'New Title' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await patchPost(req, { params: Promise.resolve({ id: 'post-1' }) })

    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toMatch(/unauthorized/i)
  })

  it('returns 404 when post does not exist', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.forumPost.findUnique as jest.Mock).mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/forums/posts/nonexistent', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'New Title' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await patchPost(req, { params: Promise.resolve({ id: 'nonexistent' }) })

    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toMatch(/not found/i)
  })

  it('returns 403 when user is not owner and not admin', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-2', email: 'u2@test.com' })
    ;(prisma.forumPost.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-1' })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'STUDENT' })

    const req = new NextRequest('http://localhost/api/forums/posts/post-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Hacked Title' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await patchPost(req, { params: Promise.resolve({ id: 'post-1' }) })

    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toMatch(/not authorized/i)
  })

  it('returns 200 with updated post for owner', async () => {
    const mockUpdatedPost = {
      id: 'post-1',
      title: 'Updated Title',
      content: 'Some content',
      user: { id: 'user-1', email: 'u1@test.com', profile: { displayName: 'User 1' } },
      tags: [],
    }
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.forumPost.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-1' })
    ;(prisma.forumPost.update as jest.Mock).mockResolvedValue(mockUpdatedPost)

    const req = new NextRequest('http://localhost/api/forums/posts/post-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated Title' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await patchPost(req, { params: Promise.resolve({ id: 'post-1' }) })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.post).toEqual(mockUpdatedPost)
  })

  it('returns 403 when admin tries to edit another user post', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' })
    ;(prisma.forumPost.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-1' })

    const req = new NextRequest('http://localhost/api/forums/posts/post-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Admin Updated Title' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await patchPost(req, { params: Promise.resolve({ id: 'post-1' }) })

    expect(res.status).toBe(403)
  })

  it('returns 400 when body contains no valid fields', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.forumPost.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-1' })

    const req = new NextRequest('http://localhost/api/forums/posts/post-1', {
      method: 'PATCH',
      body: JSON.stringify({ unknownField: 'value' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await patchPost(req, { params: Promise.resolve({ id: 'post-1' }) })

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/no valid fields/i)
  })

  it('returns 400 when title sanitizes to empty string (whitespace only)', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.forumPost.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-1' })

    const req = new NextRequest('http://localhost/api/forums/posts/post-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: '   ' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await patchPost(req, { params: Promise.resolve({ id: 'post-1' }) })

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/valid text/i)
  })

  it('returns 500 with a generic message when the database throws', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.forumPost.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-1' })
    ;(prisma.forumPost.update as jest.Mock).mockRejectedValue(
      new Error('Connection string: postgres://user:secret@db.internal/prod')
    )

    const req = new NextRequest('http://localhost/api/forums/posts/post-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Valid Title' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await patchPost(req, { params: Promise.resolve({ id: 'post-1' }) })

    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBe('Failed to update post')
    expect(data.error).not.toMatch(/postgres|secret|db\.internal/i)
  })

  it('updates title and content when both provided', async () => {
    const mockUpdatedPost = { id: 'post-1', title: 'T', content: 'C', tags: [] }
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.forumPost.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-1' })
    ;(prisma.forumPost.update as jest.Mock).mockResolvedValue(mockUpdatedPost)

    const req = new NextRequest('http://localhost/api/forums/posts/post-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'T', content: 'C' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await patchPost(req, { params: Promise.resolve({ id: 'post-1' }) })

    expect(res.status).toBe(200)
    expect(prisma.forumPost.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: 'T', content: 'C' }),
      })
    )
  })
})

// ---------------------------------------------------------------------------
// PATCH /api/forums/replies/[id]
// ---------------------------------------------------------------------------

describe('PATCH /api/forums/replies/[id]', () => {
  it('returns 401 when unauthenticated', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/forums/replies/reply-1', {
      method: 'PATCH',
      body: JSON.stringify({ content: 'Updated content' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await patchReply(req, { params: Promise.resolve({ id: 'reply-1' }) })

    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toMatch(/unauthorized/i)
  })

  it('returns 404 when reply does not exist', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.forumReply.findUnique as jest.Mock).mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/forums/replies/nonexistent', {
      method: 'PATCH',
      body: JSON.stringify({ content: 'Updated content' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await patchReply(req, { params: Promise.resolve({ id: 'nonexistent' }) })

    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toMatch(/not found/i)
  })

  it('returns 403 when user is not owner and not admin', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-2', email: 'u2@test.com' })
    ;(prisma.forumReply.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-1' })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'STUDENT' })

    const req = new NextRequest('http://localhost/api/forums/replies/reply-1', {
      method: 'PATCH',
      body: JSON.stringify({ content: 'Hacked content' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await patchReply(req, { params: Promise.resolve({ id: 'reply-1' }) })

    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toMatch(/not authorized/i)
  })

  it('returns 200 with updated reply for owner', async () => {
    const mockUpdatedReply = {
      id: 'reply-1',
      content: 'Updated content',
      user: { id: 'user-1', email: 'u1@test.com', profile: { displayName: 'User 1' } },
    }
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.forumReply.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-1' })
    ;(prisma.forumReply.update as jest.Mock).mockResolvedValue(mockUpdatedReply)

    const req = new NextRequest('http://localhost/api/forums/replies/reply-1', {
      method: 'PATCH',
      body: JSON.stringify({ content: 'Updated content' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await patchReply(req, { params: Promise.resolve({ id: 'reply-1' }) })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.reply).toEqual(mockUpdatedReply)
  })

  it('returns 400 when content field is missing from body', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.forumReply.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-1' })

    const req = new NextRequest('http://localhost/api/forums/replies/reply-1', {
      method: 'PATCH',
      body: JSON.stringify({ notContent: 'something' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await patchReply(req, { params: Promise.resolve({ id: 'reply-1' }) })

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/content is required/i)
  })

  it('returns 400 when content sanitizes to empty string (whitespace only)', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.forumReply.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-1' })

    const req = new NextRequest('http://localhost/api/forums/replies/reply-1', {
      method: 'PATCH',
      body: JSON.stringify({ content: '   ' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await patchReply(req, { params: Promise.resolve({ id: 'reply-1' }) })

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/valid text/i)
  })

  it('returns 500 with a generic message when the database throws', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'u1@test.com' })
    ;(prisma.forumReply.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-1' })
    ;(prisma.forumReply.update as jest.Mock).mockRejectedValue(
      new Error('Connection string: postgres://user:secret@db.internal/prod')
    )

    const req = new NextRequest('http://localhost/api/forums/replies/reply-1', {
      method: 'PATCH',
      body: JSON.stringify({ content: 'Valid content' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await patchReply(req, { params: Promise.resolve({ id: 'reply-1' }) })

    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBe('Failed to update reply')
    expect(data.error).not.toMatch(/postgres|secret|db\.internal/i)
  })

  it('returns 403 when admin tries to edit another user reply', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' })
    ;(prisma.forumReply.findUnique as jest.Mock).mockResolvedValue({ userId: 'user-1' })

    const req = new NextRequest('http://localhost/api/forums/replies/reply-1', {
      method: 'PATCH',
      body: JSON.stringify({ content: 'Admin edited' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await patchReply(req, { params: Promise.resolve({ id: 'reply-1' }) })

    expect(res.status).toBe(403)
  })
})

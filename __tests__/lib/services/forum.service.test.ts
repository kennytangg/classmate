/**
 * lib/services/forum.service.ts — Unit tests
 *
 * Mocks: prisma, moderation, sanitize
 * All sanitize functions pass input through unchanged for simplicity.
 */

import {
  listForumPosts,
  enrichPostsWithUpvotes,
  createForumPost,
  getForumPost,
  incrementPostViews,
  enrichPostWithUpvote,
  updateForumPost,
  deleteForumPost,
  togglePostUpvote,
  getForumReplies,
  enrichRepliesWithUpvotes,
  createForumReply,
  updateForumReply,
  deleteForumReply,
  toggleReplyUpvote,
  PostNotFoundError,
  ReplyNotFoundError,
  CannotSelfUpvoteError,
  ModerationBlockedError,
  ServiceValidationError,
} from '@/lib/services/forum.service'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma')
jest.mock('@/lib/sanitize', () => ({
  sanitizeText: (s: string) => s,
  sanitizeMarkdown: (s: string) => s,
  containsXSSPatterns: () => false,
}))
jest.mock('@/lib/moderation', () => ({
  moderateContent: jest.fn(),
}))

import { moderateContent } from '@/lib/moderation'
const mockModerate = moderateContent as jest.Mock

const mockPrisma = prisma as jest.Mocked<typeof prisma>

const APPROVE = { action: 'approve' as const, safe: true, reason: '', categories: [] }
const WARN = {
  action: 'warn' as const,
  safe: true,
  reason: 'borderline',
  categories: ['off_topic'],
}
const BLOCK = { action: 'block' as const, safe: false, reason: 'toxic', categories: ['harassment'] }

beforeEach(() => {
  jest.clearAllMocks()
  mockModerate.mockResolvedValue(APPROVE)
})

// ─── listForumPosts ───────────────────────────────────────────────────────────

describe('listForumPosts', () => {
  it('fetches all posts when no category provided', async () => {
    const posts = [{ id: 'p1' }]
    mockPrisma.forumPost.count.mockResolvedValue(1 as never)
    mockPrisma.forumPost.findMany.mockResolvedValue(posts as never)

    const result = await listForumPosts()

    expect(mockPrisma.forumPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    )
    expect(result.posts).toBe(posts)
    expect(result.total).toBe(1)
  })

  it('filters by search keyword when provided', async () => {
    mockPrisma.forumPost.count.mockResolvedValue(0 as never)
    mockPrisma.forumPost.findMany.mockResolvedValue([] as never)

    await listForumPosts('react')

    expect(mockPrisma.forumPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { title: { contains: 'react', mode: 'insensitive' } },
            { content: { contains: 'react', mode: 'insensitive' } },
          ],
        },
      })
    )
  })
})

// ─── enrichPostsWithUpvotes ───────────────────────────────────────────────────

describe('enrichPostsWithUpvotes', () => {
  it('sets hasUpvoted false for all posts when no userId', async () => {
    const posts = [{ id: 'p1' }, { id: 'p2' }]
    const result = await enrichPostsWithUpvotes(posts)

    expect(result).toEqual([
      { id: 'p1', hasUpvoted: false },
      { id: 'p2', hasUpvoted: false },
    ])
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled()
  })

  it('marks upvoted posts when userId provided', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      upvotedForumPosts: [{ id: 'p1' }],
    } as never)

    const result = await enrichPostsWithUpvotes([{ id: 'p1' }, { id: 'p2' }], 'u1')

    expect(result[0].hasUpvoted).toBe(true)
    expect(result[1].hasUpvoted).toBe(false)
  })
})

// ─── createForumPost ──────────────────────────────────────────────────────────

describe('createForumPost', () => {
  it('creates a post and returns data without warning on approve', async () => {
    const post = { id: 'p1', title: 'Hello', content: 'World' }
    mockPrisma.forumPost.create.mockResolvedValue(post as never)

    const result = await createForumPost('u1', { title: 'Hello', content: 'World' })

    expect(result.data).toBe(post)
    expect(result.warning).toBeUndefined()
    expect(mockPrisma.forumPost.create).toHaveBeenCalledTimes(1)
  })

  it('includes warning in result when moderation returns warn', async () => {
    mockModerate.mockResolvedValue(WARN)
    const post = { id: 'p1' }
    mockPrisma.forumPost.create.mockResolvedValue(post as never)

    const result = await createForumPost('u1', { title: 'Borderline', content: 'Content' })

    expect(result.data).toBe(post)
    expect(result.warning).toBeDefined()
    expect(result.warning?.reason).toBe('borderline')
  })

  it('throws ModerationBlockedError when moderation returns block', async () => {
    mockModerate.mockResolvedValue(BLOCK)

    await expect(createForumPost('u1', { title: 'Bad', content: 'Toxic content' })).rejects.toThrow(
      ModerationBlockedError
    )
  })

  it('throws ServiceValidationError when title is empty', async () => {
    await expect(createForumPost('u1', { title: '', content: 'Content' })).rejects.toThrow(
      ServiceValidationError
    )
  })
})

// ─── getForumPost ─────────────────────────────────────────────────────────────

describe('getForumPost', () => {
  it('returns a post when found', async () => {
    const post = { id: 'p1' }
    mockPrisma.forumPost.findUnique.mockResolvedValue(post as never)

    const result = await getForumPost('p1')
    expect(result).toBe(post)
  })

  it('returns null when post not found', async () => {
    mockPrisma.forumPost.findUnique.mockResolvedValue(null as never)
    const result = await getForumPost('nonexistent')
    expect(result).toBeNull()
  })
})

// ─── incrementPostViews ───────────────────────────────────────────────────────

describe('incrementPostViews', () => {
  it('calls prisma update with increment', async () => {
    mockPrisma.forumPost.update.mockResolvedValue({} as never)

    await incrementPostViews('p1')

    expect(mockPrisma.forumPost.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { views: { increment: 1 } },
    })
  })
})

// ─── enrichPostWithUpvote ─────────────────────────────────────────────────────

describe('enrichPostWithUpvote', () => {
  it('returns hasUpvoted false when no userId', async () => {
    const result = await enrichPostWithUpvote({ id: 'p1' })
    expect(result.hasUpvoted).toBe(false)
    expect(mockPrisma.forumPost.count).not.toHaveBeenCalled()
  })

  it('returns hasUpvoted true when user has upvoted', async () => {
    mockPrisma.forumPost.count.mockResolvedValue(1 as never)
    const result = await enrichPostWithUpvote({ id: 'p1' }, 'u1')
    expect(result.hasUpvoted).toBe(true)
  })

  it('returns hasUpvoted false when user has not upvoted', async () => {
    mockPrisma.forumPost.count.mockResolvedValue(0 as never)
    const result = await enrichPostWithUpvote({ id: 'p1' }, 'u1')
    expect(result.hasUpvoted).toBe(false)
  })
})

// ─── updateForumPost ──────────────────────────────────────────────────────────

describe('updateForumPost', () => {
  it('updates only provided fields', async () => {
    const updated = { id: 'p1', title: 'New title' }
    mockPrisma.forumPost.update.mockResolvedValue(updated as never)

    const result = await updateForumPost('p1', { title: 'New title' })

    expect(result).toBe(updated)
    expect(mockPrisma.forumPost.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'p1' },
        data: { title: 'New title' },
      })
    )
  })

  it('throws ServiceValidationError when no valid fields provided', async () => {
    await expect(updateForumPost('p1', {})).rejects.toThrow(ServiceValidationError)
  })
})

// ─── deleteForumPost ──────────────────────────────────────────────────────────

describe('deleteForumPost', () => {
  it('calls prisma delete', async () => {
    mockPrisma.forumPost.delete.mockResolvedValue({} as never)

    await deleteForumPost('p1')

    expect(mockPrisma.forumPost.delete).toHaveBeenCalledWith({ where: { id: 'p1' } })
  })
})

// ─── togglePostUpvote ─────────────────────────────────────────────────────────

describe('togglePostUpvote', () => {
  it('throws PostNotFoundError when post does not exist', async () => {
    mockPrisma.forumPost.findUnique.mockResolvedValue(null as never)

    await expect(togglePostUpvote('p1', 'u1')).rejects.toThrow(PostNotFoundError)
  })

  it('throws CannotSelfUpvoteError when user owns the post', async () => {
    mockPrisma.forumPost.findUnique.mockResolvedValue({
      id: 'p1',
      userId: 'u1',
      upvoters: [],
    } as never)

    await expect(togglePostUpvote('p1', 'u1')).rejects.toThrow(CannotSelfUpvoteError)
  })

  it('increments upvotes when user has not upvoted', async () => {
    mockPrisma.forumPost.findUnique.mockResolvedValue({
      id: 'p1',
      userId: 'u2',
      upvoters: [],
    } as never)
    mockPrisma.forumPost.update.mockResolvedValue({ upvotes: 1 } as never)

    const result = await togglePostUpvote('p1', 'u1')

    expect(result.upvotes).toBe(1)
    expect(result.hasUpvoted).toBe(true)
  })

  it('decrements upvotes when user already upvoted', async () => {
    mockPrisma.forumPost.findUnique.mockResolvedValue({
      id: 'p1',
      userId: 'u2',
      upvoters: [{ id: 'u1' }],
    } as never)
    mockPrisma.forumPost.update.mockResolvedValue({ upvotes: 0 } as never)

    const result = await togglePostUpvote('p1', 'u1')

    expect(result.upvotes).toBe(0)
    expect(result.hasUpvoted).toBe(false)
  })
})

// ─── getForumReplies ──────────────────────────────────────────────────────────

describe('getForumReplies', () => {
  it('fetches replies for a post', async () => {
    const replies = [{ id: 'r1' }, { id: 'r2' }]
    mockPrisma.forumReply.findMany.mockResolvedValue(replies as never)

    const result = await getForumReplies('p1')

    expect(result).toBe(replies)
    expect(mockPrisma.forumReply.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { postId: 'p1' } })
    )
  })
})

// ─── enrichRepliesWithUpvotes ─────────────────────────────────────────────────

describe('enrichRepliesWithUpvotes', () => {
  it('sets hasUpvoted false for all replies when no userId', async () => {
    const replies = [{ id: 'r1' }, { id: 'r2' }]
    const result = await enrichRepliesWithUpvotes(replies)

    expect(result.every((r) => r.hasUpvoted === false)).toBe(true)
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled()
  })

  it('marks upvoted replies correctly', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      upvotedReplies: [{ id: 'r1' }],
    } as never)

    const result = await enrichRepliesWithUpvotes([{ id: 'r1' }, { id: 'r2' }], 'u1')

    expect(result[0].hasUpvoted).toBe(true)
    expect(result[1].hasUpvoted).toBe(false)
  })
})

// ─── createForumReply ─────────────────────────────────────────────────────────

describe('createForumReply', () => {
  it('creates a reply when post exists and content passes moderation', async () => {
    mockPrisma.forumPost.findUnique.mockResolvedValue({ id: 'p1' } as never)
    const reply = { id: 'r1', content: 'Great post!' }
    mockPrisma.forumReply.create.mockResolvedValue(reply as never)
    mockPrisma.forumPost.update.mockResolvedValue({} as never)

    const result = await createForumReply('u1', 'p1', 'Great post!')

    expect(result.data).toBe(reply)
    expect(result.warning).toBeUndefined()
  })

  it('throws PostNotFoundError when post does not exist', async () => {
    mockPrisma.forumPost.findUnique.mockResolvedValue(null as never)

    await expect(createForumReply('u1', 'nonexistent', 'Hello')).rejects.toThrow(PostNotFoundError)
  })

  it('throws ModerationBlockedError when content is blocked', async () => {
    mockPrisma.forumPost.findUnique.mockResolvedValue({ id: 'p1' } as never)
    mockModerate.mockResolvedValue(BLOCK)

    await expect(createForumReply('u1', 'p1', 'Toxic content')).rejects.toThrow(
      ModerationBlockedError
    )
  })

  it('includes warning in result for warn-level content', async () => {
    mockPrisma.forumPost.findUnique.mockResolvedValue({ id: 'p1' } as never)
    mockModerate.mockResolvedValue(WARN)
    mockPrisma.forumReply.create.mockResolvedValue({ id: 'r1' } as never)
    mockPrisma.forumPost.update.mockResolvedValue({} as never)

    const result = await createForumReply('u1', 'p1', 'Borderline content')

    expect(result.warning).toBeDefined()
    expect(result.warning?.reason).toBe('borderline')
  })
})

// ─── updateForumReply ─────────────────────────────────────────────────────────

describe('updateForumReply', () => {
  it('updates reply content', async () => {
    const updated = { id: 'r1', content: 'Updated' }
    mockPrisma.forumReply.update.mockResolvedValue(updated as never)

    const result = await updateForumReply('r1', 'Updated')

    expect(result).toBe(updated)
    expect(mockPrisma.forumReply.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'r1' }, data: { content: 'Updated' } })
    )
  })
})

// ─── deleteForumReply ─────────────────────────────────────────────────────────

describe('deleteForumReply', () => {
  it('deletes reply and decrements post counter in a transaction', async () => {
    const txMock = {
      forumReply: { delete: jest.fn().mockResolvedValue({}) },
      forumPost: { updateMany: jest.fn().mockResolvedValue({}) },
    }
    mockPrisma.$transaction.mockImplementation((fn: (tx: typeof txMock) => Promise<void>) =>
      fn(txMock)
    )

    await deleteForumReply('r1', 'p1')

    expect(txMock.forumReply.delete).toHaveBeenCalledWith({ where: { id: 'r1' } })
    expect(txMock.forumPost.updateMany).toHaveBeenCalledWith({
      where: { id: 'p1', repliesCount: { gt: 0 } },
      data: { repliesCount: { decrement: 1 } },
    })
  })
})

// ─── toggleReplyUpvote ────────────────────────────────────────────────────────

describe('toggleReplyUpvote', () => {
  it('throws ReplyNotFoundError when reply does not exist', async () => {
    mockPrisma.forumReply.findUnique.mockResolvedValue(null as never)

    await expect(toggleReplyUpvote('r1', 'u1')).rejects.toThrow(ReplyNotFoundError)
  })

  it('throws CannotSelfUpvoteError when user owns the reply', async () => {
    mockPrisma.forumReply.findUnique.mockResolvedValue({
      id: 'r1',
      userId: 'u1',
      upvoters: [],
    } as never)

    await expect(toggleReplyUpvote('r1', 'u1')).rejects.toThrow(CannotSelfUpvoteError)
  })

  it('toggles upvote on and returns updated count', async () => {
    mockPrisma.forumReply.findUnique.mockResolvedValue({
      id: 'r1',
      userId: 'u2',
      upvoters: [],
    } as never)
    mockPrisma.forumReply.update.mockResolvedValue({ upvotes: 1 } as never)

    const result = await toggleReplyUpvote('r1', 'u1')

    expect(result.upvotes).toBe(1)
    expect(result.hasUpvoted).toBe(true)
  })

  it('toggles upvote off and returns updated count', async () => {
    mockPrisma.forumReply.findUnique.mockResolvedValue({
      id: 'r1',
      userId: 'u2',
      upvoters: [{ id: 'u1' }],
    } as never)
    mockPrisma.forumReply.update.mockResolvedValue({ upvotes: 0 } as never)

    const result = await toggleReplyUpvote('r1', 'u1')

    expect(result.upvotes).toBe(0)
    expect(result.hasUpvoted).toBe(false)
  })
})

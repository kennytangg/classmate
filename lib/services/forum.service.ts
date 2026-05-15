import { prisma } from '@/lib/prisma'
import { moderateContent } from '@/lib/moderation'
import { sanitizeText, sanitizeMarkdown, containsXSSPatterns } from '@/lib/sanitize'

// --- Input types ---
interface CreatePostInput {
  title: string
  content: string
  category: string
  tags?: string[]
}

interface UpdatePostInput {
  title?: string
  content?: string
  category?: string
}

// --- Output types ---
interface ModerationWarning {
  message: string
  reason: string
  categories: string[]
}

interface CreateContentResult<T> {
  data: T
  warning?: ModerationWarning
}

// --- Custom errors ---
export class PostNotFoundError extends Error {
  constructor() {
    super('Post not found')
    this.name = 'PostNotFoundError'
  }
}

export class ReplyNotFoundError extends Error {
  constructor() {
    super('Reply not found')
    this.name = 'ReplyNotFoundError'
  }
}

export class CannotSelfUpvoteError extends Error {
  constructor() {
    super('Cannot upvote your own content')
    this.name = 'CannotSelfUpvoteError'
  }
}

export class ModerationBlockedError extends Error {
  constructor(
    public readonly reason: string,
    public readonly categories: string[]
  ) {
    super('Content blocked by moderation')
    this.name = 'ModerationBlockedError'
  }
}

export class ServiceValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ServiceValidationError'
  }
}

// --- Post functions ---

export async function listForumPosts(
  category?: string,
  page = 1,
  limit = 10,
  userId?: string,
  hasReplies?: boolean
): Promise<{ posts: Awaited<ReturnType<typeof prisma.forumPost.findMany>>; total: number }> {
  const where = {
    ...(category && category !== 'all' ? { category } : {}),
    ...(userId ? { userId } : {}),
    ...(hasReplies === true ? { replies: { some: {} } } : {}),
    ...(hasReplies === false ? { replies: { none: {} } } : {}),
  }

  const total = await prisma.forumPost.count({ where })

  const posts = await prisma.forumPost.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              displayName: true,
              major: true,
            },
          },
        },
      },
      tags: true,
      _count: {
        select: { replies: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: (page - 1) * limit,
  })

  return { posts, total }
}

export async function enrichPostsWithUpvotes<T extends { id: string }>(
  posts: T[],
  userId?: string
): Promise<(T & { hasUpvoted: boolean })[]> {
  let upvotedPostIds = new Set<string>()
  if (userId) {
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: { upvotedForumPosts: { select: { id: true } } },
    })
    upvotedPostIds = new Set((userData?.upvotedForumPosts ?? []).map((p) => p.id))
  }
  return posts.map((post) => ({ ...post, hasUpvoted: upvotedPostIds.has(post.id) }))
}

export async function createForumPost(userId: string, data: CreatePostInput) {
  const { title, content, category, tags } = data

  const sanitizedTitle = sanitizeText(title)
  const sanitizedContent = sanitizeMarkdown(content)
  const sanitizedCategory = sanitizeText(category)

  if (!sanitizedTitle || !sanitizedContent || !sanitizedCategory) {
    throw new ServiceValidationError('title, content, and category must contain valid text')
  }

  if (containsXSSPatterns(sanitizedTitle) || containsXSSPatterns(sanitizedContent)) {
    console.warn('XSS pattern survived sanitization in forum post submission', {
      userId,
      timestamp: new Date().toISOString(),
    })
  }

  const moderationResult = await moderateContent(`${sanitizedTitle}\n\n${sanitizedContent}`)

  if (moderationResult.action === 'block') {
    throw new ModerationBlockedError(moderationResult.reason, moderationResult.categories)
  }

  const post = await prisma.forumPost.create({
    data: {
      title: sanitizedTitle,
      content: sanitizedContent,
      category: sanitizedCategory,
      userId,
      tags: tags
        ? {
            create: tags.map((tag: string) => ({
              name: sanitizeText(tag.trim().toLowerCase()) ?? '',
            })),
          }
        : undefined,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: { select: { displayName: true } },
        },
      },
      tags: true,
    },
  })

  const result: CreateContentResult<typeof post> = { data: post }
  if (moderationResult.action === 'warn') {
    result.warning = {
      message: 'Post created with warning',
      reason: moderationResult.reason,
      categories: moderationResult.categories,
    }
  }
  return result
}

export async function getForumPost(postId: string) {
  return prisma.forumPost.findUnique({
    where: { id: postId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          profile: {
            select: {
              displayName: true,
              avatarUrl: true,
              major: true,
            },
          },
        },
      },
      tags: true,
      _count: {
        select: { replies: true },
      },
    },
  })
}

export async function incrementPostViews(postId: string): Promise<void> {
  await prisma.forumPost.update({
    where: { id: postId },
    data: { views: { increment: 1 } },
  })
}

export async function enrichPostWithUpvote<T extends { id: string }>(
  post: T,
  userId?: string
): Promise<T & { hasUpvoted: boolean }> {
  let hasUpvoted = false
  if (userId) {
    const count = await prisma.forumPost.count({
      where: { id: post.id, upvoters: { some: { id: userId } } },
    })
    hasUpvoted = count > 0
  }
  return { ...post, hasUpvoted }
}

export async function updateForumPost(postId: string, data: UpdatePostInput) {
  const update: Record<string, string> = {}

  if (data.title !== undefined) {
    const sanitized = sanitizeText(data.title)
    if (!sanitized) throw new ServiceValidationError('title must contain valid text')
    update.title = sanitized
  }
  if (data.content !== undefined) {
    const sanitized = sanitizeMarkdown(data.content)
    if (!sanitized) throw new ServiceValidationError('content must contain valid text')
    update.content = sanitized
  }
  if (data.category !== undefined) {
    const sanitized = sanitizeText(data.category)
    if (!sanitized) throw new ServiceValidationError('category must contain valid text')
    update.category = sanitized
  }

  if (Object.keys(update).length === 0) {
    throw new ServiceValidationError('No valid fields to update')
  }

  return prisma.forumPost.update({
    where: { id: postId },
    data: update,
    include: {
      user: { select: { id: true, email: true, profile: { select: { displayName: true } } } },
      tags: true,
    },
  })
}

export async function deleteForumPost(postId: string): Promise<void> {
  await prisma.forumPost.delete({ where: { id: postId } })
}

export async function togglePostUpvote(
  postId: string,
  userId: string
): Promise<{ upvotes: number; hasUpvoted: boolean }> {
  const post = await prisma.forumPost.findUnique({
    where: { id: postId },
    select: {
      id: true,
      userId: true,
      upvoters: { where: { id: userId }, select: { id: true } },
    },
  })

  if (!post) throw new PostNotFoundError()
  if (post.userId === userId) throw new CannotSelfUpvoteError()

  const hasUpvoted = post.upvoters.length > 0

  const updated = await prisma.forumPost.update({
    where: { id: postId },
    data: {
      upvotes: hasUpvoted ? { decrement: 1 } : { increment: 1 },
      upvoters: hasUpvoted ? { disconnect: { id: userId } } : { connect: { id: userId } },
    },
    select: { upvotes: true },
  })

  return { upvotes: updated.upvotes, hasUpvoted: !hasUpvoted }
}

// --- Reply functions ---

export async function getForumReplies(postId: string) {
  return prisma.forumReply.findMany({
    where: { postId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: { select: { displayName: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })
}

export async function enrichRepliesWithUpvotes<T extends { id: string }>(
  replies: T[],
  userId?: string
): Promise<(T & { hasUpvoted: boolean })[]> {
  let upvotedReplyIds = new Set<string>()
  if (userId) {
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: { upvotedReplies: { select: { id: true } } },
    })
    upvotedReplyIds = new Set((userData?.upvotedReplies ?? []).map((r) => r.id))
  }
  return replies.map((reply) => ({ ...reply, hasUpvoted: upvotedReplyIds.has(reply.id) }))
}

export async function createForumReply(userId: string, postId: string, content: string) {
  const sanitizedContent = sanitizeMarkdown(content)
  if (!sanitizedContent) {
    throw new ServiceValidationError('content must contain valid text')
  }

  const post = await prisma.forumPost.findUnique({ where: { id: postId } })
  if (!post) throw new PostNotFoundError()

  const moderationResult = await moderateContent(sanitizedContent)

  if (moderationResult.action === 'block') {
    throw new ModerationBlockedError(moderationResult.reason, moderationResult.categories)
  }

  const reply = await prisma.forumReply.create({
    data: { content: sanitizedContent, postId, userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: { select: { displayName: true } },
        },
      },
    },
  })

  await prisma.forumPost.update({
    where: { id: postId },
    data: { repliesCount: { increment: 1 } },
  })

  const result: CreateContentResult<typeof reply> = { data: reply }
  if (moderationResult.action === 'warn') {
    result.warning = {
      message: 'Reply created with warning',
      reason: moderationResult.reason,
      categories: moderationResult.categories,
    }
  }
  return result
}

export async function updateForumReply(replyId: string, content: string) {
  const sanitized = sanitizeMarkdown(content)
  if (!sanitized) throw new ServiceValidationError('content must contain valid text')

  return prisma.forumReply.update({
    where: { id: replyId },
    data: { content: sanitized },
    include: {
      user: { select: { id: true, email: true, profile: { select: { displayName: true } } } },
    },
  })
}

export async function deleteForumReply(replyId: string, postId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.forumReply.delete({ where: { id: replyId } })
    await tx.forumPost.updateMany({
      where: { id: postId, repliesCount: { gt: 0 } },
      data: { repliesCount: { decrement: 1 } },
    })
  })
}

export async function toggleReplyUpvote(
  replyId: string,
  userId: string
): Promise<{ upvotes: number; hasUpvoted: boolean }> {
  const reply = await prisma.forumReply.findUnique({
    where: { id: replyId },
    select: {
      id: true,
      userId: true,
      upvoters: { where: { id: userId }, select: { id: true } },
    },
  })

  if (!reply) throw new ReplyNotFoundError()
  if (reply.userId === userId) throw new CannotSelfUpvoteError()

  const hasUpvoted = reply.upvoters.length > 0

  const updated = await prisma.forumReply.update({
    where: { id: replyId },
    data: {
      upvotes: hasUpvoted ? { decrement: 1 } : { increment: 1 },
      upvoters: hasUpvoted ? { disconnect: { id: userId } } : { connect: { id: userId } },
    },
    select: { upvotes: true },
  })

  return { upvotes: updated.upvotes, hasUpvoted: !hasUpvoted }
}

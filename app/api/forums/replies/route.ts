import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { checkRateLimit, writeLimiter } from '@/lib/rate-limit'
import {
  getForumReplies,
  enrichRepliesWithUpvotes,
  createForumReply,
  PostNotFoundError,
  ModerationBlockedError,
  ServiceValidationError,
} from '@/lib/services/forum.service'
import { flagContent, DuplicateFlagError } from '@/lib/services/moderation.service'
import { createReplySchema } from '@/lib/schemas'
import { zodErrorToString } from '@/lib/errors'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notify'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const postId = searchParams.get('postId')

    if (!postId) {
      return NextResponse.json({ error: 'postId query parameter required' }, { status: 400 })
    }

    const replies = await getForumReplies(postId)
    const session = await getSession()
    const repliesWithUpvoted = await enrichRepliesWithUpvotes(replies, session?.id)

    return NextResponse.json({ replies: repliesWithUpvoted }, { status: 200 })
  } catch (error: unknown) {
    console.error('[GET /api/forums/replies] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = await checkRateLimit(user.id, writeLimiter)
    if (limited) return limited

    const parsed = createReplySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: zodErrorToString(parsed.error) }, { status: 400 })
    }
    const { postId, content } = parsed.data

    try {
      const result = await createForumReply(user.id, postId, content)

      // Auto-flag AI-detected borderline content for human review
      if (result.warning) {
        const { reason, categories } = result.warning
        const autoFlagReason = `AI auto-flag: ${(categories ?? []).join(', ')} — ${reason}`
        ;(async () => {
          try {
            await flagContent(user.id, 'reply', result.data.id, autoFlagReason)
          } catch (err) {
            if (!(err instanceof DuplicateFlagError)) {
              console.error('[ai-moderation] Failed to auto-flag reply:', err)
            }
          }
        })()
      }

      // Notify post author (skip if replier is the author)
      ;(async () => {
        try {
          const post = await prisma.forumPost.findUnique({
            where: { id: postId },
            select: { userId: true, title: true },
          })
          if (!post || post.userId === user.id) return
          const replierName = user.name ?? user.email?.split('@')[0] ?? 'Someone'
          await createNotification({
            userId: post.userId,
            type: 'forum_reply',
            message: `${replierName} replied to your post "${post.title.slice(0, 50)}"`,
            sourceType: 'forum_reply',
            sourceId: postId,
          })
        } catch (err) {
          console.error('[notify] forum_reply notification failed:', err)
        }
      })()

      return NextResponse.json(
        { reply: result.data, ...(result.warning && { warning: result.warning }) },
        { status: 201 }
      )
    } catch (err) {
      if (err instanceof PostNotFoundError) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
      if (err instanceof ModerationBlockedError) {
        return NextResponse.json(
          {
            error: 'Content blocked by moderation',
            moderation: { action: 'block', reason: err.reason, categories: err.categories },
          },
          { status: 400 }
        )
      }
      if (err instanceof ServiceValidationError) {
        return NextResponse.json({ error: err.message }, { status: 400 })
      }
      throw err
    }
  } catch (error: unknown) {
    console.error('[POST /api/forums/replies] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { checkRateLimit, writeLimiter } from '@/lib/rate-limit'
import {
  listForumPosts,
  enrichPostsWithUpvotes,
  createForumPost,
  ModerationBlockedError,
  ServiceValidationError,
} from '@/lib/services/forum.service'
import { flagContent, DuplicateFlagError } from '@/lib/services/moderation.service'
import { createPostSchema } from '@/lib/schemas'
import { zodErrorToString } from '@/lib/errors'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') ?? undefined
    const userId = searchParams.get('userId') ?? undefined
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10) || 10))
    const hasRepliesParam = searchParams.get('hasReplies')
    const hasReplies =
      hasRepliesParam === 'true' ? true : hasRepliesParam === 'false' ? false : undefined

    const { posts, total } = await listForumPosts(category, page, limit, userId, hasReplies)
    const postsWithUpvoted = await enrichPostsWithUpvotes(posts, session.id)

    return NextResponse.json(
      {
        posts: postsWithUpvoted,
        meta: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) },
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Forum posts GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
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

    const parsed = createPostSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: zodErrorToString(parsed.error) }, { status: 400 })
    }
    const { title, content, tags } = parsed.data

    try {
      const result = await createForumPost(user.id, { title, content, category: 'general', tags })

      // Auto-flag AI-detected borderline content for human review
      if (result.warning) {
        const { reason, categories } = result.warning
        const autoFlagReason = `AI auto-flag: ${(categories ?? []).join(', ')} — ${reason}`
        flagContent(user.id, 'post', result.data.id, autoFlagReason).catch((err: unknown) => {
          if (!(err instanceof DuplicateFlagError)) {
            console.error('[ai-moderation] Failed to auto-flag post:', err)
          }
        })
      }

      return NextResponse.json(
        { post: result.data, ...(result.warning && { warning: result.warning }) },
        { status: 201 }
      )
    } catch (err) {
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
    console.error('Forum posts POST error:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}

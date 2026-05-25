import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { checkRateLimit, writeLimiter } from '@/lib/rate-limit'
import {
  toggleReplyUpvote,
  ReplyNotFoundError,
  CannotSelfUpvoteError,
} from '@/lib/services/forum.service'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = await checkRateLimit(session.id, writeLimiter)
    if (limited) return limited

    const { id } = await params

    try {
      const result = await toggleReplyUpvote(id, session.id)
      return NextResponse.json(result)
    } catch (err) {
      if (err instanceof ReplyNotFoundError) {
        return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
      }
      if (err instanceof CannotSelfUpvoteError) {
        return NextResponse.json({ error: 'Cannot upvote your own reply' }, { status: 403 })
      }
      throw err
    }
  } catch (error: unknown) {
    console.error('Upvote reply error:', error)
    return NextResponse.json({ error: 'Failed to upvote reply' }, { status: 500 })
  }
}

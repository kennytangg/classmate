import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { checkRateLimit, writeLimiter } from '@/lib/rate-limit'
import {
  togglePostUpvote,
  PostNotFoundError,
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
      const result = await togglePostUpvote(id, session.id)
      return NextResponse.json(result)
    } catch (err) {
      if (err instanceof PostNotFoundError) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
      if (err instanceof CannotSelfUpvoteError) {
        return NextResponse.json({ error: 'Cannot upvote your own post' }, { status: 403 })
      }
      throw err
    }
  } catch (error: unknown) {
    console.error('Upvote post error:', error)
    return NextResponse.json({ error: 'Failed to upvote post' }, { status: 500 })
  }
}

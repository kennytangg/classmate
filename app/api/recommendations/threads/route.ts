import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { scoreAndRankPosts } from '@/lib/recommendations'
import { checkRateLimit, generalLimiter } from '@/lib/rate-limit'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = await checkRateLimit(session.id, generalLimiter)
    if (limited) return limited

    const [historyUser, flaggedPosts] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.id },
        select: {
          forumPosts: {
            take: 1,
            select: { id: true },
          },
        },
      }),
      prisma.flaggedContent.findMany({
        where: {
          contentType: 'post',
          status: { in: ['pending', 'resolved'] },
        },
        select: { contentId: true },
      }),
    ])

    const excludedPostIds = new Set(flaggedPosts.map((flag) => flag.contentId))

    const posts = await prisma.forumPost.findMany({
      where: {
        id: { notIn: Array.from(excludedPostIds) },
      },
      include: {
        user: { select: { name: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    })

    const postMap = new Map(posts.map((p) => [p.id, p]))
    const hasHistory = (historyUser?.forumPosts.length ?? 0) > 0
    const ranked = scoreAndRankPosts(posts, new Set(), new Set())
    const top = ranked.slice(0, 5)

    return NextResponse.json(
      {
        recommendations: top.map((item) => {
          const post = postMap.get(item.id)
          return {
            id: item.id,
            title: item.title,
            content: post?.content ?? '',
            author: post?.user?.name ?? 'Unknown',
            createdAt: item.createdAt,
            upvotes: item.upvotes,
            views: item.views,
            repliesCount: item.repliesCount,
            reason: item.reasons[0],
            score: item.score,
          }
        }),
        fallbackUsed: !hasHistory,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Recommendations GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 })
  }
}

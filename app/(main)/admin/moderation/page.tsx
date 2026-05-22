import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { requireModerator, requireAdmin } from '@/lib/authorize'
import { prisma } from '@/lib/prisma'
import { ModerationPanel } from '@/components/features/admin/ModerationPanel'
import type { ModerationLogEntry } from '@/components/features/admin/ModerationPanel'
import type { EnrichedFlag } from '@/components/features/admin/ModerationQueueTable'

export default async function AdminModerationPage() {
  const session = await getSession()
  if (!session) {
    notFound()
  }

  const isModerator = await requireModerator(session)
  if (!isModerator) {
    notFound()
  }

  const isAdmin = await requireAdmin(session)

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [flags, logs, resolvedTodayCount] = await Promise.all([
    prisma.flaggedContent.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        reporter: { select: { name: true, email: true } },
      },
    }),
    isAdmin
      ? prisma.moderationLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 200,
          include: {
            actor: { select: { id: true, email: true, name: true } },
          },
        })
      : Promise.resolve([]),
    prisma.flaggedContent.count({
      where: {
        status: { in: ['resolved', 'dismissed'] },
        resolvedAt: { gte: todayStart },
      },
    }),
  ])

  // Batch-fetch content previews for all pending flags
  const postIds = flags.filter((f) => f.contentType === 'post').map((f) => f.contentId)
  const replyIds = flags.filter((f) => f.contentType === 'reply').map((f) => f.contentId)

  const [posts, replies] = await Promise.all([
    postIds.length > 0
      ? prisma.forumPost.findMany({
          where: { id: { in: postIds } },
          select: { id: true, title: true, content: true },
        })
      : Promise.resolve([]),
    replyIds.length > 0
      ? prisma.forumReply.findMany({
          where: { id: { in: replyIds } },
          select: { id: true, content: true },
        })
      : Promise.resolve([]),
  ])

  const postMap = new Map(posts.map((p) => [p.id, p]))
  const replyMap = new Map(replies.map((r) => [r.id, r]))

  const enrichedFlags: EnrichedFlag[] = flags.map((flag) => {
    let contentPreview: string | null = null
    if (flag.contentType === 'post') {
      const post = postMap.get(flag.contentId)
      if (post) {
        contentPreview = `${post.title} — ${post.content}`.slice(0, 200)
      }
    } else if (flag.contentType === 'reply') {
      const reply = replyMap.get(flag.contentId)
      if (reply) {
        contentPreview = reply.content.slice(0, 200)
      }
    }

    return {
      id: flag.id,
      contentType: flag.contentType,
      contentId: flag.contentId,
      reason: flag.reason,
      status: flag.status,
      createdAt: flag.createdAt.toISOString(),
      reporter: flag.reporter ? { name: flag.reporter.name, email: flag.reporter.email } : null,
      contentPreview,
    }
  })

  const serializedLogs: ModerationLogEntry[] = isAdmin
    ? logs.map((log) => ({
        id: log.id,
        action: log.action,
        targetType: log.targetType,
        actorId: log.actorId,
        reason: log.reason,
        createdAt: log.createdAt.toISOString(),
        actor: log.actor
          ? { id: log.actor.id, email: log.actor.email, name: log.actor.name }
          : null,
      }))
    : []

  return (
    <div className="container mx-auto space-y-10 px-4 py-6 sm:px-6 sm:py-8 md:px-8">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Pending Reports
          </p>
          <p className="text-foreground mt-1 text-lg font-bold">{enrichedFlags.length}</p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Resolved Today
          </p>
          <p className="text-foreground mt-1 text-lg font-bold">{resolvedTodayCount}</p>
        </div>
      </div>

      <ModerationPanel flags={enrichedFlags} initialLogs={serializedLogs} isAdmin={isAdmin} />
    </div>
  )
}

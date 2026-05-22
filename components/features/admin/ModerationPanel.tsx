'use client'

import { useState } from 'react'
import { Bot } from 'lucide-react'
import { ModerationQueueTable } from './ModerationQueueTable'
import type { EnrichedFlag } from './ModerationQueueTable'

export interface ModerationLogEntry {
  id: string
  action: string
  targetType: string
  actorId: string
  reason: string | null
  createdAt: string
  actor: { id: string; email: string; name: string | null } | null
}

interface ModerationPanelProps {
  flags: EnrichedFlag[]
  initialLogs: ModerationLogEntry[]
  isAdmin: boolean
}

interface RawLog {
  id: string
  action: string
  targetType: string
  actorId: string
  reason: string | null
  createdAt: string
  actor: { id: string; email: string; name: string | null } | null
}

function actionLabel(action: string): string {
  if (action === 'FLAG_RESOLVED') return 'Dismissed'
  if (action === 'CONTENT_DELETED') return 'Content deleted'
  if (action === 'FLAG_CREATED') return 'Flag created'
  return action
}

function actionBadgeClass(action: string): string {
  if (action === 'CONTENT_DELETED')
    return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
  if (action === 'FLAG_RESOLVED')
    return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
  return 'bg-muted text-muted-foreground'
}

export function ModerationPanel({
  flags: initialFlags,
  initialLogs,
  isAdmin,
}: ModerationPanelProps) {
  const [flags, setFlags] = useState<EnrichedFlag[]>(initialFlags)
  const [logs, setLogs] = useState<ModerationLogEntry[]>(initialLogs)

  function removeFlag(flagId: string) {
    setFlags((prev) => prev.filter((f) => f.id !== flagId))
  }

  async function refreshLogs() {
    try {
      const res = await fetch('/api/moderation/logs?limit=100')
      if (!res.ok) return
      const data = (await res.json()) as { logs: RawLog[] }
      setLogs(
        data.logs.map((l) => ({
          id: l.id,
          action: l.action,
          targetType: l.targetType,
          actorId: l.actorId,
          reason: l.reason,
          createdAt: l.createdAt,
          actor: l.actor,
        }))
      )
    } catch {
      // silently ignore — stale logs are better than a crash
    }
  }

  return (
    <>
      {/* Moderation Queue */}
      <section>
        <h1 className="text-foreground text-lg font-bold">Moderation Queue</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Pending reported content requiring review. Use Dismiss to clear false positives or Delete
          to remove content and resolve the report.
        </p>
        <div className="border-border bg-card mt-6 overflow-hidden rounded-lg border">
          <ModerationQueueTable
            flags={flags}
            onRemoveFlag={removeFlag}
            onActionSuccess={refreshLogs}
          />
        </div>
      </section>

      {/* Moderation Logs — admin only */}
      {isAdmin && (
        <section>
          <h2 className="text-foreground text-lg font-semibold">Moderation Logs</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Audit trail of all moderation actions taken by moderators and admins.
          </p>
          <div className="border-border bg-card mt-6 overflow-x-auto rounded-lg border">
            {logs.length === 0 ? (
              <p className="text-muted-foreground px-4 py-8 text-center text-sm">
                No moderation actions recorded yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-border bg-muted border-b">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Action</th>
                      <th className="px-4 py-3 font-semibold">Target</th>
                      <th className="px-4 py-3 font-semibold">Actor</th>
                      <th className="px-4 py-3 font-semibold">Reason</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => {
                      const actorName =
                        log.actor?.name ?? log.actor?.email?.split('@')[0] ?? 'Unknown'
                      const isAiAction = log.reason?.startsWith('AI auto-flag:')

                      return (
                        <tr
                          key={log.id}
                          className="border-border border-b align-top last:border-b-0"
                        >
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${actionBadgeClass(log.action)}`}
                            >
                              {actionLabel(log.action)}
                            </span>
                          </td>
                          <td className="text-muted-foreground px-4 py-3 text-xs">
                            {log.targetType}
                          </td>
                          <td className="text-foreground px-4 py-3 text-xs font-medium">
                            {actorName}
                          </td>
                          <td className="max-w-xs px-4 py-3">
                            {log.reason ? (
                              <div className="flex flex-col gap-1">
                                {isAiAction && (
                                  <span className="inline-flex w-fit items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                    <Bot className="h-3 w-3" />
                                    AI
                                  </span>
                                )}
                                <p className="text-muted-foreground line-clamp-2 text-xs">
                                  {log.reason}
                                </p>
                              </div>
                            ) : (
                              <p className="text-muted-foreground text-xs italic">—</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-muted-foreground text-xs whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleString()}
                            </p>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  )
}

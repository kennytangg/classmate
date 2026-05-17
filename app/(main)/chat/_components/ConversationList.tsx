'use client'

import Link from 'next/link'
import { MessageSquarePlus, Search, Users } from 'lucide-react'
import type { Conversation, StudyGroup } from '../_hooks/useConversations'

const AVATAR_COLORS = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-fuchsia-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-indigo-500',
]

function getAvatarColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? 'bg-violet-500'
}

function formatTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  if (sameDay) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

interface ConversationListProps {
  conversations: Conversation[]
  studyGroups: StudyGroup[]
  loading: boolean
  error: string | null
  query: string
  activePath?: string
  onQueryChange: (q: string) => void
  onNewMessage: () => void
}

export function ConversationList({
  conversations,
  studyGroups,
  loading,
  error,
  query,
  activePath,
  onQueryChange,
  onNewMessage,
}: ConversationListProps) {
  const term = query.trim().toLowerCase()

  const filteredConversations = term
    ? conversations.filter((c) => {
        const name = c.participant.displayName ?? c.participant.email
        return (
          name.toLowerCase().includes(term) || c.lastMessage.content.toLowerCase().includes(term)
        )
      })
    : conversations

  const filteredGroups = term
    ? studyGroups.filter(
        (g) => g.name.toLowerCase().includes(term) || g.subject.toLowerCase().includes(term)
      )
    : studyGroups

  return (
    <>
      {/* Header */}
      <div className="border-border border-b p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-foreground text-xl font-bold">Messages</h2>
          <button
            onClick={onNewMessage}
            title="New message"
            aria-label="Start new conversation"
            className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg p-1.5 transition-colors"
          >
            <MessageSquarePlus className="h-5 w-5" />
          </button>
        </div>
        <div className="relative">
          <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
          <input
            type="text"
            placeholder="Search messages..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="bg-muted text-foreground focus:bg-card focus:ring-ring w-full rounded-lg border border-transparent py-2 pr-4 pl-9 text-sm transition-colors focus:ring-2 focus:outline-none"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading && <p className="text-muted-foreground p-4 text-sm">Loading...</p>}

        {!loading && error && <p className="text-semantic-error p-4 text-sm">{error}</p>}

        {!loading && !error && (
          <>
            {/* Direct Messages section — always visible */}
            <div className="border-border border-b px-4 py-2">
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Direct Messages
              </p>
            </div>

            {filteredConversations.map((conversation) => {
              const displayName =
                conversation.participant.displayName ?? conversation.participant.email
              const initial = displayName.charAt(0).toUpperCase() || 'U'
              const avatarColor = getAvatarColor(displayName)
              const href = `/chat/${conversation.userId}`
              const isActive = activePath === href

              return (
                <Link href={href} key={conversation.userId}>
                  <div
                    className={`border-border hover:bg-muted cursor-pointer border-b p-4 transition-colors ${
                      isActive ? 'bg-accent' : conversation.unreadCount > 0 ? 'bg-accent/50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div
                          className={`${avatarColor} flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white`}
                        >
                          {initial}
                        </div>
                        <div className="bg-semantic-success border-card absolute right-0 bottom-0 h-3 w-3 rounded-full border-2" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-baseline justify-between">
                          <h3 className="text-foreground truncate font-semibold">{displayName}</h3>
                          <span className="text-muted-foreground text-xs whitespace-nowrap">
                            {formatTime(conversation.lastMessage.createdAt)}
                          </span>
                        </div>
                        <p
                          className={`truncate text-sm ${
                            conversation.unreadCount > 0
                              ? 'text-foreground font-medium'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {conversation.lastMessage.content}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <div className="bg-primary text-primary-foreground flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 text-xs font-bold">
                          {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}

            {filteredConversations.length === 0 && (
              <div className="border-border border-b px-4 py-3">
                <p className="text-muted-foreground text-sm">
                  {query
                    ? 'No direct messages match your search.'
                    : 'No messages yet. Tap the compose button above to start a conversation.'}
                </p>
              </div>
            )}

            {/* Group Chats section — always visible */}
            <div className="border-border border-b px-4 py-2">
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Group Chats
              </p>
            </div>

            {filteredGroups.map((group) => {
              const initial = group.name.charAt(0).toUpperCase() || 'G'
              const avatarColor = getAvatarColor(group.name)
              const href = `/chat/group/${group.id}`
              const isActive = activePath === href

              return (
                <Link href={href} key={group.id}>
                  <div
                    className={`border-border hover:bg-muted cursor-pointer border-b p-4 transition-colors ${
                      isActive ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="shrink-0">
                        <div
                          className={`${avatarColor} flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white`}
                        >
                          {initial}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-foreground truncate font-semibold">{group.name}</h3>
                        <p className="text-muted-foreground flex items-center gap-1 truncate text-sm">
                          <Users className="h-3 w-3 shrink-0" />
                          {group.memberCount} members · {group.subject}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}

            {filteredGroups.length === 0 && (
              <div className="px-4 py-3">
                <p className="text-muted-foreground text-sm">
                  {query ? (
                    'No group chats match your search.'
                  ) : (
                    <>
                      Join a{' '}
                      <Link href="/groups" className="text-primary underline">
                        Study Group
                      </Link>{' '}
                      to start a group conversation.
                    </>
                  )}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

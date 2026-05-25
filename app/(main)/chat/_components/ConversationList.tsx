'use client'

import Link from 'next/link'
import { MessageSquarePlus, Search } from 'lucide-react'
import type { Conversation } from '../_hooks/useConversations'
import { getAvatarColor } from '@/lib/utils/avatarColor'

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
  loading: boolean
  error: string | null
  query: string
  activePath?: string
  onQueryChange: (q: string) => void
  onNewMessage: () => void
}

export function ConversationList({
  conversations,
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

  return (
    <>
      {/* Header */}
      <div className="border-border border-b p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-foreground text-lg font-semibold">Direct Messages</h2>
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
                          className={`${avatarColor} flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white`}
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
              <div className="px-4 py-3">
                <p className="text-muted-foreground text-sm">
                  {query
                    ? 'No messages match your search.'
                    : 'No messages yet. Tap the compose button above to start a conversation.'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'
import { useConversations } from './_hooks/useConversations'
import { ConversationList } from './_components/ConversationList'
import { NewMessageModal } from './_components/NewMessageModal'

export default function ChatPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [newMessageOpen, setNewMessageOpen] = useState(false)
  const { conversations, loading, error } = useConversations()

  return (
    <div className="h-full flex-1">
      {/* Mobile: conversation list */}
      <div className="bg-card flex h-full flex-col overflow-hidden md:hidden">
        <ConversationList
          conversations={conversations}
          loading={loading}
          error={error}
          query={query}
          onQueryChange={setQuery}
          onNewMessage={() => setNewMessageOpen(true)}
        />
      </div>

      {/* Desktop: empty state (layout.tsx sidebar already handles polling) */}
      <div className="bg-muted hidden h-full flex-col items-center justify-center p-8 text-center md:flex">
        <div className="bg-accent mb-6 flex h-20 w-20 items-center justify-center rounded-full">
          <Send className="text-primary ml-1 h-10 w-10" />
        </div>
        <h2 className="text-foreground mb-2 text-lg font-semibold">Select a conversation</h2>
        <p className="text-muted-foreground max-w-md">
          Choose a contact or group from the list to start chatting.
        </p>
      </div>

      <NewMessageModal
        open={newMessageOpen}
        onClose={() => setNewMessageOpen(false)}
        onSelectUser={(userId) => {
          setNewMessageOpen(false)
          router.push(`/chat/${userId}`)
        }}
      />
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { useConversations } from './_hooks/useConversations'
import { ConversationList } from './_components/ConversationList'
import { NewMessageModal } from './_components/NewMessageModal'

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [newMessageOpen, setNewMessageOpen] = useState(false)
  const { conversations, loading, error } = useConversations()

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="border-border hidden h-full w-80 min-w-[280px] shrink-0 flex-col border-r md:flex">
        <ConversationList
          conversations={conversations}
          loading={loading}
          error={error}
          query={query}
          activePath={pathname}
          onQueryChange={setQuery}
          onNewMessage={() => setNewMessageOpen(true)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex h-full flex-1 flex-col">{children}</div>

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

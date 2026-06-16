'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Loader2, UserPlus } from 'lucide-react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { getAvatarColor } from '@/lib/utils/avatarColor'

type Contact = {
  id: string
  email: string
  displayName: string | null
  avatarUrl: string | null
}

interface NewMessageModalProps {
  open: boolean
  onClose: () => void
  onSelectUser: (userId: string) => void
}

export function NewMessageModal({ open, onClose, onSelectUser }: NewMessageModalProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) return

    async function loadContacts() {
      setLoading(true)
      setError(null)
      setQuery('')
      try {
        const res = await fetch('/api/messages/contacts', { cache: 'no-store' })
        const data = (await res.json()) as { contacts?: Contact[]; error?: string }
        if (!res.ok) {
          setError(data.error ?? 'Unable to load contacts.')
          return
        }
        setContacts(data.contacts ?? [])
      } catch {
        setError('Unable to load contacts.')
      } finally {
        setLoading(false)
      }
    }

    void loadContacts()
  }, [open])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return contacts
    return contacts.filter((c) => {
      const name = c.displayName ?? c.email
      return name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term)
    })
  }, [contacts, query])

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Message a Connection</DialogTitle>
          <DialogDescription>You can only message people you are connected with.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
          <input
            type="text"
            placeholder="Search your connections..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-muted text-foreground focus:bg-card focus:ring-ring w-full rounded-full border border-transparent py-2 pr-4 pl-9 text-sm transition-colors focus:ring-2 focus:outline-none"
            autoFocus
          />
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="text-muted-foreground flex items-center justify-center py-8">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading contacts...
            </div>
          )}

          {!loading && error && (
            <p className="text-semantic-error py-4 text-center text-sm">{error}</p>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              {contacts.length === 0 ? (
                <>
                  <UserPlus className="text-muted-foreground h-8 w-8" />
                  <p className="text-muted-foreground text-sm">You have no connections yet.</p>
                  <Link
                    href="/discover"
                    onClick={onClose}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
                  >
                    Find People to Connect With
                  </Link>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">No connections match your search.</p>
              )}
            </div>
          )}

          {!loading &&
            !error &&
            filtered.map((contact) => {
              const displayName = contact.displayName ?? contact.email
              const initial = displayName.charAt(0).toUpperCase() || 'U'
              const avatarColor = getAvatarColor(displayName)

              return (
                <button
                  key={contact.id}
                  onClick={() => onSelectUser(contact.id)}
                  className="hover:bg-accent flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors"
                >
                  <div
                    className={`${avatarColor} flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-white`}
                  >
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-foreground truncate text-sm font-semibold">{displayName}</p>
                    {contact.displayName && (
                      <p className="text-muted-foreground truncate text-xs">{contact.email}</p>
                    )}
                  </div>
                </button>
              )
            })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

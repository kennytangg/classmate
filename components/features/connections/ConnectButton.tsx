'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlus, UserCheck, UserX, Clock, Loader2 } from 'lucide-react'

export type ConnectionStatus = 'connected' | 'pending_sent' | 'pending_received' | 'not_connected'

interface ConnectButtonProps {
  targetUserId: string
  initialStatus: ConnectionStatus
  initialConnectionId: string | null
  onStatusChange?: (status: ConnectionStatus, connectionId: string | null) => void
  /** When true, Accept/Reject buttons expand to fill available width */
  fullWidth?: boolean
}

export function ConnectButton({
  targetUserId,
  initialStatus,
  initialConnectionId,
  onStatusChange,
  fullWidth = false,
}: ConnectButtonProps) {
  const [status, setStatus] = useState<ConnectionStatus>(initialStatus)
  const [connectionId, setConnectionId] = useState<string | null>(initialConnectionId)
  const [loading, setLoading] = useState(false)

  function update(newStatus: ConnectionStatus, newConnectionId: string | null) {
    setStatus(newStatus)
    setConnectionId(newConnectionId)
    onStatusChange?.(newStatus, newConnectionId)
  }

  async function handleConnect() {
    setLoading(true)
    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: targetUserId }),
      })
      const data = (await res.json()) as { connection?: { id: string; status: string } }
      if (res.ok && data.connection) {
        const newStatus = data.connection.status === 'ACCEPTED' ? 'connected' : 'pending_sent'
        update(newStatus, data.connection.id)
      }
    } catch {
      // ignore network error
    } finally {
      setLoading(false)
    }
  }

  async function handleRespond(newStatus: 'ACCEPTED' | 'REJECTED') {
    if (!connectionId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/connections/${connectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        update(
          newStatus === 'ACCEPTED' ? 'connected' : 'not_connected',
          newStatus === 'ACCEPTED' ? connectionId : null
        )
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove() {
    if (!connectionId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/connections/${connectionId}`, { method: 'DELETE' })
      if (res.ok) {
        update('not_connected', null)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  if (status === 'not_connected') {
    return (
      <Button
        size="sm"
        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
        onClick={handleConnect}
        disabled={loading}
        aria-label="Connect"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        <span className="ml-1.5">Connect</span>
      </Button>
    )
  }

  if (status === 'pending_sent') {
    return (
      <Button
        size="sm"
        variant="outline"
        className="border-border rounded-full"
        onClick={handleRemove}
        disabled={loading}
        aria-label="Cancel request"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
        <span className="ml-1.5">Request Sent</span>
      </Button>
    )
  }

  if (status === 'pending_received') {
    return (
      <div className={`flex gap-2 ${fullWidth ? 'w-full' : ''}`}>
        <Button
          size="sm"
          className={`bg-primary text-primary-foreground hover:bg-primary/90 rounded-full ${fullWidth ? 'flex-1' : ''}`}
          onClick={() => handleRespond('ACCEPTED')}
          disabled={loading}
          aria-label="Accept connection"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserCheck className="h-4 w-4" />
          )}
          <span className="ml-1.5">Accept</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          className={`border-border rounded-full ${fullWidth ? 'flex-1' : ''}`}
          onClick={() => handleRespond('REJECTED')}
          disabled={loading}
          aria-label="Decline connection"
        >
          <UserX className="h-4 w-4" />
          <span className="ml-1.5">Decline</span>
        </Button>
      </div>
    )
  }

  // connected
  return (
    <Button
      size="sm"
      variant="outline"
      className="border-border rounded-full"
      onClick={handleRemove}
      disabled={loading}
      aria-label="Disconnect"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
      <span className="ml-1.5">Connected</span>
    </Button>
  )
}

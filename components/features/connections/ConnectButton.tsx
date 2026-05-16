'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { UserPlus, UserCheck, UserX, Clock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

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
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false)

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
      const data = (await res.json()) as {
        connection?: { id: string; status: string }
        error?: string
      }
      if (res.ok && data.connection) {
        const newStatus = data.connection.status === 'ACCEPTED' ? 'connected' : 'pending_sent'
        update(newStatus, data.connection.id)
        if (newStatus === 'connected') {
          toast.success('Connected! You can now chat with this person.')
        } else {
          toast.success('Connection request sent.')
        }
      } else {
        toast.error(data.error ?? 'Could not send connection request.')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
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
        if (newStatus === 'ACCEPTED') {
          toast.success('Connected! You can now chat.')
        } else {
          toast('Request declined.')
        }
      } else {
        toast.error('Could not respond to request. Please try again.')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove() {
    if (!connectionId) return
    setShowDisconnectDialog(false)
    setLoading(true)
    try {
      const res = await fetch(`/api/connections/${connectionId}`, { method: 'DELETE' })
      if (res.ok) {
        update('not_connected', null)
        toast('Connection removed.')
      } else {
        toast.error('Could not remove connection. Please try again.')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
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
        onClick={async () => {
          setLoading(true)
          try {
            const res = await fetch(`/api/connections/${connectionId}`, { method: 'DELETE' })
            if (res.ok) {
              update('not_connected', null)
              toast('Connection request withdrawn.')
            } else {
              toast.error('Could not withdraw request. Please try again.')
            }
          } catch {
            toast.error('Something went wrong. Please try again.')
          } finally {
            setLoading(false)
          }
        }}
        disabled={loading}
        aria-label="Cancel request"
        title="Click to withdraw this request"
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
    <>
      <Button
        size="sm"
        variant="outline"
        className="border-border rounded-full"
        onClick={() => setShowDisconnectDialog(true)}
        disabled={loading}
        aria-label="Disconnect"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
        <span className="ml-1.5">Connected</span>
      </Button>

      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove connection?</DialogTitle>
            <DialogDescription>
              You&apos;ll lose access to direct messages with this person. You can send a new
              request later to reconnect.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowDisconnectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleRemove} disabled={loading}>
              {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

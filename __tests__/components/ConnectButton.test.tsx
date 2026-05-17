/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ConnectButton } from '@/components/features/connections/ConnectButton'

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div role="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('ConnectButton component', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // Rendering per status
  // ---------------------------------------------------------------------------

  it('renders Connect button when status is not_connected', () => {
    render(
      <ConnectButton
        targetUserId="user-2"
        initialStatus="not_connected"
        initialConnectionId={null}
      />
    )

    expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument()
  })

  it('renders Pending button when status is pending_sent', () => {
    render(
      <ConnectButton
        targetUserId="user-2"
        initialStatus="pending_sent"
        initialConnectionId="conn-1"
      />
    )

    expect(screen.getByRole('button', { name: /cancel request/i })).toBeInTheDocument()
    expect(screen.getByText('Request Sent')).toBeInTheDocument()
  })

  it('renders Accept and Reject buttons when status is pending_received', () => {
    render(
      <ConnectButton
        targetUserId="user-2"
        initialStatus="pending_received"
        initialConnectionId="conn-1"
      />
    )

    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument()
  })

  it('renders Connected button when status is connected', () => {
    render(
      <ConnectButton targetUserId="user-2" initialStatus="connected" initialConnectionId="conn-1" />
    )

    expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument()
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // Connect action
  // ---------------------------------------------------------------------------

  it('calls POST /api/connections when Connect is clicked', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ connection: { id: 'conn-new', status: 'PENDING' } }),
    })

    render(
      <ConnectButton
        targetUserId="user-2"
        initialStatus="not_connected"
        initialConnectionId={null}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /connect/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: 'user-2' }),
      })
    })
  })

  it('transitions to pending_sent after successful connect', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ connection: { id: 'conn-new', status: 'PENDING' } }),
    })

    render(
      <ConnectButton
        targetUserId="user-2"
        initialStatus="not_connected"
        initialConnectionId={null}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /connect/i }))

    await waitFor(() => {
      expect(screen.getByText('Request Sent')).toBeInTheDocument()
    })
  })

  it('transitions to connected if API returns ACCEPTED status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ connection: { id: 'conn-1', status: 'ACCEPTED' } }),
    })

    render(
      <ConnectButton
        targetUserId="user-2"
        initialStatus="not_connected"
        initialConnectionId={null}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /connect/i }))

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument()
    })
  })

  // ---------------------------------------------------------------------------
  // Accept / Reject actions
  // ---------------------------------------------------------------------------

  it('calls PATCH with ACCEPTED when Accept is clicked', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })

    render(
      <ConnectButton
        targetUserId="user-2"
        initialStatus="pending_received"
        initialConnectionId="conn-1"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /accept/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/connections/conn-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACCEPTED' }),
      })
    })
  })

  it('transitions to connected after accepting', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })

    render(
      <ConnectButton
        targetUserId="user-2"
        initialStatus="pending_received"
        initialConnectionId="conn-1"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /accept/i }))

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument()
    })
  })

  it('calls PATCH with REJECTED and transitions to not_connected when Reject clicked', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })

    render(
      <ConnectButton
        targetUserId="user-2"
        initialStatus="pending_received"
        initialConnectionId="conn-1"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /decline/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/connections/conn-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' }),
      })
      expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument()
    })
  })

  // ---------------------------------------------------------------------------
  // Remove / Disconnect action
  // ---------------------------------------------------------------------------

  it('calls DELETE when Connected button is clicked', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })

    render(
      <ConnectButton targetUserId="user-2" initialStatus="connected" initialConnectionId="conn-1" />
    )

    fireEvent.click(screen.getByRole('button', { name: /disconnect/i }))

    // Confirm removal in the dialog
    const removeButton = await screen.findByRole('button', { name: /^remove$/i })
    fireEvent.click(removeButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/connections/conn-1', { method: 'DELETE' })
    })
  })

  it('transitions to not_connected after disconnecting', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })

    render(
      <ConnectButton targetUserId="user-2" initialStatus="connected" initialConnectionId="conn-1" />
    )

    fireEvent.click(screen.getByRole('button', { name: /disconnect/i }))

    // Confirm removal in the dialog
    const removeButton = await screen.findByRole('button', { name: /^remove$/i })
    fireEvent.click(removeButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument()
    })
  })

  it('cancels pending request via DELETE when Pending button is clicked', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })

    render(
      <ConnectButton
        targetUserId="user-2"
        initialStatus="pending_sent"
        initialConnectionId="conn-1"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /cancel request/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/connections/conn-1', { method: 'DELETE' })
      expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument()
    })
  })

  // ---------------------------------------------------------------------------
  // Callbacks and loading state
  // ---------------------------------------------------------------------------

  it('calls onStatusChange with new status after connect', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ connection: { id: 'conn-new', status: 'PENDING' } }),
    })

    const onStatusChange = jest.fn()
    render(
      <ConnectButton
        targetUserId="user-2"
        initialStatus="not_connected"
        initialConnectionId={null}
        onStatusChange={onStatusChange}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /connect/i }))

    await waitFor(() => {
      expect(onStatusChange).toHaveBeenCalledWith('pending_sent', 'conn-new')
    })
  })

  it('disables button while request is in flight', () => {
    global.fetch = jest.fn().mockImplementation(
      () =>
        new Promise(() => {
          // Never resolves
        })
    )

    render(
      <ConnectButton
        targetUserId="user-2"
        initialStatus="not_connected"
        initialConnectionId={null}
      />
    )

    const button = screen.getByRole('button', { name: /connect/i })
    fireEvent.click(button)

    expect(button).toBeDisabled()
  })

  it('does not change state when API returns error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    })

    render(
      <ConnectButton
        targetUserId="user-2"
        initialStatus="not_connected"
        initialConnectionId={null}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /connect/i }))

    await waitFor(() => {
      // Should remain as not_connected (Connect button still shown)
      expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument()
    })
  })
})

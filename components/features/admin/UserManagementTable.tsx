'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Search, Loader2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

type UserRole = 'STUDENT' | 'MODERATOR' | 'ADMIN' | 'OWNER'

interface AdminUser {
  id: string
  email: string
  name: string | null
  role: UserRole
  createdAt: string
  profile: { displayName: string | null; avatarUrl: string | null } | null
}

interface UserManagementTableProps {
  viewerRole: UserRole
}

const ROLE_COLORS: Record<UserRole, string> = {
  STUDENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  MODERATOR: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  ADMIN: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  OWNER: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
}

function getRoleOptions(viewerRole: UserRole, targetRole: UserRole): UserRole[] {
  if (targetRole === 'OWNER') return []
  if (viewerRole === 'ADMIN') {
    if (targetRole === 'ADMIN') return []
    return (['STUDENT', 'MODERATOR'] as UserRole[]).filter((r) => r !== targetRole)
  }
  if (viewerRole === 'OWNER') {
    return (['STUDENT', 'MODERATOR', 'ADMIN'] as UserRole[]).filter((r) => r !== targetRole)
  }
  return []
}

export function UserManagementTable({ viewerRole }: UserManagementTableProps) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [draftSearch, setDraftSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const limit = 10

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      })
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/users?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch users')
      const data = (await res.json()) as { users: AdminUser[]; total: number }
      setUsers(data.users)
      setTotal(data.total)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    void fetchUsers()
  }, [fetchUsers])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setSearch(draftSearch)
  }

  async function handleRoleChange(userId: string, newRole: UserRole) {
    setUpdatingId(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to update role')
        return
      }
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
      toast.success('Role updated')
    } catch {
      toast.error('Failed to update role')
    } finally {
      setUpdatingId(null)
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="border-border bg-background relative flex-1 rounded-lg border">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <input
            type="text"
            value={draftSearch}
            onChange={(e) => setDraftSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="text-foreground placeholder:text-muted-foreground w-full bg-transparent py-2 pr-4 pl-9 text-sm outline-none"
          />
        </div>
        <Button type="submit" variant="outline" size="sm">
          Search
        </Button>
      </form>

      {/* Table */}
      <div className="border-border overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="border-border bg-muted border-b">
            <tr>
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
              <th className="px-4 py-3 font-semibold">Role</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="text-muted-foreground px-4 py-8 text-center" colSpan={4}>
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td className="text-muted-foreground px-4 py-8 text-center" colSpan={4}>
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const displayName =
                  user.profile?.displayName ?? user.name ?? user.email.split('@')[0] ?? '?'
                const roleOptions = getRoleOptions(viewerRole, user.role)
                const canChangeRole = roleOptions.length > 0
                const isUpdating = updatingId === user.id

                return (
                  <tr key={user.id} className="border-border border-b last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-muted text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-foreground font-medium">{displayName}</span>
                      </div>
                    </td>
                    <td className="text-muted-foreground px-4 py-3 text-xs">{user.email}</td>
                    <td className="text-muted-foreground px-4 py-3 text-xs">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {canChangeRole ? (
                        <div className="flex items-center gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                disabled={isUpdating}
                                className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50 ${ROLE_COLORS[user.role]}`}
                              >
                                {isUpdating ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <ChevronDown className="h-3 w-3 opacity-70" />
                                )}
                                {user.role}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="min-w-[140px]">
                              <DropdownMenuLabel className="text-muted-foreground text-xs">
                                Change role to
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {roleOptions.map((role) => (
                                <DropdownMenuItem
                                  key={role}
                                  onClick={() => void handleRoleChange(user.id, role)}
                                  className="flex items-center gap-2"
                                >
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ROLE_COLORS[role]}`}
                                  >
                                    {role}
                                  </span>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ) : (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[user.role]}`}
                        >
                          {user.role}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs">
          {total} user{total !== 1 ? 's' : ''} total
          {totalPages > 1 && (
            <span>
              {' '}
              · Page {page} of {totalPages}
            </span>
          )}
        </p>
        {totalPages > 1 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

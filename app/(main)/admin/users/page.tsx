import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { requireAdmin } from '@/lib/authorize'
import { prisma } from '@/lib/prisma'
import { UserManagementTable } from '@/components/features/admin/UserManagementTable'

export default async function AdminUsersPage() {
  const session = await getSession()
  if (!session) notFound()

  const isAdmin = await requireAdmin(session)
  if (!isAdmin) notFound()

  const viewer = await prisma.user.findUnique({
    where: { id: session.id },
    select: { role: true },
  })

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 md:px-8">
      <h1 className="text-foreground text-lg font-bold">User Management</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Browse all registered users and their roles.
      </p>

      <div className="mt-6">
        <UserManagementTable viewerRole={viewer?.role ?? 'ADMIN'} />
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Footer } from 'components/layout/Footer'
import { Sidebar } from 'components/layout/Sidebar'
import { TopNavbar } from 'components/layout/TopNavbar'
import { UserRoleProvider } from '@/lib/contexts/user-role-context'

const SIDEBAR_COLLAPSED_KEY = 'classmate_sidebar_collapsed'

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  })
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed))
  }, [collapsed])

  const hideFooter =
    pathname.startsWith('/session') ||
    pathname.startsWith('/chat') ||
    pathname.startsWith('/ai-tutor') ||
    (pathname.startsWith('/groups/') && pathname !== '/groups')

  return (
    <UserRoleProvider>
      <div className="bg-background flex h-screen overflow-hidden">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        {/* Content area — offset by sidebar width on desktop */}
        <div
          className={`flex h-screen min-w-0 flex-1 flex-col transition-all duration-[300ms] ${collapsed ? 'md:ml-14' : 'md:ml-64'}`}
        >
          <TopNavbar onMobileMenuOpen={() => setMobileOpen(true)} />
          <main
            className={`flex flex-1 flex-col ${hideFooter ? 'overflow-hidden' : 'overflow-x-hidden overflow-y-auto'}`}
          >
            <div className={hideFooter ? 'flex flex-1 flex-col overflow-hidden' : 'flex-1'}>
              {children}
            </div>
            {!hideFooter && <Footer />}
          </main>
        </div>
      </div>
    </UserRoleProvider>
  )
}

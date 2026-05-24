'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Footer } from 'components/layout/Footer'
import { Sidebar } from 'components/layout/Sidebar'
import { TopNavbar } from 'components/layout/TopNavbar'
import { UserRoleProvider } from '@/lib/contexts/user-role-context'
import { NotificationProvider } from '@/lib/contexts/notification-context'

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
  // Tracks whether the hero sentinel is still visible — only meaningful on dashboard
  const [heroVisible, setHeroVisible] = useState(true)

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed))
  }, [collapsed])

  const isDashboard = pathname === '/dashboard'
  // Derived: transparent only when on dashboard AND hero top-half is still in view
  const navTransparent = isDashboard && heroVisible

  // IntersectionObserver on hero sentinel — no synchronous setState in effect body
  useEffect(() => {
    if (!isDashboard) return

    let observer: IntersectionObserver | undefined

    // rAF lets Dashboard children render before we query the DOM
    const raf = requestAnimationFrame(() => {
      const sentinel = document.getElementById('hero-nav-sentinel')
      if (!sentinel) return
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry) setHeroVisible(entry.isIntersecting)
        },
        { threshold: 0 }
      )
      observer.observe(sentinel)
    })

    return () => {
      cancelAnimationFrame(raf)
      observer?.disconnect()
    }
  }, [isDashboard])

  const hideFooter =
    pathname.startsWith('/session') ||
    pathname.startsWith('/chat') ||
    pathname.startsWith('/ai-tutor') ||
    (pathname.startsWith('/groups/') && pathname !== '/groups')

  return (
    <UserRoleProvider>
      <NotificationProvider>
        <div className="bg-background flex h-screen overflow-hidden">
          <Sidebar
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((c) => !c)}
            mobileOpen={mobileOpen}
            onMobileClose={() => setMobileOpen(false)}
          />

          {/* Content area — offset by sidebar width on desktop */}
          <div
            className={`relative flex h-screen min-w-0 flex-1 flex-col transition-all duration-[300ms] ${collapsed ? 'md:ml-14' : 'md:ml-64'}`}
          >
            {isDashboard ? (
              /* Floating navbar — transparent over hero top half, solid once sentinel exits viewport */
              <div className="absolute inset-x-0 top-0 z-40">
                <TopNavbar
                  transparent={navTransparent}
                  onMobileMenuOpen={() => setMobileOpen(true)}
                />
              </div>
            ) : (
              <TopNavbar onMobileMenuOpen={() => setMobileOpen(true)} />
            )}
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
      </NotificationProvider>
    </UserRoleProvider>
  )
}

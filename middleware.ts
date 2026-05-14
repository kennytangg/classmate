import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Routes that require authentication
const PROTECTED_PATHS = [
  '/admin',
  '/dashboard',
  '/forums',
  '/groups',
  '/materials',
  '/schedule',
  '/ai-tutor',
  '/chat',
  '/profile',
  '/discover',
  '/settings',
]

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/forums/:path*',
    '/groups/:path*',
    '/materials/:path*',
    '/schedule/:path*',
    '/ai-tutor/:path*',
    '/chat/:path*',
    '/profile/:path*',
    '/discover/:path*',
    '/settings/:path*',
  ],
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path))

  if (isProtected) {
    const firebaseSession = request.cookies.get('session')
    const betterAuthSession =
      request.cookies.get('better-auth.session_token') ??
      request.cookies.get('__Secure-better-auth.session_token')

    if (!firebaseSession && !betterAuthSession) {
      return NextResponse.rewrite(new URL('/_not-found', request.url))
    }
    // Role check is handled server-side in the page (requireModerator() for /admin/*)
  }

  return NextResponse.next()
}

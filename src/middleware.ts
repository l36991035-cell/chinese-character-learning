import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Client-side Firebase Auth can't be verified in middleware.
  // Use a session cookie pattern: redirect to /login if no __session cookie.
  // Security comes from Firestore rules; the cookie is a lightweight indicator only.
  const session = request.cookies.get('__session')
  const { pathname } = request.nextUrl
  const isAuthRoute = pathname.startsWith('/login')
  const isPublicRoute = pathname === '/' || isAuthRoute

  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-).*)'],
}

import { convexAuthNextjsMiddleware } from '@convex-dev/auth/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

const authMiddleware = convexAuthNextjsMiddleware()

export default function middleware(request: NextRequest, event: any) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/auth/signin/') || pathname.startsWith('/api/auth/callback/')) {
    return NextResponse.next()
  }

  return authMiddleware(request, event)
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}

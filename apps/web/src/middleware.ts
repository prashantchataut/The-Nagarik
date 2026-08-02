import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isLocale } from './lib/i18n'

const PUBLIC_FILE = /\.[^/]+$/

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/rss') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next()
  }

  const segment = pathname.split('/')[1]
  if (isLocale(segment)) {
    return NextResponse.next()
  }

  // Nepali is default at `/` via rewrite to `/ne`
  const url = request.nextUrl.clone()
  url.pathname = pathname === '/' ? '/ne' : `/ne${pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

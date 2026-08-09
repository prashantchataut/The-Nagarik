import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isLocale } from './lib/i18n'

const PUBLIC_FILE = /\.[^/]+$/
const METADATA_ROUTE = /^\/(?:icon|apple-icon)$/

function isCalendarHost(host: string): boolean {
  const h = host.split(':')[0].toLowerCase()
  return h.startsWith('calendar.') || h.startsWith('patro.')
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') ?? ''

  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/journalist') ||
    pathname.startsWith('/cms') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/rss') ||
    METADATA_ROUTE.test(pathname) ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next()
  }

  // Calendar / Patro subdomain → Nepali Patro product surface
  if (isCalendarHost(host)) {
    const url = request.nextUrl.clone()
    const segment = pathname.split('/')[1]
    const locale = isLocale(segment) ? segment : 'ne'
    if (pathname === '/' || pathname === `/${locale}` || pathname === `/${locale}/`) {
      url.pathname = `/${locale}/utilities/nepali-patro`
      return NextResponse.rewrite(url)
    }
    if (!pathname.includes('/utilities/nepali-patro') && !isLocale(segment)) {
      url.pathname = `/ne/utilities/nepali-patro`
      return NextResponse.rewrite(url)
    }
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

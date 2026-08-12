import type { NextResponse } from 'next/server'

/**
 * Session cookies carry `Secure` whenever the canonical site URL is https
 * (every real deployment). Keying off the URL scheme instead of NODE_ENV
 * lets production-mode servers on plain http (CI E2E, local `next start`,
 * LAN previews) keep working - a `Secure` cookie over http is silently
 * dropped by every compliant client.
 */
export function cookieSecure(): boolean {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (siteUrl) return siteUrl.startsWith('https://')
  return process.env.NODE_ENV === 'production'
}

/** Shared session cookie writer for reader auth routes. */
export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set('payload-token', token, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: cookieSecure(),
    maxAge: 60 * 60 * 24 * 30,
  })
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set('payload-token', '', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: cookieSecure(),
    maxAge: 0,
  })
}

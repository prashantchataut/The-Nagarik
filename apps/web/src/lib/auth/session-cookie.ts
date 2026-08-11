import type { NextResponse } from 'next/server'

/** Shared session cookie writer for reader auth routes. */
export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set('payload-token', token, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set('payload-token', '', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
  })
}

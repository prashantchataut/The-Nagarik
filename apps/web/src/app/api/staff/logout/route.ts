import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** Clear Payload auth cookie. Desk + /cms share the same token. */
export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set('payload-token', '', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
  })
  return response
}

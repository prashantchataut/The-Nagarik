import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/auth/session-cookie'

export const dynamic = 'force-dynamic'

/** Clear Payload auth cookie. Desk + /cms share the same token. */
export async function POST() {
  const response = NextResponse.json({ ok: true })
  clearSessionCookie(response)
  return response
}

import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/auth/session-cookie'

export const dynamic = 'force-dynamic'

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ ok: true })
  clearSessionCookie(response)
  return response
}

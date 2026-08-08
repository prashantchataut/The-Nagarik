import { NextResponse } from 'next/server'
import { getStaffSession, staffAuthReady } from '@/lib/auth/staff-session'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!staffAuthReady()) {
    return NextResponse.json({ user: null, authReady: false }, { status: 503 })
  }
  const session = await getStaffSession()
  return NextResponse.json({ user: session, authReady: true })
}

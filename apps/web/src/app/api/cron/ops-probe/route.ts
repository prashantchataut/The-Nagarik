import { NextResponse } from 'next/server'
import { assertCronAuth } from '@/lib/security'

export async function POST(request: Request) {
  if (!assertCronAuth(request.headers.get('authorization'))) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  // Placeholder for scheduled publish worker (Payload jobs in Phase 2)
  return NextResponse.json({ ok: true, job: 'ops-probe', at: new Date().toISOString() })
}

import { NextResponse } from 'next/server'
import { assertCronAuth } from '@/lib/security'

export async function POST(request: Request) {
  if (!assertCronAuth(request.headers.get('authorization'))) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const checks = {
    database: Boolean(process.env.DATABASE_URL?.trim()),
    payloadSecret: Boolean(process.env.PAYLOAD_SECRET && process.env.PAYLOAD_SECRET.length >= 32),
    blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim()),
    contentSource: process.env.CONTENT_SOURCE ?? 'facade',
    launchStatus: process.env.LAUNCH_STATUS ?? 'dev',
    allowDevFixtures: process.env.ALLOW_DEV_FIXTURES !== 'false',
    algorithms: process.env.ALGORITHMS_ENABLED !== 'false',
    sentryConfigured: Boolean(process.env.SENTRY_DSN?.trim()),
  }

  const readyForPayload =
    checks.database && checks.payloadSecret && checks.contentSource === 'payload'
  const liveSafe =
    checks.launchStatus !== 'live' ||
    (checks.contentSource === 'payload' && !checks.allowDevFixtures)

  return NextResponse.json({
    ok: true,
    job: 'ops-probe',
    at: new Date().toISOString(),
    checks,
    readyForPayload,
    liveSafe,
  })
}

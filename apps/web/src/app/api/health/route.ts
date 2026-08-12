import { NextResponse } from 'next/server'
import { payloadDeskAvailable } from '@/lib/admin/payload-desk'
import { emailConfigured } from '@/lib/email'
import { SITE } from '@/site.config'

export const dynamic = 'force-dynamic'

const startedAt = Date.now()

/**
 * Ops health probe for the network dashboard and uptime monitors.
 * Never leaks secrets; safe to expose publicly.
 */
export async function GET(): Promise<NextResponse> {
  const hasDb = Boolean(process.env.DATABASE_URL?.trim())
  const hasSecret = Boolean(
    process.env.PAYLOAD_SECRET && process.env.PAYLOAD_SECRET.length >= 32,
  )
  const explicit = process.env.CONTENT_SOURCE?.trim()
  const contentSource = explicit ?? (hasDb && hasSecret ? 'payload' : 'facade')

  return NextResponse.json(
    {
      ok: true,
      site: SITE.id,
      service: 'web',
      contentSource,
      cmsConfigured: payloadDeskAvailable(),
      emailConfigured: emailConfigured(),
      launchStatus: process.env.LAUNCH_STATUS ?? 'dev',
      uptimeSec: Math.round((Date.now() - startedAt) / 1000),
      time: new Date().toISOString(),
    },
    { headers: { 'cache-control': 'no-store' } },
  )
}

import { NextResponse } from 'next/server'
import { assertCronAuth } from '@/lib/security'
import { pruneEngagementEvents } from '@/lib/engagement'

export const dynamic = 'force-dynamic'

/**
 * Engagement event retention. The trending/velocity pipeline only reads the
 * last 2 hours of events, so anything older than the retention horizon is
 * pure storage cost. Run daily (Vercel cron / external scheduler):
 *
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
 *     https://<site>/api/cron/engagement-retention
 *
 * Horizon: ENGAGEMENT_RETENTION_DAYS (default 14, min 1). We keep more than
 * the 2h analysis window on purpose - a couple of weeks of raw events keeps
 * room for offline analysis before aggregation lands.
 */
const DEFAULT_RETENTION_DAYS = 14

export async function POST(request: Request): Promise<NextResponse> {
  if (!assertCronAuth(request.headers.get('authorization'))) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const raw = Number(process.env.ENGAGEMENT_RETENTION_DAYS)
  const days = Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : DEFAULT_RETENTION_DAYS
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  try {
    const result = await pruneEngagementEvents(cutoff)
    return NextResponse.json({
      ok: true,
      job: 'engagement-retention',
      retentionDays: days,
      cutoff,
      deleted: result.deleted,
      store: result.store,
    })
  } catch {
    return NextResponse.json(
      { ok: false, error: 'retention-failed' },
      { status: 500 },
    )
  }
}

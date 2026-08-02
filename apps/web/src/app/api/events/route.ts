import { NextResponse } from 'next/server'
import { z } from 'zod'
import { recordEvent } from '@/lib/engagement'

const EventSchema = z.object({
  type: z.enum(['impression', 'click', 'dwell', 'complete', 'share', 'search']),
  storyId: z.string().optional(),
  query: z.string().optional(),
  dwellMs: z.number().optional(),
  consent: z.literal(true),
})

export async function POST(request: Request) {
  const cookie = request.headers.get('cookie') ?? ''
  const consented = /(?:^|;\s*)tn_consent_analytics=1(?:;|$)/.test(cookie)
  if (!consented) {
    return NextResponse.json({ ok: false, reason: 'no-consent' }, { status: 204 })
  }

  const body = EventSchema.safeParse(await request.json().catch(() => null))
  if (!body.success) {
    return NextResponse.json({ ok: false, reason: 'invalid' }, { status: 400 })
  }

  await recordEvent({ ...body.data, at: new Date().toISOString(), consent: true })
  return NextResponse.json({ ok: true })
}

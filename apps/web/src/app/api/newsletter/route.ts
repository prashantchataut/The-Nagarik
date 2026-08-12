import { NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError, apiOk, clientIp } from '@/lib/api/http'
import { createRateLimiter } from '@/lib/api/rate-limit'
import { subscribeEmail } from '@/lib/newsletter'

export const dynamic = 'force-dynamic'

const SubscribeSchema = z.object({
  email: z.string().trim().email().max(200),
  locale: z.enum(['ne', 'en']).optional(),
  source: z.string().max(40).optional(),
})

/** 6 signup attempts per IP per 10 minutes. */
const limiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 6 })

export async function POST(request: Request): Promise<NextResponse> {
  const ip = clientIp(request)
  const limit = limiter.check(ip)
  if (limit.limited) {
    return apiError('rate-limit', 'Too many signups from this address; retry shortly.', {
      retryAfterSec: limit.retryAfterSec,
    })
  }

  const body = SubscribeSchema.safeParse(await request.json().catch(() => null))
  if (!body.success) {
    return apiError('invalid', 'A valid email address is required.')
  }

  try {
    const result = await subscribeEmail({
      email: body.data.email,
      locale: body.data.locale,
      source: body.data.source,
      ip,
    })
    return apiOk({ created: result.created })
  } catch {
    return apiError('server-error', 'Subscription could not be stored; please retry.')
  }
}

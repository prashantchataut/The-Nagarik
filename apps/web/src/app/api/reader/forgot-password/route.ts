import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { z } from 'zod'
import { apiError, apiOk, clientIp } from '@/lib/api/http'
import { createRateLimiter } from '@/lib/api/rate-limit'
import { payloadDeskAvailable } from '@/lib/admin/payload-desk'

export const dynamic = 'force-dynamic'

const Schema = z.object({
  email: z.string().trim().email().max(200),
  /** Honeypot - must stay empty. */
  website: z.string().max(0).optional(),
})

/** 4 reset requests per IP per 15 minutes. */
const limiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 4 })

/**
 * Reader password reset, step 1. ALWAYS answers `{ ok: true }` for a valid
 * request shape - whether or not the account exists - so the endpoint can
 * never be used to enumerate reader emails. The reset link goes out through
 * the configured email adapter (console logger in dev).
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!payloadDeskAvailable()) {
    return apiError('cms-offline', 'Account service is unavailable right now.')
  }

  const ip = clientIp(request)
  const limit = limiter.check(ip)
  if (limit.limited) {
    return apiError('rate-limit', 'Too many reset requests; please retry shortly.', {
      retryAfterSec: limit.retryAfterSec,
    })
  }

  const parsed = Schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return apiError('invalid', 'A valid email address is required.')
  }
  if (parsed.data.website && parsed.data.website.length > 0) {
    return apiOk({ status: 'sent' })
  }

  try {
    const payload = await getPayload({ config })
    await payload.forgotPassword({
      collection: 'readers',
      data: { email: parsed.data.email.toLowerCase() },
    })
  } catch {
    // Unknown email or transport hiccup: identical response, no oracle.
  }
  return apiOk({ status: 'sent' })
}

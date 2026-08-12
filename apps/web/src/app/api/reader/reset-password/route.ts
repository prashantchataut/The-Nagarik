import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { z } from 'zod'
import { apiError, clientIp } from '@/lib/api/http'
import { createRateLimiter } from '@/lib/api/rate-limit'
import { payloadDeskAvailable } from '@/lib/admin/payload-desk'
import { toReaderSession } from '@/lib/auth/reader-session'
import { setSessionCookie } from '@/lib/auth/session-cookie'

export const dynamic = 'force-dynamic'

const Schema = z.object({
  token: z.string().min(20).max(256),
  password: z.string().min(8).max(128),
})

/** 6 attempts per IP per 15 minutes (tokens are single-use and short-lived). */
const limiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 6 })

/**
 * Reader password reset, step 2: consume the emailed token, set the new
 * password, and log the reader straight in (the token proves email
 * ownership - a second login step would be pure friction).
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!payloadDeskAvailable()) {
    return apiError('cms-offline', 'Account service is unavailable right now.')
  }

  const ip = clientIp(request)
  const limit = limiter.check(ip)
  if (limit.limited) {
    return apiError('rate-limit', 'Too many attempts; please retry shortly.', {
      retryAfterSec: limit.retryAfterSec,
    })
  }

  const parsed = Schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return apiError('invalid', 'A reset token and a password of 8+ characters are required.')
  }

  try {
    const payload = await getPayload({ config })
    const result = await payload.resetPassword({
      collection: 'readers',
      data: { token: parsed.data.token, password: parsed.data.password },
      overrideAccess: true,
    })
    const response = NextResponse.json({
      ok: true,
      reader: toReaderSession(result.user as never),
    })
    if (result.token) setSessionCookie(response, result.token)
    return response
  } catch {
    return apiError('invalid', 'This reset link is invalid or has expired. Request a new one.', {
      reason: 'bad-token',
    })
  }
}

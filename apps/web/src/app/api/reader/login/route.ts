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

const LoginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(128),
})

/** 10 login attempts per IP per 10 minutes (payload also locks per account). */
const limiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 10 })

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

  const parsed = LoginSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return apiError('invalid', 'Email and password are required.')
  }

  try {
    const payload = await getPayload({ config })
    const result = await payload.login({
      collection: 'readers',
      data: { email: parsed.data.email.toLowerCase(), password: parsed.data.password },
    })
    const response = NextResponse.json({
      ok: true,
      reader: toReaderSession(result.user as never),
      exp: result.exp,
    })
    if (result.token) setSessionCookie(response, result.token)
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (/disabled/i.test(message)) {
      return apiError('forbidden', 'This reader account has been disabled.')
    }
    return apiError('unauthorized', 'Invalid email or password.', { reason: 'bad-credentials' })
  }
}

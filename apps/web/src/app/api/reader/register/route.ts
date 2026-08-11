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

const RegisterSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(128),
  locale: z.enum(['ne', 'en']).optional(),
  /** Honeypot - must stay empty. */
  website: z.string().max(0).optional(),
})

/** 5 registrations per IP per 15 minutes. */
const limiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 })

export async function POST(request: Request): Promise<NextResponse> {
  if (!payloadDeskAvailable()) {
    return apiError('cms-offline', 'Account service is unavailable right now.')
  }

  const ip = clientIp(request)
  const limit = limiter.check(ip)
  if (limit.limited) {
    return apiError('rate-limit', 'Too many signups; please retry shortly.', {
      retryAfterSec: limit.retryAfterSec,
    })
  }

  const parsed = RegisterSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return apiError('invalid', 'Name, valid email, and a password of 8+ characters are required.')
  }
  if (parsed.data.website && parsed.data.website.length > 0) {
    // Honeypot: pretend success, store nothing.
    return NextResponse.json({ ok: true })
  }

  const email = parsed.data.email.toLowerCase()
  const payload = await getPayload({ config })

  const existing = await payload.find({
    collection: 'readers',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.totalDocs > 0) {
    return apiError('invalid', 'An account with this email already exists.', {
      field: 'email',
      reason: 'email-taken',
    })
  }

  try {
    await payload.create({
      collection: 'readers',
      data: {
        name: parsed.data.name,
        email,
        password: parsed.data.password,
        locale: parsed.data.locale ?? 'ne',
        isActive: true,
      },
      overrideAccess: true,
    })

    const login = await payload.login({
      collection: 'readers',
      data: { email, password: parsed.data.password },
    })

    const response = NextResponse.json(
      { ok: true, reader: toReaderSession(login.user as never) },
      { status: 201 },
    )
    if (login.token) setSessionCookie(response, login.token)
    return response
  } catch {
    return apiError('server-error', 'Account could not be created; please retry.')
  }
}

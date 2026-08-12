import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { z } from 'zod'
import { apiError, apiOk, clientIp } from '@/lib/api/http'
import { createRateLimiter } from '@/lib/api/rate-limit'
import { payloadDeskAvailable } from '@/lib/admin/payload-desk'

export const dynamic = 'force-dynamic'

/**
 * Public journalist application intake.
 * Never creates any account: an editor/admin verifies identity first
 * (see /api/admin/journalist-applications).
 */
const ApplySchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(30).optional(),
  organization: z.string().trim().max(120).optional(),
  portfolioUrl: z
    .union([z.string().trim().url().max(300), z.literal('')])
    .optional(),
  message: z.string().trim().min(20, 'message-short').max(2000),
  locale: z.enum(['ne', 'en']).optional(),
  /** Honeypot - must stay empty. */
  website: z.string().max(0).optional(),
})

/** 3 applications per IP per hour. */
const limiter = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 3 })

export async function POST(request: Request): Promise<NextResponse> {
  if (!payloadDeskAvailable()) {
    return apiError('cms-offline', 'Applications are unavailable right now.')
  }

  const ip = clientIp(request)
  const limit = limiter.check(ip)
  if (limit.limited) {
    return apiError('rate-limit', 'Too many applications; please retry later.', {
      retryAfterSec: limit.retryAfterSec,
    })
  }

  const parsed = ApplySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return apiError('invalid', 'Application failed validation.', {
      issues: parsed.error.issues.map((i) => i.message),
    })
  }
  if (parsed.data.website && parsed.data.website.length > 0) {
    return apiOk({ status: 'pending' })
  }

  const email = parsed.data.email.toLowerCase()
  const payload = await getPayload({ config })

  // One pending application per email.
  const existing = await payload.find({
    collection: 'journalist-applications',
    where: { and: [{ email: { equals: email } }, { status: { equals: 'pending' } }] },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.totalDocs > 0) {
    return apiOk({ status: 'pending', duplicate: true })
  }

  const salt = process.env.PAYLOAD_SECRET ?? 'tn-apply'
  const ipHash = createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32)

  try {
    const doc = await payload.create({
      collection: 'journalist-applications',
      data: {
        name: parsed.data.name,
        email,
        phone: parsed.data.phone ?? '',
        organization: parsed.data.organization ?? '',
        portfolioUrl: parsed.data.portfolioUrl ?? '',
        message: parsed.data.message,
        status: 'pending',
        locale: parsed.data.locale ?? 'ne',
        ipHash,
      },
      overrideAccess: true,
    })
    return apiOk({ status: 'pending', id: String(doc.id) }, { status: 201 })
  } catch {
    return apiError('server-error', 'Application could not be stored; please retry.')
  }
}

import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { commentSpamScore, isDuplicateComment, moderateComment } from '@thenagarik/algorithms'
import { z } from 'zod'
import { apiError, apiOk, clientIp } from '@/lib/api/http'
import { createRateLimiter } from '@/lib/api/rate-limit'
import {
  createComment,
  listApprovedComments,
  listPendingComments,
  toPublicComment,
} from '@/lib/comments'

export const dynamic = 'force-dynamic'

const CreateSchema = z.object({
  articleId: z.string().min(1).max(128),
  parentId: z.string().min(1).max(128).nullish(),
  name: z.string().trim().min(2, 'name-short').max(60, 'name-long'),
  email: z
    .union([z.string().trim().email().max(200), z.literal('')])
    .optional(),
  body: z.string().trim().min(5, 'body-short').max(2000, 'body-long'),
  locale: z.enum(['ne', 'en']).optional(),
  consent: z.literal(true),
  /** Honeypot: must stay empty. Bots that fill it are silently dropped. */
  website: z.string().max(0).optional(),
})

/** 4 comments per IP per 10 minutes. */
const limiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 4 })

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url)
  const articleId = url.searchParams.get('articleId')?.trim()
  if (!articleId || articleId.length > 128) {
    return apiError('invalid', 'articleId query parameter is required.')
  }
  const comments = await listApprovedComments(articleId)
  return apiOk(
    { comments: comments.map(toPublicComment) },
    { cacheControl: 'public, max-age=30, stale-while-revalidate=120' },
  )
}

export async function POST(request: Request): Promise<NextResponse> {
  const ip = clientIp(request)
  const limit = limiter.check(ip)
  if (limit.limited) {
    return apiError('rate-limit', 'Too many comments; please retry in a few minutes.', {
      retryAfterSec: limit.retryAfterSec,
    })
  }

  const parsed = CreateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return apiError('invalid', 'Comment validation failed.', {
      issues: parsed.error.issues.map((i) => i.message),
    })
  }

  // Honeypot triggered: pretend success without persisting anything.
  if (parsed.data.website && parsed.data.website.length > 0) {
    return apiOk({ status: 'pending' })
  }

  // ALGO quality.comment_spam + mod.lexical: high-confidence spam is
  // silently dropped (same response as success - no oracle for bots).
  // Borderline content still lands in the human moderation queue.
  const spam = commentSpamScore(parsed.data.body)
  const verdict = moderateComment({ text: parsed.data.body })
  if (spam.score >= 0.6 || verdict.suggested === 'reject') {
    return apiOk({ status: 'pending' })
  }

  // ALGO quality.dup_comment: identical/near-identical repeat on the same
  // article is dropped the same silent way. Pending comments count too -
  // double-submits are the most common duplicate.
  const [approved, pending] = await Promise.all([
    listApprovedComments(parsed.data.articleId),
    listPendingComments(100),
  ])
  const recentTexts = [
    ...approved.map((c) => c.body),
    ...pending.filter((c) => c.articleId === parsed.data.articleId).map((c) => c.body),
  ].slice(-40)
  if (isDuplicateComment(parsed.data.body, recentTexts)) {
    return apiOk({ status: 'pending' })
  }

  const salt = process.env.PAYLOAD_SECRET ?? 'tn-comments'
  const ipHash = createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32)

  try {
    const record = await createComment({
      articleId: parsed.data.articleId,
      parentId: parsed.data.parentId ?? null,
      name: parsed.data.name,
      email: parsed.data.email || '',
      body: parsed.data.body,
      locale: parsed.data.locale ?? 'ne',
      ipHash,
    })
    return apiOk({ status: record.status, id: record.id }, { status: 201 })
  } catch {
    return apiError('server-error', 'Comment could not be stored; please retry.')
  }
}

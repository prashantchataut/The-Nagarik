import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createComment,
  listApprovedComments,
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

/** Per-instance rate limit: 4 comments per IP per 10 minutes. */
const attempts = new Map<string, number[]>()
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 4

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const list = (attempts.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (list.length >= MAX_PER_WINDOW) {
    attempts.set(ip, list)
    return true
  }
  list.push(now)
  attempts.set(ip, list)
  return false
}

function clientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'local'
  )
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const articleId = url.searchParams.get('articleId')?.trim()
  if (!articleId || articleId.length > 128) {
    return NextResponse.json({ ok: false, reason: 'invalid' }, { status: 400 })
  }
  const comments = await listApprovedComments(articleId)
  return NextResponse.json(
    { ok: true, comments: comments.map(toPublicComment) },
    { headers: { 'cache-control': 'public, max-age=30, stale-while-revalidate=120' } },
  )
}

export async function POST(request: Request) {
  const ip = clientIp(request)
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, reason: 'rate-limit' }, { status: 429 })
  }

  const parsed = CreateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, reason: 'invalid', issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 },
    )
  }

  // Honeypot triggered: pretend success without persisting anything.
  if (parsed.data.website && parsed.data.website.length > 0) {
    return NextResponse.json({ ok: true, status: 'pending' })
  }

  const salt = process.env.PAYLOAD_SECRET ?? 'tn-comments'
  const ipHash = createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32)

  const record = await createComment({
    articleId: parsed.data.articleId,
    parentId: parsed.data.parentId ?? null,
    name: parsed.data.name,
    email: parsed.data.email || '',
    body: parsed.data.body,
    locale: parsed.data.locale ?? 'ne',
    ipHash,
  })

  return NextResponse.json({ ok: true, status: record.status, id: record.id }, { status: 201 })
}

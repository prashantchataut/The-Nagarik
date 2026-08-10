import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const SubscribeSchema = z.object({
  email: z.string().trim().email().max(200),
  locale: z.enum(['ne', 'en']).optional(),
})

const DATA_DIR = path.join(process.cwd(), '.data')
const FILE = path.join(DATA_DIR, 'newsletter.json')

type Store = { subscribers: Array<{ emailHash: string; email: string; locale: string; at: string }> }

async function load(): Promise<Store> {
  try {
    return JSON.parse(await readFile(FILE, 'utf8')) as Store
  } catch {
    return { subscribers: [] }
  }
}

/** Naive per-instance rate limiting: 6 signups per IP per 10 minutes. */
const attempts = new Map<string, number[]>()
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 6

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

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'local'
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, reason: 'rate-limit' }, { status: 429 })
  }

  const body = SubscribeSchema.safeParse(await request.json().catch(() => null))
  if (!body.success) {
    return NextResponse.json({ ok: false, reason: 'invalid' }, { status: 400 })
  }

  const email = body.data.email.toLowerCase()
  const emailHash = createHash('sha256').update(email).digest('hex')
  const store = await load()
  if (!store.subscribers.some((s) => s.emailHash === emailHash)) {
    store.subscribers.push({
      emailHash,
      email,
      locale: body.data.locale ?? 'ne',
      at: new Date().toISOString(),
    })
    store.subscribers = store.subscribers.slice(-20_000)
    await mkdir(DATA_DIR, { recursive: true })
    await writeFile(FILE, JSON.stringify(store, null, 2), 'utf8')
  }

  return NextResponse.json({ ok: true })
}

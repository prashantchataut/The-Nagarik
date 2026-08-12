import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '@payload-config'
import { payloadDeskAvailable } from '@/lib/admin/payload-desk'

export type SubscribeInput = {
  email: string
  locale?: 'ne' | 'en'
  source?: string
  ip?: string
}

export type SubscribeResult = {
  created: boolean
  backend: 'payload' | 'file'
}

const DATA_DIR = path.join(process.cwd(), '.data')
const FILE = path.join(DATA_DIR, 'newsletter.json')

type FileStore = {
  subscribers: Array<{ emailHash: string; email: string; locale: string; source: string; at: string }>
}

function hashEmail(email: string): string {
  return createHash('sha256').update(email).digest('hex')
}

export function hashIp(ip: string): string {
  const salt = process.env.PAYLOAD_SECRET ?? 'tn-newsletter'
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32)
}

async function loadFile(): Promise<FileStore> {
  try {
    const store = JSON.parse(await readFile(FILE, 'utf8')) as FileStore
    if (!Array.isArray(store.subscribers)) return { subscribers: [] }
    return store
  } catch {
    return { subscribers: [] }
  }
}

/**
 * Subscribe an email. Payload-first (unique index enforces dedupe at the DB),
 * gitignored file fallback keeps the reader flow alive without Neon.
 */
export async function subscribeEmail(input: SubscribeInput): Promise<SubscribeResult> {
  const email = input.email.trim().toLowerCase()
  const locale = input.locale ?? 'ne'
  const source = input.source ?? 'web'
  const ipHash = hashIp(input.ip ?? 'local')

  if (payloadDeskAvailable()) {
    try {
      const p = await getPayload({ config })
      const existing = await p.find({
        collection: 'newsletter-subscribers',
        where: { email: { equals: email } },
        limit: 1,
        overrideAccess: true,
      })
      if (existing.totalDocs > 0) {
        const doc = existing.docs[0] as { id: string | number; status?: unknown }
        // Re-subscribing after an unsubscribe is an explicit opt-in again.
        if (doc.status === 'unsubscribed') {
          await p.update({
            collection: 'newsletter-subscribers',
            id: doc.id,
            data: { status: 'subscribed', source },
            overrideAccess: true,
          })
        }
        return { created: false, backend: 'payload' }
      }
      await p.create({
        collection: 'newsletter-subscribers',
        data: { email, locale, status: 'subscribed', source, ipHash },
        overrideAccess: true,
      })
      return { created: true, backend: 'payload' }
    } catch {
      // Fall through to the file store; never drop a reader signup.
    }
  }

  const store = await loadFile()
  const emailHash = hashEmail(email)
  if (store.subscribers.some((s) => s.emailHash === emailHash)) {
    return { created: false, backend: 'file' }
  }
  store.subscribers.push({ emailHash, email, locale, source, at: new Date().toISOString() })
  store.subscribers = store.subscribers.slice(-20_000)
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(FILE, JSON.stringify(store, null, 2), 'utf8')
  return { created: true, backend: 'file' }
}

/** Editorial helper: current subscriber count (Payload only). */
export async function countSubscribers(): Promise<number | null> {
  if (!payloadDeskAvailable()) {
    const store = await loadFile()
    return store.subscribers.length
  }
  try {
    const p = await getPayload({ config })
    const result = await p.count({
      collection: 'newsletter-subscribers',
      where: { status: { equals: 'subscribed' } },
      overrideAccess: true,
    })
    return result.totalDocs
  } catch {
    return null
  }
}

import { cache } from 'react'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { payloadDeskAvailable } from '@/lib/admin/payload-desk'

/**
 * Reader session - strictly the `readers` auth collection.
 * A staff (`users`) token never resolves to a reader session and vice versa:
 * the two account types are hard-separated at every gate.
 */
export type ReaderSession = {
  id: string
  email: string
  name: string
  avatarColor: string
  interests: string[]
  locale: 'ne' | 'en'
}

export function readerAuthReady(): boolean {
  return payloadDeskAvailable()
}

type ReaderUserDoc = {
  id: string | number
  collection?: string
  email?: unknown
  name?: unknown
  avatarColor?: unknown
  interests?: Array<{ slug?: unknown }> | null
  locale?: unknown
  isActive?: unknown
}

export function toReaderSession(user: ReaderUserDoc): ReaderSession {
  return {
    id: String(user.id),
    email: typeof user.email === 'string' ? user.email : '',
    name: typeof user.name === 'string' ? user.name : '',
    avatarColor: typeof user.avatarColor === 'string' ? user.avatarColor : 'teal',
    interests: Array.isArray(user.interests)
      ? user.interests.map((row) => String(row?.slug ?? '')).filter(Boolean)
      : [],
    locale: user.locale === 'en' ? 'en' : 'ne',
  }
}

export const getReaderSession = cache(async (): Promise<ReaderSession | null> => {
  if (!readerAuthReady()) return null
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: await headers() })
    if (!user || user.collection !== 'readers') return null
    if ((user as ReaderUserDoc).isActive === false) return null
    return toReaderSession(user as ReaderUserDoc)
  } catch {
    return null
  }
})

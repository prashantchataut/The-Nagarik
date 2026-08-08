import { createFacadeContent, type ContentFacade } from '@thenagarik/content'
import { createPayloadContentClient } from '@/lib/payload-content'

/**
 * Reader content client.
 * Prefer Payload whenever CONTENT_SOURCE=payload (or auto when DB+secret exist).
 * Facade fixtures are local UI-only — never treated as newsroom content on the desk.
 */
export function getContent(): ContentFacade {
  const hasDb = Boolean(process.env.DATABASE_URL?.trim())
  const hasSecret = Boolean(process.env.PAYLOAD_SECRET && process.env.PAYLOAD_SECRET.length >= 32)
  const explicit = process.env.CONTENT_SOURCE?.trim()
  const source = explicit ?? (hasDb && hasSecret ? 'payload' : 'facade')
  const allow = process.env.ALLOW_DEV_FIXTURES !== 'false'
  const launch = process.env.LAUNCH_STATUS ?? 'dev'

  if (source === 'payload') {
    if (hasDb && hasSecret) {
      return createPayloadContentClient()
    }
    if (launch === 'live') {
      throw new Error(
        'CONTENT_SOURCE=payload requires DATABASE_URL and PAYLOAD_SECRET (≥32) in live launch.',
      )
    }
    console.warn(
      '[content] CONTENT_SOURCE=payload but DATABASE_URL/PAYLOAD_SECRET missing; falling back to facade fixtures.',
    )
  }

  if (launch === 'live' && allow === false && source === 'facade') {
    throw new Error('Dev fixtures blocked in live launch.')
  }

  return createFacadeContent({ allowDevFixtures: allow || launch !== 'live' })
}

export function siteUrl(path = '') {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

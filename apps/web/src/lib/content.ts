import { createFacadeContent, type ContentFacade } from '@thenagarik/content'

export function getContent(): ContentFacade {
  const source = process.env.CONTENT_SOURCE ?? 'facade'
  const allow = process.env.ALLOW_DEV_FIXTURES !== 'false'
  const launch = process.env.LAUNCH_STATUS ?? 'dev'

  if (source === 'payload') {
    // Payload Local API wiring lands with CMS cutover; fail soft to facade in dev only.
    if (launch === 'live') {
      throw new Error('CONTENT_SOURCE=payload requires Payload client (Phase 2).')
    }
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

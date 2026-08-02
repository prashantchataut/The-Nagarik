import { ENGLISH_GATE, MEDIA_PUBLISH_RULES, STAFF_ROLES, COLLECTIONS } from './contracts'

/**
 * Payload config placeholder — wire with `payload` + `@payloadcms/next` when Neon is ready.
 * Collections mirror `@thenagarik/content` Article schema.
 */
export const payloadBootstrap = {
  adminRoute: '/admin/cms',
  collections: COLLECTIONS,
  roles: STAFF_ROLES,
  englishGate: ENGLISH_GATE,
  media: MEDIA_PUBLISH_RULES,
  hooks: {
    afterChange: 'POST /api/revalidate with Bearer REVALIDATE_SECRET (timing-safe)',
  },
  db: 'postgres via DATABASE_URL (Neon); push:false in production; use migrations',
  storage: 'Vercel Blob plugin',
}

export default payloadBootstrap

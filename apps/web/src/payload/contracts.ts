/**
 * Payload CMS collection contracts for The Nagarik.
 * Activated when DATABASE_URL + PAYLOAD_SECRET are set and payload dependencies are installed.
 * One content path only — no JSON shadow store in production.
 */

export const ARTICLE_FIELDS = [
  'titleNe',
  'titleEn',
  'deckNe',
  'deckEn',
  'bodyNe',
  'bodyEn',
  'slug',
  'category',
  'authors',
  'tags',
  'province',
  'hero',
  'status',
  'englishStatus',
  'isBreaking',
  'editorialPriority',
  'attribution',
  'corrections',
  'publishedAt',
  'seoTitleNe',
  'seoTitleEn',
  'seoDescriptionNe',
  'seoDescriptionEn',
  'packageId',
  'createdBy',
  'submittedAt',
] as const

export const MEDIA_PUBLISH_RULES = {
  altRequired: true,
  creditRequired: true,
  emptyAltRejected: true,
} as const

export const ENGLISH_GATE = {
  publicEnRequires: 'englishStatus === "published"',
  neverAutoMachineTranslatePublish: true,
} as const

export const STAFF_ROLES = ['journalist', 'editor', 'publisher', 'admin'] as const

export const COLLECTIONS = ['articles', 'categories', 'authors', 'tags', 'media', 'users'] as const

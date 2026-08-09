import type { CollectionBeforeChangeHook, CollectionBeforeValidateHook } from 'payload'
import { hasAnyRole, publisherRoles } from '../access/rbac'
import { assertPublishable } from '../publish-gates'

const ALLOWED_BLOCKS = new Set([
  'paragraph',
  'heading2',
  'heading3',
  'pullQuote',
  'list',
  'image',
])

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
}

export function validateBodyBlocks(value: unknown, fieldName: string): string | null {
  if (!Array.isArray(value) || value.length === 0) {
    return `${fieldName} must contain at least one block.`
  }
  for (const [index, raw] of value.entries()) {
    const block = asRecord(raw)
    const type = typeof block.type === 'string' ? block.type : ''
    if (!ALLOWED_BLOCKS.has(type)) {
      return `${fieldName} block ${index + 1} has an unsupported type.`
    }
    if (['paragraph', 'heading2', 'heading3', 'pullQuote'].includes(type)) {
      if (!String(block.text ?? '').trim()) {
        return `${fieldName} block ${index + 1} requires text.`
      }
    }
    if (type === 'list') {
      if (!Array.isArray(block.items) || block.items.length === 0) {
        return `${fieldName} block ${index + 1} requires at least one list item.`
      }
    }
    if (type === 'image') {
      const media = block.media
      if (!media) return `${fieldName} block ${index + 1} requires media.`
    }
  }
  return null
}

function relationshipIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === 'string' || typeof item === 'number') return String(item)
      if (item && typeof item === 'object' && 'id' in item) {
        return String((item as { id: string | number }).id)
      }
      return ''
    })
    .filter(Boolean)
}

function relationshipId(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return String((value as { id: string | number }).id)
  }
  return ''
}

function heroMeta(value: unknown): { alt?: string; credit?: string } | null {
  if (!value || typeof value !== 'object') return null
  const media = value as { alt?: string; credit?: string }
  return { alt: media.alt, credit: media.credit }
}

/** Reject empty alt / missing credit on media uploads. */
export const enforceMediaCredit: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) return data
  if (!String(data.alt ?? '').trim()) {
    throw new Error('Media alt text is required.')
  }
  if (!String(data.credit ?? '').trim()) {
    throw new Error('Media credit is required.')
  }
  return data
}

const PUBLISHER_STATUSES = new Set(['published', 'scheduled', 'retracted'])
const JOURNALIST_STATUSES = new Set(['draft', 'in_review'])

/** Gate publish transitions: authors, scheduling, body shape, hero credit, role status. */
export const enforceArticlePublish: CollectionBeforeChangeHook = ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!data) return data
  const merged = { ...(originalDoc ?? {}), ...data } as Record<string, unknown>
  const status = String(merged.status ?? 'draft')
  const prevStatus = originalDoc && typeof originalDoc === 'object' && 'status' in originalDoc
    ? String((originalDoc as { status?: string }).status ?? 'draft')
    : 'draft'

  if (operation === 'create' && req.user?.id != null && data.createdBy == null) {
    data.createdBy = req.user.id
  }

  if (data.status !== undefined) {
    const next = String(data.status)
    const canPublish = hasAnyRole(req.user, publisherRoles)
    if (PUBLISHER_STATUSES.has(next) && !canPublish) {
      throw new Error('Only publisher/admin can set published, scheduled, or retracted.')
    }
    if (!canPublish && !JOURNALIST_STATUSES.has(next)) {
      throw new Error('Journalists may only set draft or in_review.')
    }
    if (next === 'in_review' && prevStatus !== 'in_review' && !data.submittedAt) {
      data.submittedAt = new Date().toISOString()
    }
  }

  if (status === 'published' || status === 'scheduled' || data.status === 'published' || data.status === 'scheduled') {
    const bodyError = validateBodyBlocks(merged.bodyNe, 'bodyNe')
    if (bodyError) throw new Error(bodyError)

    if (merged.englishStatus === 'published' || Array.isArray(merged.bodyEn)) {
      if (Array.isArray(merged.bodyEn) && merged.bodyEn.length > 0) {
        const enError = validateBodyBlocks(merged.bodyEn, 'bodyEn')
        if (enError) throw new Error(enError)
      }
    }

    const errors = assertPublishable({
      status,
      englishStatus: String(merged.englishStatus ?? 'none'),
      authorIds: relationshipIds(merged.authors),
      categoryId: relationshipId(merged.category),
      titleNe: typeof merged.titleNe === 'string' ? merged.titleNe : undefined,
      deckNe: typeof merged.deckNe === 'string' ? merged.deckNe : undefined,
      slug: typeof merged.slug === 'string' ? merged.slug : undefined,
      publishedAt: typeof merged.publishedAt === 'string' ? merged.publishedAt : undefined,
      hero: heroMeta(merged.hero),
      titleEn: typeof merged.titleEn === 'string' ? merged.titleEn : undefined,
      bodyEn: Array.isArray(merged.bodyEn) ? merged.bodyEn : undefined,
    })
    if (errors.length) throw new Error(errors.join('; '))

    if (!merged.publishedAt && (operation === 'create' || data.status === 'published')) {
      data.publishedAt = new Date().toISOString()
    }
  }

  if (merged.attribution && merged.attribution !== 'original') {
    throw new Error('The Nagarik publishes original journalism only (attribution must be original).')
  }

  return data
}

import type { CollectionBeforeChangeHook, CollectionBeforeValidateHook } from 'payload'
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

/** Gate publish transitions: authors, EN title, body shape, hero credit. */
export const enforceArticlePublish: CollectionBeforeChangeHook = ({ data, operation, originalDoc }) => {
  if (!data) return data
  const merged = { ...(originalDoc ?? {}), ...data } as Record<string, unknown>
  const status = String(merged.status ?? 'draft')

  if (status === 'published' || data.status === 'published') {
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

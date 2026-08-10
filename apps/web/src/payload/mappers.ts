import type { Article, Author, BodyBlock, Category, MediaRef } from '@thenagarik/content'

type Rel = string | number | { id?: string | number; slug?: string } | null | undefined

function idOf(value: Rel): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value.id !== undefined && value.id !== null) return String(value.id)
  return ''
}

function slugOf(value: Rel): string {
  if (value && typeof value === 'object' && value.slug) return String(value.slug)
  return ''
}

function asIso(value: unknown): string | undefined {
  if (!value) return undefined
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
  }
  return undefined
}

function mapMedia(raw: unknown): MediaRef | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const m = raw as Record<string, unknown>
  const url = typeof m.url === 'string' ? m.url : ''
  const alt = typeof m.alt === 'string' ? m.alt : ''
  const credit = typeof m.credit === 'string' ? m.credit : ''
  if (!url || !alt || !credit) return undefined
  return {
    id: String(m.id ?? ''),
    url,
    alt,
    credit,
    width: typeof m.width === 'number' ? m.width : undefined,
    height: typeof m.height === 'number' ? m.height : undefined,
  }
}

function mapBlocks(raw: unknown): BodyBlock[] {
  if (!Array.isArray(raw)) return []
  const out: BodyBlock[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const b = item as Record<string, unknown>
    const type = b.type
    switch (type) {
      case 'paragraph':
      case 'heading2':
      case 'heading3':
        if (typeof b.text === 'string') out.push({ type, text: b.text })
        break
      case 'pullQuote':
        if (typeof b.text === 'string') {
          out.push({
            type: 'pullQuote',
            text: b.text,
            attribution: typeof b.attribution === 'string' ? b.attribution : undefined,
          })
        }
        break
      case 'list':
        if (Array.isArray(b.items)) {
          out.push({
            type: 'list',
            ordered: Boolean(b.ordered),
            items: b.items.filter((x): x is string => typeof x === 'string'),
          })
        }
        break
      case 'image': {
        const media = mapMedia(b.media)
        if (media) {
          out.push({
            type: 'image',
            media,
            caption: typeof b.caption === 'string' ? b.caption : undefined,
          })
        }
        break
      }
      default:
        break
    }
  }
  return out
}

export function mapCategory(doc: Record<string, unknown>): Category {
  return {
    id: String(doc.id),
    slug: String(doc.slug ?? ''),
    nameNe: String(doc.nameNe ?? ''),
    nameEn: String(doc.nameEn ?? ''),
    descriptionNe: typeof doc.descriptionNe === 'string' ? doc.descriptionNe : undefined,
    descriptionEn: typeof doc.descriptionEn === 'string' ? doc.descriptionEn : undefined,
  }
}

export function mapAuthor(doc: Record<string, unknown>): Author {
  const avatar = doc.avatar as { url?: unknown } | string | number | null | undefined
  const avatarUrl =
    avatar && typeof avatar === 'object' && typeof avatar.url === 'string'
      ? avatar.url
      : undefined
  const beatsRaw = Array.isArray(doc.beats) ? doc.beats : []
  const beats = beatsRaw
    .map((row) => (row && typeof row === 'object' ? String((row as { beat?: unknown }).beat ?? '') : ''))
    .filter(Boolean)
  return {
    id: String(doc.id),
    slug: String(doc.slug ?? ''),
    nameNe: String(doc.nameNe ?? ''),
    nameEn: typeof doc.nameEn === 'string' ? doc.nameEn : undefined,
    bioNe: typeof doc.bioNe === 'string' ? doc.bioNe : undefined,
    bioEn: typeof doc.bioEn === 'string' ? doc.bioEn : undefined,
    avatarUrl,
    beats: beats.length ? beats : undefined,
  }
}

export function mapArticle(doc: Record<string, unknown>): Article {
  const category = doc.category as Rel
  const authors = Array.isArray(doc.authors) ? doc.authors : []
  const tags = Array.isArray(doc.tags) ? doc.tags : []

  const correctionsRaw = Array.isArray(doc.corrections) ? doc.corrections : []
  const corrections = correctionsRaw
    .map((c) => {
      if (!c || typeof c !== 'object') return null
      const row = c as Record<string, unknown>
      const at = asIso(row.at)
      if (!at || typeof row.noteNe !== 'string') return null
      return {
        at,
        noteNe: row.noteNe,
        noteEn: typeof row.noteEn === 'string' ? row.noteEn : undefined,
      }
    })
    .filter((c): c is NonNullable<typeof c> => Boolean(c))

  return {
    id: String(doc.id),
    slug: String(doc.slug ?? ''),
    status: (doc.status as Article['status']) ?? 'draft',
    englishStatus: (doc.englishStatus as Article['englishStatus']) ?? 'none',
    titleNe: String(doc.titleNe ?? ''),
    titleEn: typeof doc.titleEn === 'string' ? doc.titleEn : undefined,
    deckNe: String(doc.deckNe ?? ''),
    deckEn: typeof doc.deckEn === 'string' ? doc.deckEn : undefined,
    bodyNe: mapBlocks(doc.bodyNe),
    bodyEn: Array.isArray(doc.bodyEn) ? mapBlocks(doc.bodyEn) : undefined,
    categoryId: idOf(category),
    authorIds: authors.map((a) => idOf(a as Rel)).filter(Boolean),
    tagSlugs: tags.map((t) => slugOf(t as Rel)).filter(Boolean),
    province: typeof doc.province === 'string' ? doc.province : undefined,
    hero: mapMedia(doc.hero),
    isBreaking: Boolean(doc.isBreaking),
    editorialPriority: typeof doc.editorialPriority === 'number' ? doc.editorialPriority : 0,
    attribution: 'original',
    seoTitleNe: typeof doc.seoTitleNe === 'string' ? doc.seoTitleNe : undefined,
    seoTitleEn: typeof doc.seoTitleEn === 'string' ? doc.seoTitleEn : undefined,
    seoDescriptionNe: typeof doc.seoDescriptionNe === 'string' ? doc.seoDescriptionNe : undefined,
    seoDescriptionEn: typeof doc.seoDescriptionEn === 'string' ? doc.seoDescriptionEn : undefined,
    corrections,
    publishedAt: asIso(doc.publishedAt),
    updatedAt: asIso(doc.updatedAt),
    packageId: typeof doc.packageId === 'string' ? doc.packageId : undefined,
  }
}

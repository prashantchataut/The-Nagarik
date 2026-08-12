import { romanToDevanagari } from '@thenagarik/algorithms'
import { getPayload } from 'payload'
import config from '@payload-config'
import { payloadDeskAvailable } from '@/lib/admin/payload-desk'
import type { AppLocale } from '@/lib/i18n'

/**
 * Database-side article search.
 *
 * Replaces the O(all-articles) in-memory index for Payload-backed sites:
 * ILIKE across titles/decks/slug with published-only filters, bounded result
 * set, and no body hydration. The in-memory index remains the facade/dev
 * fallback. (Upgrade path: tsvector + GIN once query volume demands it -
 * tracked in docs/COMPLETION_AUDIT.md.)
 */

export type SearchHit = {
  id: string
  slug: string
  title: string
  deck: string
  categorySlug: string
  categoryLabel: string
  authorName: string
  publishedAt: string | null
  heroUrl: string | null
  heroAlt: string
}

export function dbSearchAvailable(): boolean {
  return payloadDeskAvailable()
}

export async function searchArticlesDb(
  query: string,
  locale: AppLocale,
  opts?: { categorySlug?: string; limit?: number },
): Promise<SearchHit[]> {
  const q = query.trim().slice(0, 120)
  if (!q) return []
  const payload = await getPayload({ config })

  const clauses: unknown[] = [
    { titleNe: { like: q } },
    { titleEn: { like: q } },
    { deckNe: { like: q } },
    { deckEn: { like: q } },
    { slug: { like: q } },
  ]

  // ALGO search.transliterate - Roman queries also match Devanagari text:
  // "nagarik" finds नागरिक. Candidates are bounded (4 per token, 2 tokens).
  for (const token of q.split(/\s+/).filter((t) => /^[a-zA-Z]{3,}$/.test(t)).slice(0, 2)) {
    for (const candidate of romanToDevanagari(token).slice(0, 8)) {
      clauses.push({ titleNe: { like: candidate } })
      clauses.push({ deckNe: { like: candidate } })
    }
  }

  const textMatch = { or: clauses }

  const filters: unknown[] = [
    { status: { equals: 'published' } },
    { _status: { equals: 'published' } },
    textMatch,
  ]
  if (locale === 'en') filters.push({ englishStatus: { equals: 'published' } })
  if (opts?.categorySlug) {
    filters.push({ 'category.slug': { equals: opts.categorySlug } })
  }

  const result = await payload.find({
    collection: 'articles',
    where: { and: filters } as never,
    limit: opts?.limit ?? 40,
    depth: 1,
    sort: '-publishedAt',
    overrideAccess: true,
  })

  return result.docs.map((doc) => {
    const d = doc as {
      id: string | number
      slug?: unknown
      titleNe?: unknown
      titleEn?: unknown
      deckNe?: unknown
      deckEn?: unknown
      publishedAt?: unknown
      category?: { slug?: unknown; nameNe?: unknown; nameEn?: unknown } | null
      authors?: Array<{ nameNe?: unknown; nameEn?: unknown }> | null
      hero?: { url?: unknown; alt?: unknown } | string | number | null
    }
    const category = d.category && typeof d.category === 'object' ? d.category : null
    const author = Array.isArray(d.authors) && typeof d.authors[0] === 'object' ? d.authors[0] : null
    const hero = d.hero && typeof d.hero === 'object' ? d.hero : null
    const title =
      locale === 'en' && typeof d.titleEn === 'string' && d.titleEn
        ? d.titleEn
        : String(d.titleNe ?? '')
    const deck =
      locale === 'en' && typeof d.deckEn === 'string' && d.deckEn
        ? d.deckEn
        : String(d.deckNe ?? '')
    return {
      id: String(d.id),
      slug: String(d.slug ?? ''),
      title,
      deck,
      categorySlug: category ? String(category.slug ?? '') : '',
      categoryLabel: category
        ? locale === 'en'
          ? String(category.nameEn ?? category.nameNe ?? '')
          : String(category.nameNe ?? '')
        : '',
      authorName: author
        ? locale === 'en' && typeof author.nameEn === 'string' && author.nameEn
          ? author.nameEn
          : String(author.nameNe ?? '')
        : '',
      publishedAt: typeof d.publishedAt === 'string' ? d.publishedAt : null,
      heroUrl: hero && typeof hero.url === 'string' ? hero.url : null,
      heroAlt: hero ? String(hero.alt ?? '') : '',
    }
  })
}

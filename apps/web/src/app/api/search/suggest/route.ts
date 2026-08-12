import { NextResponse } from 'next/server'
import {
  PrefixTrie,
  fuzzyTermMatches,
  romanToDevanagari,
  tokenizeText,
} from '@thenagarik/algorithms'
import { apiOk } from '@/lib/api/http'
import { getContent } from '@/lib/content'
import { isLocale, type AppLocale } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

/**
 * Search suggestions: prefix trie over category names, tags-in-titles, and
 * title terms; Roman input also completes through Devanagari transliteration
 * (search.transliterate) and falls back to typo-tolerant matching
 * (search.levenshtein) when the prefix finds nothing.
 */

type SuggestIndex = {
  trie: PrefixTrie
  terms: Array<{ term: string; frequency: number }>
  builtAt: number
  locale: AppLocale
}

let cache: SuggestIndex | null = null
const CACHE_TTL_MS = 5 * 60_000

async function buildIndex(locale: AppLocale): Promise<SuggestIndex> {
  const content = getContent()
  const [articles, categories] = await Promise.all([
    content.listPublishedArticles({ locale }),
    content.listCategories(),
  ])

  const frequency = new Map<string, number>()
  const bump = (term: string, weight: number) => {
    frequency.set(term, (frequency.get(term) ?? 0) + weight)
  }

  for (const category of categories) {
    bump(locale === 'en' ? category.nameEn : category.nameNe, 20)
  }
  for (const article of articles) {
    const title = locale === 'en' && article.titleEn ? article.titleEn : article.titleNe
    for (const token of tokenizeText(title)) {
      if (token.length >= 3) bump(token, 2)
    }
  }

  const trie = new PrefixTrie()
  const terms: Array<{ term: string; frequency: number }> = []
  for (const [term, freq] of frequency) {
    trie.insert(term, freq)
    terms.push({ term: term.toLowerCase(), frequency: freq })
  }
  return { trie, terms, builtAt: Date.now(), locale }
}

async function getIndex(locale: AppLocale): Promise<SuggestIndex> {
  if (cache && cache.locale === locale && Date.now() - cache.builtAt < CACHE_TTL_MS) {
    return cache
  }
  cache = await buildIndex(locale)
  return cache
}

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url)
  const q = (url.searchParams.get('q') ?? '').trim().slice(0, 60)
  const rawLocale = url.searchParams.get('locale') ?? 'ne'
  const locale: AppLocale = isLocale(rawLocale) ? rawLocale : 'ne'
  if (q.length < 2) return apiOk({ suggestions: [] })

  const index = await getIndex(locale)
  const seen = new Set<string>()
  const suggestions: string[] = []
  const push = (term: string) => {
    const key = term.toLowerCase()
    if (seen.has(key) || suggestions.length >= 8) return
    seen.add(key)
    suggestions.push(term)
  }

  // 1. Direct prefix completions (search.trie_autocomplete).
  for (const completion of index.trie.complete(q, 8)) push(completion.term)

  // 2. Roman input: transliterate and complete in Devanagari.
  if (/^[a-zA-Z ]+$/.test(q)) {
    const lastToken = q.split(/\s+/).pop() ?? q
    for (const candidate of romanToDevanagari(lastToken).slice(0, 12)) {
      for (const completion of index.trie.complete(candidate, 3)) push(completion.term)
    }
  }

  // 3. Typo tolerance when the prefix found nothing (search.levenshtein).
  if (suggestions.length === 0) {
    for (const match of fuzzyTermMatches(q, index.terms, 5)) push(match.term)
  }

  return apiOk(
    { suggestions },
    { cacheControl: 'public, max-age=60, stale-while-revalidate=300' },
  )
}

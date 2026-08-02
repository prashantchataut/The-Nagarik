import type { Article, EnglishStatus, Locale } from './types'

/** Single shared English visibility gate — never diverge by content source. */
export function isEnglishPublished(englishStatus: EnglishStatus): boolean {
  return englishStatus === 'published'
}

export function articleHasEnglish(article: Pick<Article, 'englishStatus'>): boolean {
  return isEnglishPublished(article.englishStatus)
}

export function localizeTitle(article: Article, locale: Locale): string {
  if (locale === 'en' && articleHasEnglish(article) && article.titleEn) {
    return article.titleEn
  }
  return article.titleNe
}

export function localizeDeck(article: Article, locale: Locale): string {
  if (locale === 'en' && articleHasEnglish(article) && article.deckEn) {
    return article.deckEn
  }
  return article.deckNe
}

export function localizeBody(article: Article, locale: Locale) {
  if (locale === 'en' && articleHasEnglish(article) && article.bodyEn?.length) {
    return article.bodyEn
  }
  return article.bodyNe
}

export function estimateReadTimeMinutes(blocks: { type: string; text?: string; items?: string[] }[], locale: Locale): number {
  const wpm = locale === 'ne' ? 140 : 220
  const text = blocks
    .map((b) => {
      if ('text' in b && typeof b.text === 'string') return b.text
      if ('items' in b && Array.isArray(b.items)) return b.items.join(' ')
      return ''
    })
    .join(' ')
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / wpm))
}

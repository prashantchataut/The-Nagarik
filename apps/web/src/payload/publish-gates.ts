import { isEnglishPublished } from '@thenagarik/content'

/** Shared publish checks for Payload hooks / Local API. */
export function assertPublishable(input: {
  status: string
  englishStatus: string
  authorIds: string[]
  hero?: { alt?: string; credit?: string } | null
  titleEn?: string
  bodyEn?: unknown[]
  categoryId?: string
  titleNe?: string
  deckNe?: string
  publishedAt?: string
}) {
  const errors: string[] = []
  if (input.status === 'published' && (!input.authorIds || input.authorIds.length === 0)) {
    errors.push('Published articles require at least one author')
  }
  if ((input.status === 'published' || input.status === 'scheduled') && !input.categoryId) {
    errors.push('Published/scheduled articles require a category')
  }
  if ((input.status === 'published' || input.status === 'scheduled') && !input.titleNe?.trim()) {
    errors.push('Published/scheduled articles require a Nepali title')
  }
  if ((input.status === 'published' || input.status === 'scheduled') && !input.deckNe?.trim()) {
    errors.push('Published/scheduled articles require a Nepali deck')
  }
  if (input.hero) {
    if (!input.hero.alt?.trim()) errors.push('Hero alt text is required')
    if (!input.hero.credit?.trim()) errors.push('Hero credit is required')
  }
  const wantsEn = Boolean(input.titleEn || (input.bodyEn && input.bodyEn.length))
  if (wantsEn && !isEnglishPublished(input.englishStatus as 'none')) {
    // Allow draft EN fields; public EN requires published status (enforced at read time too)
  }
  if (input.englishStatus === 'published' && !input.titleEn) {
    errors.push('englishStatus=published requires titleEn')
  }
  if (input.status === 'scheduled') {
    if (!input.publishedAt) {
      errors.push('Scheduled articles require publishedAt.')
    } else if (new Date(input.publishedAt).getTime() <= Date.now()) {
      errors.push('Scheduled articles need a future publishedAt time.')
    }
  }
  return errors
}

export function publicEnglishAllowed(englishStatus: string): boolean {
  return isEnglishPublished(englishStatus as 'published')
}

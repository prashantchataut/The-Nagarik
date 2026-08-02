import { isEnglishPublished } from '@thenagarik/content'

/** Shared publish checks for Payload hooks / Local API. */
export function assertPublishable(input: {
  status: string
  englishStatus: string
  authorIds: string[]
  hero?: { alt?: string; credit?: string } | null
  titleEn?: string
  bodyEn?: unknown[]
}) {
  const errors: string[] = []
  if (input.status === 'published' && (!input.authorIds || input.authorIds.length === 0)) {
    errors.push('Published articles require at least one author')
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
  return errors
}

export function publicEnglishAllowed(englishStatus: string): boolean {
  return isEnglishPublished(englishStatus as 'published')
}

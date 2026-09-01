import { SITE } from '@/site.config'
import type { AppLocale } from '@/lib/i18n'

/**
 * Localized display name for a category slug.
 * Single source of truth: site.config editorial categories. Components that
 * only receive a raw `categorySlug` (StoryCard footers, pills, meta rows)
 * resolve the reader-facing name here so Nepali readers never see an
 * untranslated slug like "samachar".
 */
export function categoryName(slug: string, locale: AppLocale): string {
  const category = SITE.editorial.categories.find((c) => c.slug === slug)
  if (category) return locale === 'en' ? category.en : category.ne
  return slug
}

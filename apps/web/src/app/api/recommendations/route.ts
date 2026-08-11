import { NextResponse } from 'next/server'
import { recommendForReader } from '@thenagarik/algorithms'
import { apiOk } from '@/lib/api/http'
import { getContent } from '@/lib/content'
import { isLocale, type AppLocale } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

/**
 * Personalized "up next" feed powering the SPA-style story hopping sheet.
 *
 * Signals (all optional, all anonymous-friendly):
 * - storyId: current story (excluded, its category boosts the session signal)
 * - interests: comma-separated category slugs (reader account or device profile)
 * - recent: comma-separated recently read story ids (device history)
 * - locale: ne | en
 */
export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url)
  const rawLocale = url.searchParams.get('locale') ?? 'ne'
  const locale: AppLocale = isLocale(rawLocale) ? rawLocale : 'ne'
  const storyId = url.searchParams.get('storyId')?.trim() || null
  const interestSlugs = (url.searchParams.get('interests') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8)
  const recentStoryIds = (url.searchParams.get('recent') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12)

  try {
    const content = getContent()
    const [articles, categories] = await Promise.all([
      content.listPublishedArticles({ locale }),
      content.listCategories(),
    ])

    const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c.id]))
    const interestCategoryIds = interestSlugs
      .map((slug) => categoryIdBySlug.get(slug))
      .filter((id): id is string => Boolean(id))

    // The story being read counts as the freshest session signal.
    const current = storyId ? articles.find((a) => a.id === storyId) : undefined
    const recentCategoryIds = current
      ? [current.categoryId, ...interestCategoryIds]
      : interestCategoryIds

    const excluded = new Set(recentStoryIds)
    if (storyId) excluded.add(storyId)

    const result = recommendForReader(
      articles.map((a) => ({
        id: a.id,
        categoryId: a.categoryId,
        authorIds: a.authorIds,
        publishedAt: a.publishedAt,
        isBreaking: a.isBreaking,
      })),
      {
        readerId: 'anon',
        recentCategoryIds,
        recentStoryIds: [...excluded],
      },
      { limit: 6 },
    )

    const byId = new Map(articles.map((a) => [a.id, a]))
    const cards = (
      await Promise.all(
        result.items.map(async (item) => {
          const article = byId.get(item.id)
          if (!article) return null
          return content.toStoryCard(article, locale)
        }),
      )
    ).filter(Boolean)

    return apiOk(
      { stories: cards, strategy: result.strategy },
      { cacheControl: 'private, max-age=30' },
    )
  } catch {
    return apiOk({ stories: [], strategy: 'unavailable' })
  }
}

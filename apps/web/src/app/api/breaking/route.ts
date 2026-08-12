import { NextResponse } from 'next/server'
import { apiOk } from '@/lib/api/http'
import { getContent } from '@/lib/content'
import { isLocale, type AppLocale } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

/**
 * Live breaking/top stories feed for the pulsing ticker.
 * Polled by the client so new `isBreaking` articles appear without reload.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url)
  const rawLocale = url.searchParams.get('locale') ?? 'ne'
  const locale: AppLocale = isLocale(rawLocale) ? rawLocale : 'ne'

  try {
    const content = getContent()
    const articles = await content.listPublishedArticles({ locale })
    const breaking = articles.filter((a) => a.isBreaking)
    const pool = breaking.length ? breaking : articles
    const cards = await Promise.all(
      pool.slice(0, 5).map((article) => content.toStoryCard(article, locale)),
    )
    return apiOk(
      { hasBreaking: breaking.length > 0, stories: cards },
      { cacheControl: 'public, max-age=30, stale-while-revalidate=60' },
    )
  } catch {
    // Ticker is progressive enhancement: degrade to an empty, OK response.
    return apiOk({ hasBreaking: false, stories: [] })
  }
}

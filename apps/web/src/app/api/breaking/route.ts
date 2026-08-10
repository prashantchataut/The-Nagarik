import { NextResponse } from 'next/server'
import { getContent } from '@/lib/content'
import { isLocale, type AppLocale } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

/**
 * Live breaking/top stories feed for the pulsing ticker.
 * Polled by the client so new `isBreaking` articles appear without reload.
 */
export async function GET(request: Request) {
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
    return NextResponse.json(
      { ok: true, hasBreaking: breaking.length > 0, stories: cards },
      { headers: { 'cache-control': 'public, max-age=30, stale-while-revalidate=60' } },
    )
  } catch {
    return NextResponse.json({ ok: false, hasBreaking: false, stories: [] }, { status: 200 })
  }
}

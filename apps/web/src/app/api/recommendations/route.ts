import { recommendForReader } from '@thenagarik/algorithms'
import { NextResponse } from 'next/server'
import { getContent } from '@/lib/content'

export async function GET(request: Request) {
  const content = getContent()
  const articles = await content.listPublishedArticles()
  const url = new URL(request.url)
  const readerId = url.searchParams.get('readerId') ?? 'anon'

  const result = recommendForReader(
    articles.map((a) => ({
      id: a.id,
      categoryId: a.categoryId,
      authorIds: a.authorIds,
      publishedAt: a.publishedAt,
      isBreaking: a.isBreaking,
    })),
    { readerId, recentCategoryIds: [], recentStoryIds: [] },
    { limit: 8 },
  )

  return NextResponse.json(result)
}

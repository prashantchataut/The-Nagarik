import {
  HomeCategoryBand,
  HomeCover,
  HomeDesk,
  HomeOpinion,
  HomeSignals,
  HomeVisual,
} from '@/components/HomeFront'
import { ContinueReadingRail } from '@/components/ContinueReading'
import { getContent } from '@/lib/content'
import { getEngagementSnapshot } from '@/lib/engagement'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'
import { detectTrending, mostRead } from '@thenagarik/algorithms'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 60

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)
  const content = getContent()
  const categories = await content.listCategories()
  const articles = await content.listPublishedArticles({ locale })
  const cards = await Promise.all(articles.map((a) => content.toStoryCard(a, locale)))
  const feed = cards.slice(0, 5)
  const updatePool = cards.slice(0, 5)

  const snap = await getEngagementSnapshot()
  const trending = detectTrending(
    articles.map((a) => ({ id: a.id, publishedAt: a.publishedAt })),
    snap.trendingSamples,
    { limit: 5 },
  )
  const read = mostRead(
    articles.map((a) => ({ id: a.id, publishedAt: a.publishedAt })),
    snap.dwellStats,
    { limit: 5 },
  )

  const byId = new Map(cards.map((c) => [c.id, c]))
  const trendingCards = trending.items.map((i) => byId.get(i.id)).filter(Boolean) as typeof cards
  const mostReadCards = read.items.map((i) => byId.get(i.id)).filter(Boolean) as typeof cards

  const used = new Set<string>(feed.map((s) => s.id))
  const pickUnique = (pool: typeof cards, count: number) => {
    const out: typeof cards = []
    for (const item of pool) {
      if (used.has(item.id)) continue
      out.push(item)
      used.add(item.id)
      if (out.length >= count) break
    }
    return out
  }

  const editorsPool = cards.filter((c) => {
    const raw = articles.find((a) => a.id === c.id)
    return (raw?.editorialPriority ?? 0) >= 7
  })
  const editors = pickUnique(editorsPool.length ? editorsPool : cards, 4)
  const province = pickUnique(
    cards.filter((c) => c.province || c.categorySlug === 'pradesh'),
    6,
  )
  const opinion = pickUnique(cards.filter((c) => c.categorySlug === 'bichar'), 3)
  const visual = pickUnique(cards.filter((c) => c.hero), 4)
  const sectionCats = categories.filter((c) => c.slug !== 'bichar').slice(0, 4)
  const sectionData = sectionCats.map((cat) => ({
    cat,
    stories: pickUnique(cards.filter((c) => c.categorySlug === cat.slug), 6),
  }))
  const categoryLabel = (slug: string) => {
    const cat = categories.find((c) => c.slug === slug)
    if (!cat) return slug
    return locale === 'en' ? cat.nameEn : cat.nameNe
  }

  return (
    <>
      {feed.length ? (
        <HomeCover
          locale={locale}
          dict={dict}
          feed={feed}
          updates={updatePool}
          categoryLabel={categoryLabel}
        />
      ) : (
        <div className="mx-auto max-w-[1240px] px-4 py-16 md:px-6">
          <h1 className="text-2xl font-semibold">{dict.empty}</h1>
          <p className="mt-3 max-w-[54ch] text-sm text-stone">
            {locale === 'ne'
              ? 'Payload मा प्रकाशित लेख छैन। /cms बाट लेख प्रकाशन गर्नुहोस् वा seed चलाउनुहोस्।'
              : 'No published articles in Payload yet. Publish from /cms or run the seed script.'}
          </p>
          <p className="mt-4 text-sm">
            <Link href="/admin" className="font-semibold text-accent hover:underline">
              /admin
            </Link>
            {' · '}
            <Link href="/cms" className="font-semibold text-accent hover:underline">
              /cms
            </Link>
          </p>
        </div>
      )}
      {feed.length ? (
        <>
          <HomeSignals
            locale={locale}
            dict={dict}
            trending={trendingCards}
            mostRead={mostReadCards}
            trendingLive={trending.live}
            mostReadLive={read.live}
          />
          <ContinueReadingRail locale={locale} dict={dict} stories={cards} />
          <HomeDesk locale={locale} dict={dict} editors={editors} province={province} />
          {sectionData.map(({ cat, stories }) =>
            stories.length ? (
              <HomeCategoryBand
                key={cat.id}
                locale={locale}
                dict={dict}
                category={cat}
                stories={stories}
              />
            ) : null,
          )}
          <HomeOpinion locale={locale} dict={dict} stories={opinion} />
          <HomeVisual locale={locale} dict={dict} stories={visual} />
        </>
      ) : null}
    </>
  )
}

import {
  CategorySection,
  DualSignalRail,
  LeadAndRail,
  OpinionStack,
  UpdateStrip,
} from '@/components/Story'
import { ContinueReadingRail } from '@/components/ContinueReading'
import { getContent } from '@/lib/content'
import { getEngagementSnapshot } from '@/lib/engagement'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'
import { detectTrending, mostRead } from '@thenagarik/algorithms'
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
  const lead = cards[0]
  const side = cards.slice(1, 7)
  const updatePool = cards.slice(0, 6)

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

  const opinion = cards.filter((c) => c.categorySlug === 'bichar').slice(0, 3)
  const sectionCats = categories.filter((c) => c.slug !== 'bichar').slice(0, 4)

  return (
    <>
      <UpdateStrip locale={locale} dict={dict} stories={updatePool} />
      {lead ? (
        <LeadAndRail locale={locale} dict={dict} lead={lead} side={side} />
      ) : (
        <p className="px-4 py-16">{dict.empty}</p>
      )}
      <ContinueReadingRail locale={locale} dict={dict} stories={cards} />
      <DualSignalRail
        locale={locale}
        dict={dict}
        trending={trendingCards}
        mostRead={mostReadCards}
        trendingLive={trending.live}
        mostReadLive={read.live}
      />
      {sectionCats.map((cat) => {
        const stories = cards.filter((c) => c.categorySlug === cat.slug).slice(0, 6)
        return (
          <CategorySection
            key={cat.id}
            locale={locale}
            dict={dict}
            category={cat}
            stories={stories}
          />
        )
      })}
      <OpinionStack locale={locale} dict={dict} stories={opinion} />
    </>
  )
}

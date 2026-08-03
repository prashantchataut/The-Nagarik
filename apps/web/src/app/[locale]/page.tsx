import {
  DualSignalRail,
  LatestList,
  LeadHero,
  OpinionStack,
  ProvinceFeature,
  VisualStrip,
} from '@/components/Story'
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
  const articles = await content.listPublishedArticles({ locale })
  const cards = await Promise.all(articles.map((a) => content.toStoryCard(a, locale)))
  const lead = cards[0]
  const rest = cards.slice(1)

  const snap = await getEngagementSnapshot()
  const trending = detectTrending(
    articles.map((a) => ({ id: a.id, publishedAt: a.publishedAt })),
    snap.trendingSamples,
    { limit: 4 },
  )
  const read = mostRead(
    articles.map((a) => ({ id: a.id, publishedAt: a.publishedAt })),
    snap.dwellStats,
    { limit: 4 },
  )

  const byId = new Map(cards.map((c) => [c.id, c]))
  const trendingCards = trending.items.map((i) => byId.get(i.id)).filter(Boolean) as typeof cards
  const mostReadCards = read.items.map((i) => byId.get(i.id)).filter(Boolean) as typeof cards

  const opinion = cards.filter((c) => c.categorySlug === 'bichar').slice(0, 3)
  const province = cards.find((c) => c.categorySlug === 'pradesh')
  const visual = cards.filter((c) => c.hero).slice(0, 3)

  return (
    <>
      {lead ? <LeadHero locale={locale} story={lead} dict={dict} /> : <p className="px-4 py-24">{dict.empty}</p>}
      <LatestList locale={locale} stories={rest.slice(0, 5)} dict={dict} />
      <DualSignalRail
        locale={locale}
        dict={dict}
        trending={trendingCards}
        mostRead={mostReadCards}
        trendingLive={trending.live}
        mostReadLive={read.live}
      />
      <ProvinceFeature locale={locale} dict={dict} story={province} />
      <OpinionStack locale={locale} dict={dict} stories={opinion} />
      <VisualStrip locale={locale} dict={dict} stories={visual} />
    </>
  )
}

import { detectTrending, mostRead } from '@thenagarik/algorithms'
import { StoryLink, StoryRail } from '@/components/Story'
import { getContent } from '@/lib/content'
import { getEngagementSnapshot } from '@/lib/engagement'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'
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
  const trendingCards = trending.items.map((i) => byId.get(i.id)).filter(Boolean)
  const mostReadCards = read.items.map((i) => byId.get(i.id)).filter(Boolean)

  const opinion = cards.filter((c) => c.categorySlug === 'bichar').slice(0, 3)
  const province = cards.filter((c) => c.categorySlug === 'pradesh').slice(0, 3)
  const visual = cards.filter((c) => c.hero).slice(0, 3)

  return (
    <>
      <section className="min-h-[100dvh] border-b border-line">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <p className="pt-6 text-sm text-stone md:pt-8">{dict.tagline}</p>
          {lead ? <StoryLink locale={locale} story={lead} featured priority /> : <p className="py-24">{dict.empty}</p>}
        </div>
      </section>

      <StoryRail title={dict.latest} locale={locale} stories={rest.slice(0, 5)} />
      <StoryRail
        title={dict.trending}
        locale={locale}
        stories={trendingCards as typeof cards}
        note={trending.live ? undefined : dict.coldStart}
      />
      <StoryRail
        title={dict.mostRead}
        locale={locale}
        stories={mostReadCards as typeof cards}
        note={read.live ? undefined : dict.coldStart}
      />
      <StoryRail title={locale === 'ne' ? 'प्रदेश' : 'Provinces'} locale={locale} stories={province} />
      <StoryRail title={locale === 'ne' ? 'विचार' : 'Opinion'} locale={locale} stories={opinion} />
      <StoryRail title={locale === 'ne' ? 'दृश्य' : 'Visual'} locale={locale} stories={visual} />
    </>
  )
}

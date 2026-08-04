import {
  CategorySection,
  DualSignalRail,
  EditorsPicks,
  LeadAndRail,
  ProvinceRail,
  OpinionStack,
  UpdateStrip,
  VisualStrip,
} from '@/components/Story'
import { ContinueReadingRail } from '@/components/ContinueReading'
import { PatroTodayStrip } from '@/components/PatroTodayStrip'
import { Reveal } from '@/components/Reveal'
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
  const side = cards.slice(1, 9)
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

  const used = new Set<string>([...(lead ? [lead.id] : []), ...side.map((s) => s.id)])
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
  const editors = pickUnique(editorsPool, 3)
  const province = pickUnique(cards.filter((c) => c.province || c.categorySlug === 'pradesh'), 5)
  const opinion = pickUnique(cards.filter((c) => c.categorySlug === 'bichar'), 3)
  const visual = pickUnique(cards.filter((c) => c.hero), 3)
  const sectionCats = categories.filter((c) => c.slug !== 'bichar').slice(0, 4)
  const sectionData = sectionCats.map((cat, index) => ({
    cat,
    stories: pickUnique(cards.filter((c) => c.categorySlug === cat.slug), 6),
    variant: (index % 2 === 0 ? 'feature' : 'dense') as 'feature' | 'dense',
  }))

  return (
    <>
      <UpdateStrip locale={locale} dict={dict} stories={updatePool} />
      <PatroTodayStrip locale={locale} dict={dict} />
      {lead ? (
        <LeadAndRail locale={locale} dict={dict} lead={lead} side={side} />
      ) : (
        <p className="px-4 py-16">{dict.empty}</p>
      )}
      <DualSignalRail
        locale={locale}
        dict={dict}
        trending={trendingCards}
        mostRead={mostReadCards}
        trendingLive={trending.live}
        mostReadLive={read.live}
      />
      <ContinueReadingRail locale={locale} dict={dict} stories={cards} />
      <div className="border-b border-line">
        <div className="mx-auto grid max-w-[1400px] gap-0 lg:grid-cols-2">
          <div className="lg:border-r lg:border-line">
            <EditorsPicks locale={locale} dict={dict} stories={editors} />
          </div>
          <ProvinceRail locale={locale} dict={dict} stories={province} />
        </div>
      </div>
      {sectionData.map(({ cat, stories, variant }) => {
        if (!stories.length) return null
        return (
          <CategorySection
            key={cat.id}
            locale={locale}
            dict={dict}
            category={cat}
            stories={stories}
            variant={variant}
          />
        )
      })}
      <Reveal>
        <OpinionStack locale={locale} dict={dict} stories={opinion} />
      </Reveal>
      <VisualStrip locale={locale} dict={dict} stories={visual} />
    </>
  )
}

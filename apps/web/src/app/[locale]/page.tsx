import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  HomeBreakingStrip,
  HomeCategoryBand,
  HomeHero,
  HomeOpinion,
  HomeSecondaryStories,
  HomeVisual,
} from '@/components/HomeFront'
import { HomeProvinceTabs } from '@/components/home/HomeProvinceTabs'
import type { StoryCard } from '@thenagarik/content'
import { getContent } from '@/lib/content'
import { getEngagementSnapshot } from '@/lib/engagement'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'
import { detectTrending, mostRead } from '@thenagarik/algorithms'
import { provinceLabel } from '@/lib/provinces'

export const revalidate = 60

const PROVINCE_ORDER = ['koshi', 'madhesh', 'bagmati', 'gandaki', 'lumbini', 'karnali', 'sudurpashchim']

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
  const trendingCards = trending.items.map((i) => byId.get(i.id)).filter(Boolean) as StoryCard[]
  const mostReadCards = read.items.map((i) => byId.get(i.id)).filter(Boolean) as StoryCard[]

  const used = new Set<string>(feed.map((s) => s.id))
  const pickUnique = (pool: StoryCard[], count: number) => {
    const out: StoryCard[] = []
    for (const item of pool) {
      if (used.has(item.id)) continue
      out.push(item)
      used.add(item.id)
      if (out.length >= count) break
    }
    return out
  }

  const categoryLabel = (slug: string) => {
    const cat = categories.find((c) => c.slug === slug)
    if (!cat) return slug
    return locale === 'en' ? cat.nameEn : cat.nameNe
  }

  const secondary = pickUnique(cards, 3)
  const provincePool = cards.filter((c) => c.province || c.categorySlug === 'pradesh')
  const provinceGroups = PROVINCE_ORDER.map((slug) => ({
    id: slug,
    label: provinceLabel(slug, locale) ?? slug,
    stories: pickUnique(
      provincePool.filter((c) => c.province === slug || c.categorySlug === slug),
      6,
    ),
  })).filter((g) => g.stories.length > 0)
  const opinion = pickUnique(cards.filter((c) => c.categorySlug === 'bichar'), 3)
  const visual = pickUnique(cards.filter((c) => c.hero), 4)
  const sectionCats = categories.filter((c) => c.slug !== 'bichar' && c.slug !== 'pradesh').slice(0, 4)
  const sectionData = sectionCats.map((cat) => ({
    cat,
    stories: pickUnique(cards.filter((c) => c.categorySlug === cat.slug), 6),
  }))

  return (
    <>
      {feed.length ? (
        <>
          <HomeBreakingStrip locale={locale} dict={dict} stories={feed} />
          <HomeHero
            locale={locale}
            dict={dict}
            lead={feed[0]}
            latest={updatePool}
            popular={mostReadCards}
            popularLive={read.live}
            categoryLabel={categoryLabel}
          />
          <HomeSecondaryStories locale={locale} stories={secondary} categoryLabel={categoryLabel} />
          <HomeProvinceTabs locale={locale} title={dict.provinces} seeAll={dict.seeAll} groups={provinceGroups} />
          {sectionData.map(({ cat, stories }) =>
            stories.length ? (
              <HomeCategoryBand key={cat.id} locale={locale} dict={dict} category={cat} stories={stories} />
            ) : null,
          )}
          <HomeOpinion locale={locale} dict={dict} stories={opinion} />
          <HomeVisual locale={locale} dict={dict} stories={visual} />
        </>
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
    </>
  )
}
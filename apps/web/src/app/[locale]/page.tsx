import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { StoryCard } from '@thenagarik/content'
import { getContent } from '@/lib/content'
import { getEngagementSnapshot } from '@/lib/engagement'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'
import { detectTrending, mostRead } from '@thenagarik/algorithms'
import { provinceLabel } from '@/lib/provinces'

import { UtilityStrip } from '@/components/home/UtilityStrip'
import { BreakingStrip } from '@/components/home/BreakingStrip'
import { HeroLead } from '@/components/home/HeroLead'
import { TrendingSection } from '@/components/home/TrendingSection'
import { LatestSection } from '@/components/home/LatestSection'
import { HomeProvinceTabs } from '@/components/home/HomeProvinceTabs'
import { HomeCategoryBand } from '@/components/news/HomeCategoryBand'
import { HomeOpinion, HomeVisual } from '@/components/HomeFront'
import { ContinueReadingRail } from '@/components/ContinueReading'

export const revalidate = 60

const PROVINCE_ORDER = [
  'koshi',
  'madhesh',
  'bagmati',
  'gandaki',
  'lumbini',
  'karnali',
  'sudurpashchim',
]

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)
  const content = getContent()
  const categories = await content.listCategories()
  const articles = await content.listPublishedArticles({ locale })
  const cards = await Promise.all(articles.map((a) => content.toStoryCard(a, locale)))

  const snap = await getEngagementSnapshot()
  const trending = detectTrending(
    articles.map((a) => ({ id: a.id, publishedAt: a.publishedAt })),
    snap.trendingSamples,
    { limit: 8 },
  )
  const read = mostRead(
    articles.map((a) => ({ id: a.id, publishedAt: a.publishedAt })),
    snap.dwellStats,
    { limit: 8 },
  )

  const byId = new Map(cards.map((c) => [c.id, c]))
  const trendingCards = trending.items.map((i) => byId.get(i.id)).filter(Boolean) as StoryCard[]
  const mostReadCards = read.items.map((i) => byId.get(i.id)).filter(Boolean) as StoryCard[]

  const used = new Set<string>()
  const pickUnique = (pool: StoryCard[], count: number): StoryCard[] => {
    const out: StoryCard[] = []
    for (const item of pool) {
      if (used.has(item.id)) continue
      out.push(item)
      used.add(item.id)
      if (out.length >= count) break
    }
    return out
  }

  // 1. Lead & Breaking stories
  const lead = cards[0]
  if (lead) used.add(lead.id)

  const breakingPool = cards.filter((c) => c.isBreaking)
  const breakingStories = breakingPool.length ? breakingPool : cards.slice(0, 5)

  // 2. Side updates next to hero
  const sideUpdates = pickUnique(cards, 4)

  // 3. Trending pool
  const trendingPool = trendingCards.length >= 3 ? trendingCards : cards.slice(0, 5)

  // 4. Latest pool
  const latestPool = pickUnique(cards, 4)

  // 5. Province groups
  const provincePool = cards.filter((c) => c.province || c.categorySlug === 'pradesh')
  const provinceGroups = PROVINCE_ORDER.map((slug) => ({
    id: slug,
    label: provinceLabel(slug, locale) ?? slug,
    stories: provincePool.filter((c) => c.province === slug || c.categorySlug === slug).slice(0, 6),
  })).filter((g) => g.stories.length > 0)

  // 6. Specific categories
  const opinion = cards.filter((c) => c.categorySlug === 'bichar').slice(0, 3)
  const visual = cards.filter((c) => c.hero).slice(0, 4)

  const samacharCat = categories.find((c) => c.slug === 'samachar')
  const rajnitiCat = categories.find((c) => c.slug === 'rajniti')
  const arthCat = categories.find((c) => c.slug === 'arth')
  const khelCat = categories.find((c) => c.slug === 'khel')
  const bishwaCat = categories.find((c) => c.slug === 'bishwa')

  const samacharStories = cards.filter((c) => c.categorySlug === 'samachar').slice(0, 5)
  const rajnitiStories = cards.filter((c) => c.categorySlug === 'rajniti').slice(0, 5)
  const arthStories = cards.filter((c) => c.categorySlug === 'arth').slice(0, 5)
  const khelStories = cards.filter((c) => c.categorySlug === 'khel').slice(0, 4)
  const bishwaStories = cards.filter((c) => c.categorySlug === 'bishwa').slice(0, 4)

  const leadCategory = categories.find((c) => c.slug === lead?.categorySlug)
  const leadCatName = leadCategory
    ? locale === 'en'
      ? leadCategory.nameEn
      : leadCategory.nameNe
    : undefined

  return (
    <>
      {cards.length ? (
        <>
          <BreakingStrip locale={locale} dict={dict} stories={breakingStories} />

          {lead ? (
            <HeroLead
              locale={locale}
              dict={dict}
              lead={lead}
              sideUpdates={sideUpdates}
              categoryName={leadCatName}
            />
          ) : null}

          <TrendingSection
            locale={locale}
            dict={dict}
            stories={trendingPool}
            title={dict.trending}
          />

          {latestPool.length ? (
            <LatestSection
              locale={locale}
              dict={dict}
              stories={latestPool}
              title={dict.latestUpdates}
              variant="cards"
            />
          ) : null}

          {provinceGroups.length ? (
            <HomeProvinceTabs
              locale={locale}
              title={dict.provinces}
              seeAll={dict.seeAll}
              groups={provinceGroups}
              dict={dict}
            />
          ) : null}

          {rajnitiCat && rajnitiStories.length ? (
            <HomeCategoryBand
              locale={locale}
              dict={dict}
              category={rajnitiCat}
              stories={rajnitiStories}
              variant="feature-grid"
            />
          ) : null}

          {arthCat && arthStories.length ? (
            <HomeCategoryBand
              locale={locale}
              dict={dict}
              category={arthCat}
              stories={arthStories}
              variant="dense"
            />
          ) : null}

          {samacharCat && samacharStories.length ? (
            <HomeCategoryBand
              locale={locale}
              dict={dict}
              category={samacharCat}
              stories={samacharStories}
              variant="card-grid"
            />
          ) : null}

          {khelCat && khelStories.length ? (
            <HomeCategoryBand
              locale={locale}
              dict={dict}
              category={khelCat}
              stories={khelStories}
              variant="image-strip"
            />
          ) : null}

          {bishwaCat && bishwaStories.length ? (
            <HomeCategoryBand
              locale={locale}
              dict={dict}
              category={bishwaCat}
              stories={bishwaStories}
              variant="card-grid"
            />
          ) : null}

          {opinion.length ? (
            <HomeOpinion locale={locale} dict={dict} stories={opinion} />
          ) : null}

          <ContinueReadingRail locale={locale} dict={dict} stories={cards} />

          {visual.length ? (
            <HomeVisual locale={locale} dict={dict} stories={visual} />
          ) : null}
        </>
      ) : (
        <div className="mx-auto max-w-[1240px] px-4 py-16 text-center md:px-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-muted text-2xl font-black text-accent">
            {locale === 'ne' ? 'ना' : 'N'}
          </div>
          <h1 className="mt-4 text-2xl font-black text-ink">{dict.empty}</h1>
          <p className="mt-2 text-sm text-stone">
            {locale === 'ne'
              ? 'Payload मा प्रकाशित लेख छैन। /cms बाट लेख प्रकाशन गर्नुहोस्।'
              : 'No published articles in Payload yet. Publish from /cms.'}
          </p>
          <div className="mt-6 flex justify-center gap-3 text-sm">
            <Link
              href="/admin"
              className="rounded-[var(--radius-control)] accent-solid px-4 py-2 font-bold"
            >
              /admin
            </Link>
            <Link
              href="/cms"
              className="rounded-[var(--radius-control)] border border-line px-4 py-2 font-bold text-ink hover:border-accent"
            >
              /cms
            </Link>
          </div>
        </div>
      )}
    </>
  )
}

import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { StoryCard } from '@thenagarik/content'
import { getContent, siteUrl } from '@/lib/content'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'
import { getEngagementSnapshot } from '@/lib/engagement'
import { detectTrending, mostRead } from '@thenagarik/algorithms'
import { RelativeTime } from '@/components/RelativeTime'
import { CategoryIcon } from '@/components/CategoryIcon'
import { TrendingSection } from '@/components/home/TrendingSection'
import { LatestSection } from '@/components/home/LatestSection'

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>
}): Promise<Metadata> {
  const { locale: raw, category } = await params
  if (!isLocale(raw)) return {}
  const locale = raw as AppLocale
  const content = getContent()
  const categoryDoc = await content.getCategoryBySlug(category)
  if (!categoryDoc) return {}

  const title = locale === 'en' ? categoryDoc.nameEn : categoryDoc.nameNe
  const description = locale === 'en' ? categoryDoc.descriptionEn : categoryDoc.descriptionNe

  return {
    title: `${title} | The Nagarik`,
    description,
    alternates: {
      canonical: siteUrl(`/${locale}/${category}`),
      languages: {
        ne: siteUrl(`/ne/${category}`),
        en: siteUrl(`/en/${category}`),
      },
    },
    openGraph: {
      title,
      description,
      type: 'website',
    },
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>
}) {
  const { locale: raw, category: categorySlug } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)
  const content = getContent()

  const categoryDoc = await content.getCategoryBySlug(categorySlug)
  if (!categoryDoc) notFound()

  const allArticles = await content.listPublishedArticles({ locale })
  const catArticles = allArticles.filter((a) => a.categoryId === categoryDoc.id)
  const cards = await Promise.all(catArticles.map((a) => content.toStoryCard(a, locale)))
  const allCards = await Promise.all(allArticles.map((a) => content.toStoryCard(a, locale)))

  const categoryName = locale === 'en' ? categoryDoc.nameEn : categoryDoc.nameNe
  const categoryDesc = locale === 'en' ? categoryDoc.descriptionEn : categoryDoc.descriptionNe

  const [leadStory, secondStory, thirdStory, ...streamStories] = cards

  // Side trending & latest recommendations
  const snap = await getEngagementSnapshot()
  const trending = detectTrending(
    allArticles.map((a) => ({ id: a.id, publishedAt: a.publishedAt })),
    snap.trendingSamples,
    { limit: 5 },
  )
  const byId = new Map(allCards.map((c) => [c.id, c]))
  const trendingCards = trending.items.map((i) => byId.get(i.id)).filter(Boolean) as StoryCard[]
  const otherStories = allCards.filter((c) => c.categorySlug !== categorySlug).slice(0, 4)

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-6 md:px-6 md:py-9">
      {/* Category Masthead */}
      <header className="border-b-2 border-accent pb-5 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-fg">
              <CategoryIcon slug={categorySlug} size={22} weight="bold" />
            </span>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-ink md:text-4xl">
                {categoryName}
              </h1>
              {categoryDesc ? (
                <p className="mt-1 text-sm text-stone max-w-[65ch]">{categoryDesc}</p>
              ) : null}
            </div>
          </div>

          <div className="text-right text-xs font-bold text-stone">
            <span className="rounded-full bg-paper-elevated px-3 py-1.5 border border-line">
              {cards.length} {dict.stories}
            </span>
          </div>
        </div>
      </header>

      {cards.length ? (
        <>
          {/* Main Category Package (Lead 7 cols + 2 secondary 5 cols) */}
          <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
            {/* Lead Story */}
            {leadStory ? (
              <article className="lg:col-span-7 group">
                {leadStory.hero ? (
                  <Link
                    href={`/${locale}/${leadStory.categorySlug}/${leadStory.slug}`}
                    className="editorial-image relative block aspect-[16/9] w-full rounded-[var(--radius-panel)] shadow-[0_4px_16px_rgb(16_32_29_/_0.08)]"
                  >
                    <Image
                      src={leadStory.hero.url}
                      alt={leadStory.hero.alt || leadStory.title}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 720px"
                      className="object-cover"
                    />
                  </Link>
                ) : null}

                <div className="mt-4">
                  <h2 className="text-2xl font-black leading-tight tracking-[-0.025em] text-ink group-hover:text-accent transition-colors md:text-[2rem]">
                    <Link href={`/${locale}/${leadStory.categorySlug}/${leadStory.slug}`}>
                      {leadStory.title}
                    </Link>
                  </h2>
                  {leadStory.deck ? (
                    <p className="mt-2.5 max-w-[62ch] text-base leading-relaxed text-stone">
                      {leadStory.deck}
                    </p>
                  ) : null}
                  <div className="mt-3 flex items-center gap-3 text-xs font-semibold text-stone">
                    <span className="font-bold text-ink">
                      {leadStory.authorNames.join(', ') || dict.siteName}
                    </span>
                    <span>·</span>
                    <RelativeTime iso={leadStory.publishedAt} locale={locale} />
                  </div>
                </div>
              </article>
            ) : null}

            {/* Secondary Stories */}
            <div className="flex flex-col justify-between gap-5 lg:col-span-5">
              {[secondStory, thirdStory].filter(Boolean).map((story) => (
                <article
                  key={story.id}
                  className="surface-card flex flex-col justify-between overflow-hidden p-4 group"
                >
                  <div>
                    {story.hero ? (
                      <Link
                        href={`/${locale}/${story.categorySlug}/${story.slug}`}
                        className="editorial-image relative block aspect-[16/10] rounded-[var(--radius-control)] mb-3 overflow-hidden"
                      >
                        <Image
                          src={story.hero.url}
                          alt={story.hero.alt || story.title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 360px"
                          className="object-cover"
                        />
                      </Link>
                    ) : null}
                    <h3 className="text-base font-bold leading-snug tracking-[-0.015em] text-ink group-hover:text-accent transition-colors md:text-lg">
                      <Link href={`/${locale}/${story.categorySlug}/${story.slug}`}>
                        {story.title}
                      </Link>
                    </h3>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-2 text-xs font-medium text-stone">
                    <span>{story.authorNames.join(', ') || dict.siteName}</span>
                    <RelativeTime iso={story.publishedAt} locale={locale} />
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Chronological Stream */}
          {streamStories.length ? (
            <section className="mt-12 border-t-2 border-line pt-8" aria-label="More Stories">
              <h2 className="mb-6 text-xl font-black text-ink">
                {locale === 'ne' ? 'थप समाचार' : 'More Stories'}
              </h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {streamStories.map((story) => (
                  <article
                    key={story.id}
                    className="surface-card flex flex-col justify-between overflow-hidden group"
                  >
                    {story.hero ? (
                      <Link
                        href={`/${locale}/${story.categorySlug}/${story.slug}`}
                        className="editorial-image relative block aspect-[16/10] w-full"
                      >
                        <Image
                          src={story.hero.url}
                          alt={story.hero.alt || story.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 33vw"
                          className="object-cover"
                        />
                      </Link>
                    ) : null}

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-base font-bold leading-snug tracking-[-0.015em] text-ink group-hover:text-accent transition-colors">
                          <Link href={`/${locale}/${story.categorySlug}/${story.slug}`}>
                            {story.title}
                          </Link>
                        </h3>
                        {story.deck ? (
                          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-stone">
                            {story.deck}
                          </p>
                        ) : null}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-2 text-[0.72rem] font-semibold text-stone">
                        <span>{story.authorNames.join(', ') || dict.siteName}</span>
                        <RelativeTime iso={story.publishedAt} locale={locale} />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {/* Cross-Discovery Sections */}
          <div className="mt-14">
            <TrendingSection
              locale={locale}
              dict={dict}
              stories={trendingCards}
              title={dict.trending}
            />
          </div>

          <div className="mt-8">
            <LatestSection
              locale={locale}
              dict={dict}
              stories={otherStories}
              title={dict.latestUpdates}
              variant="cards"
            />
          </div>
        </>
      ) : (
        <div className="rounded-[var(--radius-panel)] border border-line bg-paper-elevated p-12 text-center">
          <p className="text-lg font-bold text-ink">{dict.empty}</p>
          <p className="mt-2 text-sm text-stone">
            {locale === 'ne'
              ? 'यस विभागमा हाल कुनै लेख प्रकाशित छैन।'
              : 'No articles published in this category yet.'}
          </p>
          <Link
            href={`/${locale}`}
            className="mt-5 inline-flex items-center rounded-[var(--radius-control)] accent-solid px-4 py-2 text-xs font-bold"
          >
            ← {dict.home}
          </Link>
        </div>
      )}
    </main>
  )
}

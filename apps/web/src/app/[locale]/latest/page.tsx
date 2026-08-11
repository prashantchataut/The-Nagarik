import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Clock, Lightning } from '@phosphor-icons/react/dist/ssr'
import { RelativeTime } from '@/components/RelativeTime'
import { CategoryIcon } from '@/components/CategoryIcon'
import { Pager, parsePage } from '@/components/news/Pager'
import { getContent, siteUrl } from '@/lib/content'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: raw } = await params
  if (!isLocale(raw)) return {}
  const locale = raw as AppLocale
  const title = locale === 'ne' ? 'ताजा अपडेट तथा समाचार' : 'Latest Updates & Breaking News'
  const description =
    locale === 'ne'
      ? 'नेपाल र विश्वका पलपलका ताजा समाचार र समयक्रम अपडेट।'
      : 'Continuous chronological news updates from Nepal and across the world.'

  return {
    title: `${title} | The Nagarik`,
    description,
    alternates: {
      canonical: siteUrl(`/${locale}/latest`),
    },
  }
}

export default async function LatestUpdatesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { locale: raw } = await params
  const { page: rawPage } = await searchParams
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)
  const content = getContent()
  const [articles, categories] = await Promise.all([
    content.listPublishedArticles({ locale }),
    content.listCategories(),
  ])
  const cards = await Promise.all(articles.map((article) => content.toStoryCard(article, locale)))

  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  const current = cards.filter(
    (story) => story.publishedAt && now - new Date(story.publishedAt).getTime() < dayMs,
  )
  const archiveAll = cards.filter((story) => !current.includes(story))
  const ARCHIVE_PAGE_SIZE = 18
  const pager = parsePage(rawPage, archiveAll.length, ARCHIVE_PAGE_SIZE)
  const archive = pager.slice(archiveAll)
  const featured = (current.length ? current : cards).slice(0, 4)
  const timeline = (current.length ? current : cards).slice(4)

  const isNe = locale === 'ne'
  const copy = isNe
    ? {
        kicker: 'निरन्तर ताजा अपडेट',
        title: 'ताजा समाचार',
        intro: 'आजका प्रमुख राष्ट्रिय, राजनीतिक, आर्थिक तथा प्रदेशका घटनाक्रमलाई समयक्रमअनुसार छिटो स्क्यान गर्नुहोस्।',
        live: 'आजका मुख्य अपडेट',
        earlier: 'अघिल्ला समाचारहरू',
      }
    : {
        kicker: 'Continuous 24h feed',
        title: 'Latest Updates',
        intro: 'Chronological news stream across politics, economy, society, and federal provinces.',
        live: "Today's Leading Updates",
        earlier: 'Earlier Stories',
      }

  const storyHref = (story: (typeof cards)[number]) =>
    `/${locale}/${story.categorySlug}/${story.slug}`

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-8 md:px-6 md:py-12">
      {/* Masthead */}
      <header className="border-b-2 border-accent pb-6 mb-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-[760px]">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-danger animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-wider text-accent">
                {copy.kicker}
              </p>
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-ink md:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-stone md:text-lg">
              {copy.intro}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-paper-elevated border border-line px-3.5 py-1.5 text-xs font-bold text-stone">
            <Lightning size={16} weight="fill" className="text-accent" />
            <span>
              {cards.length} {dict.stories}
            </span>
          </div>
        </div>
      </header>

      {/* Featured Leading Stories */}
      {featured.length ? (
        <section aria-label={copy.live}>
          <div className="mb-6 flex items-center justify-between border-b border-line pb-3">
            <h2 className="text-xl font-black text-ink md:text-2xl">{copy.live}</h2>
            <span className="rounded-full bg-accent-muted px-2.5 py-0.5 text-xs font-bold text-accent">
              {dict.hours24}
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
            {/* Top Lead Feature (7 cols) */}
            {featured[0] ? (
              <article className="lg:col-span-7 group">
                {featured[0].hero ? (
                  <Link
                    href={storyHref(featured[0])}
                    className="editorial-image relative block aspect-[16/9] w-full rounded-[var(--radius-panel)] shadow-[0_4px_16px_rgb(16_32_29_/_0.08)]"
                  >
                    <Image
                      src={featured[0].hero.url}
                      alt={featured[0].hero.alt || featured[0].title}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 720px"
                      className="object-cover"
                    />
                  </Link>
                ) : null}

                <div className="mt-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-accent">
                    <CategoryIcon slug={featured[0].categorySlug} size={13} weight="bold" />
                    <span className="capitalize">{featured[0].categorySlug}</span>
                    <span>·</span>
                    <RelativeTime iso={featured[0].publishedAt} locale={locale} />
                  </div>

                  <h3 className="mt-2 text-2xl font-black leading-tight tracking-[-0.025em] text-ink group-hover:text-accent transition-colors md:text-[2rem]">
                    <Link href={storyHref(featured[0])}>{featured[0].title}</Link>
                  </h3>

                  {featured[0].deck ? (
                    <p className="mt-2.5 max-w-[62ch] text-sm leading-relaxed text-stone md:text-base">
                      {featured[0].deck}
                    </p>
                  ) : null}

                  <div className="mt-3 flex items-center gap-3 text-xs font-semibold text-stone">
                    <span className="font-bold text-ink">
                      {featured[0].authorNames.join(', ') || dict.siteName}
                    </span>
                    <span>·</span>
                    <div className="inline-flex items-center gap-1">
                      <Clock size={12} weight="bold" />
                      <span>
                        {featured[0].readTimeMinutes} {dict.minutesRead}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ) : null}

            {/* Secondary 3 Stories (5 cols) */}
            <div className="divide-y divide-line lg:col-span-5">
              {featured.slice(1).map((story) => (
                <article
                  key={story.id}
                  className="grid grid-cols-[1fr_6.5rem] gap-4 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_8.5rem] group"
                >
                  <div className="flex flex-col justify-between min-w-0 pr-1">
                    <div>
                      <div className="flex items-center gap-1 text-[0.72rem] font-bold text-accent">
                        <span className="capitalize">{story.categorySlug}</span>
                        <span>·</span>
                        <RelativeTime iso={story.publishedAt} locale={locale} />
                      </div>
                      <h4 className="mt-1 text-base font-bold leading-snug tracking-[-0.015em] text-ink group-hover:text-accent transition-colors">
                        <Link href={storyHref(story)}>{story.title}</Link>
                      </h4>
                    </div>
                  </div>

                  {story.hero ? (
                    <Link
                      href={storyHref(story)}
                      className="editorial-image relative aspect-[4/3] rounded-[var(--radius-control)] overflow-hidden shadow-sm"
                    >
                      <Image
                        src={story.hero.url}
                        alt={story.hero.alt || story.title}
                        fill
                        sizes="136px"
                        className="object-cover"
                      />
                    </Link>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Timeline Stream */}
      {timeline.length ? (
        <section className="mt-14 border-t-2 border-line pt-8" aria-label="Timeline">
          <h2 className="mb-6 text-xl font-black text-ink">
            {isNe ? 'थप ताजा समाचार' : 'More Recent Updates'}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {timeline.map((story) => (
              <article
                key={story.id}
                className="surface-card flex flex-col justify-between overflow-hidden group"
              >
                {story.hero ? (
                  <Link
                    href={storyHref(story)}
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
                    <div className="flex items-center gap-1.5 text-xs font-bold text-accent">
                      <CategoryIcon slug={story.categorySlug} size={12} weight="bold" />
                      <span className="capitalize">{story.categorySlug}</span>
                    </div>

                    <h3 className="mt-2 text-base font-bold leading-snug tracking-[-0.015em] text-ink group-hover:text-accent transition-colors">
                      <Link href={storyHref(story)}>{story.title}</Link>
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

      {/* Archive Stories */}
      {archive.length ? (
        <section className="mt-14 rounded-[var(--radius-panel)] bg-paper-elevated p-6 sm:p-8" aria-label={copy.earlier}>
          <div className="mb-6 flex items-center justify-between border-b border-line pb-3">
            <h2 className="text-xl font-black text-ink">{copy.earlier}</h2>
            <span className="text-xs font-bold text-stone">{archiveAll.length}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {archive.map((story) => (
              <Link
                key={story.id}
                href={storyHref(story)}
                className="surface-card flex items-center justify-between gap-3 p-3 group hover:border-accent"
              >
                <div className="min-w-0">
                  <span className="text-[0.7rem] font-bold text-accent capitalize">
                    {story.categorySlug}
                  </span>
                  <h4 className="mt-0.5 line-clamp-2 text-xs font-bold leading-snug text-ink group-hover:text-accent">
                    {story.title}
                  </h4>
                </div>
                {story.hero ? (
                  <span className="editorial-image relative h-14 w-14 shrink-0 rounded-[var(--radius-sm)] overflow-hidden">
                    <Image
                      src={story.hero.url}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        
          <Pager
            basePath={`/${locale}/latest`}
            page={pager.page}
            totalPages={pager.totalPages}
            locale={locale}
          />
        </section>
      ) : null}
    </main>
  )
}

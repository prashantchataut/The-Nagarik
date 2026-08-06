import Image from 'next/image'
import Link from 'next/link'
import type { Category, StoryCard } from '@thenagarik/content'
import type { AppLocale, Dictionary } from '@/lib/i18n'
import { RelativeTime } from '@/components/RelativeTime'
import { provinceLabel } from '@/lib/provinces'
import { PatroTodayStrip } from '@/components/PatroTodayStrip'
import { FeedStory } from '@/components/news/FeedStory'
import { AdSlot } from '@/components/news/AdSlot'
import { SectionBand } from '@/components/news/SectionBand'
import { ThumbHeadline } from '@/components/news/ThumbHeadline'
import { patroHref } from '@/lib/site'

/** Zone A: wire + patro + Ratopati-style centered feed (top 3–5 stories) */
export function HomeCover({
  locale,
  dict,
  feed,
  updates,
  categoryLabel,
}: {
  locale: AppLocale
  dict: Dictionary
  feed: StoryCard[]
  updates: StoryCard[]
  categoryLabel: (slug: string) => string
}) {
  const wireLead = updates[0]
  const wireRest = updates.slice(1, 5)

  return (
    <section>
      {wireLead ? (
        <div className="border-b border-line bg-paper-elevated">
          <div className="mx-auto flex max-w-[1240px] items-stretch md:px-6">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 px-4 py-2.5 md:flex-row md:items-center md:gap-4 md:px-0">
              <span className="inline-flex shrink-0 items-center self-start rounded-[var(--radius-control)] bg-accent px-2 py-0.5 text-[0.68rem] font-semibold text-accent-fg">
                {dict.latestUpdates}
              </span>
              <Link
                href={`/${locale}/${wireLead.categorySlug}/${wireLead.slug}`}
                className="min-w-0 truncate text-sm font-medium text-ink hover:text-accent"
              >
                {wireLead.isBreaking ? (
                  <span className="mr-1.5 text-holiday">{dict.breaking}</span>
                ) : null}
                {wireLead.title}
              </Link>
              {wireRest.length ? (
                <ul className="hidden min-w-0 flex-1 items-center gap-3 border-l border-line pl-4 text-xs text-stone xl:flex">
                  {wireRest.map((s) => (
                    <li key={s.id} className="max-w-[14rem] truncate">
                      <Link
                        href={`/${locale}/${s.categorySlug}/${s.slug}`}
                        className="hover:text-ink"
                      >
                        {s.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <PatroTodayStrip locale={locale} dict={dict} href={patroHref(locale)} />

      <div className="mx-auto max-w-[1210px]">
        {feed.map((story, i) => (
          <div key={story.id}>
            <FeedStory
              locale={locale}
              story={story}
              categoryLabel={categoryLabel(story.categorySlug)}
              priority={i === 0}
              textFirst={i === 0 && !story.hero}
            />
            {i === 1 ? (
              <div className="border-b border-line px-4 py-6 md:px-6">
                <AdSlot variant="infeed" label={dict.advertisement} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
}

export function HomeSignals({
  locale,
  dict,
  trending,
  mostRead,
  trendingLive,
  mostReadLive,
}: {
  locale: AppLocale
  dict: Dictionary
  trending: StoryCard[]
  mostRead: StoryCard[]
  trendingLive: boolean
  mostReadLive: boolean
}) {
  if (!trending.length && !mostRead.length) return null
  return (
    <section className="border-b border-line bg-paper-elevated">
      <div className="mx-auto grid max-w-[1240px] md:grid-cols-2">
        <div className="border-b border-line px-4 py-5 md:border-b-0 md:border-r md:px-6">
          <h2 className="border-b-2 border-accent pb-2 text-lg font-semibold">{dict.trending}</h2>
          {!trendingLive ? <p className="mt-1 text-xs text-stone">{dict.coldStart}</p> : null}
          <ol className="mt-2">
            {trending.map((story, i) => (
              <li
                key={story.id}
                className="grid grid-cols-[1.1rem_1fr] gap-2 border-b border-line py-2.5 last:border-b-0"
              >
                <span className="text-sm font-semibold tabular-nums text-accent">{i + 1}</span>
                <Link
                  href={`/${locale}/${story.categorySlug}/${story.slug}`}
                  className="text-[0.98rem] font-medium leading-snug hover:text-accent"
                >
                  {story.title}
                </Link>
              </li>
            ))}
          </ol>
        </div>
        <div className="px-4 py-5 md:px-6">
          <h2 className="border-b-2 border-accent pb-2 text-lg font-semibold">{dict.mostRead}</h2>
          {!mostReadLive ? <p className="mt-1 text-xs text-stone">{dict.coldStart}</p> : null}
          <ol className="mt-2">
            {mostRead.map((story, i) => (
              <li
                key={story.id}
                className="grid grid-cols-[1.1rem_1fr] gap-2 border-b border-line py-2.5 last:border-b-0"
              >
                <span className="text-sm font-semibold tabular-nums text-stone">{i + 1}</span>
                <Link
                  href={`/${locale}/${story.categorySlug}/${story.slug}`}
                  className="text-[0.98rem] font-medium leading-snug hover:text-accent"
                >
                  {story.title}
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

export function HomeDesk({
  locale,
  dict,
  editors,
  province,
}: {
  locale: AppLocale
  dict: Dictionary
  editors: StoryCard[]
  province: StoryCard[]
}) {
  if (!editors.length && !province.length) return null
  const [feature, ...rest] = editors

  return (
    <section className="border-b border-line">
      <div className="mx-auto grid max-w-[1240px] lg:grid-cols-12">
        {feature ? (
          <div className="border-b border-line px-4 py-5 md:px-6 md:py-6 lg:col-span-7 lg:border-b-0 lg:border-r">
            <h2 className="border-b-2 border-accent pb-2 text-lg font-semibold md:text-xl">
              {dict.editorsPicks}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] sm:items-start">
              <Link
                href={`/${locale}/${feature.categorySlug}/${feature.slug}`}
                className="relative block aspect-[16/10] overflow-hidden"
              >
                {feature.hero ? (
                  <Image
                    src={feature.hero.url}
                    alt={feature.hero.alt}
                    fill
                    sizes="(max-width:1024px) 100vw, 35vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-line" />
                )}
              </Link>
              <div>
                <h3 className="text-lg font-semibold leading-snug tracking-[-0.02em] md:text-xl">
                  <Link
                    href={`/${locale}/${feature.categorySlug}/${feature.slug}`}
                    className="hover:text-accent"
                  >
                    {feature.title}
                  </Link>
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-stone">{feature.deck}</p>
                <p className="mt-2 text-xs text-stone">
                  <RelativeTime iso={feature.publishedAt} locale={locale} />
                </p>
              </div>
            </div>
            {rest.length ? (
              <ul className="mt-4 border-t border-line">
                {rest.map((story) => (
                  <li key={story.id} className="border-b border-line last:border-b-0">
                    <ThumbHeadline locale={locale} story={story} />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {province.length ? (
          <div className="px-4 py-5 md:px-6 md:py-6 lg:col-span-5">
            <div className="flex items-baseline justify-between gap-3 border-b-2 border-accent pb-2">
              <h2 className="text-lg font-semibold md:text-xl">
                <Link href={`/${locale}/pradesh`}>{dict.provinces}</Link>
              </h2>
              <Link href={`/${locale}/pradesh`} className="text-xs text-accent hover:underline">
                {dict.seeAll}
              </Link>
            </div>
            <ul>
              {province.slice(0, 6).map((story) => {
                const badge = provinceLabel(story.province, locale)
                return (
                  <li key={story.id} className="border-b border-line last:border-b-0">
                    <Link
                      href={`/${locale}/${story.categorySlug}/${story.slug}`}
                      className="block py-2.5 hover:text-accent"
                    >
                      {badge ? <p className="mb-0.5 text-[0.7rem] font-medium text-accent">{badge}</p> : null}
                      <span className="text-[1.02rem] font-medium leading-snug text-ink">
                        {story.title}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export function HomeCategoryBand({
  locale,
  dict,
  category,
  stories,
}: {
  locale: AppLocale
  dict: Dictionary
  category: Category
  stories: StoryCard[]
}) {
  if (!stories.length) return null
  const title = locale === 'en' ? category.nameEn : category.nameNe
  const [feature, ...rest] = stories
  const featureHref = `/${locale}/${feature.categorySlug}/${feature.slug}`

  return (
    <SectionBand title={title} href={`/${locale}/${category.slug}`} seeAll={dict.seeAll}>
      <div className="grid gap-5 lg:grid-cols-12 lg:gap-8">
        <article className="lg:col-span-5">
          <Link href={featureHref} className="relative mb-3 block aspect-[16/10] overflow-hidden">
            {feature.hero ? (
              <Image
                src={feature.hero.url}
                alt={feature.hero.alt}
                fill
                sizes="(max-width:1024px) 100vw, 40vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-line" />
            )}
          </Link>
          <h3 className="text-lg font-semibold leading-snug tracking-[-0.02em] md:text-xl">
            <Link href={featureHref} className="hover:text-accent">
              {feature.title}
            </Link>
          </h3>
          <p className="mt-1.5 line-clamp-2 text-sm text-stone">{feature.deck}</p>
        </article>
        <ul className="lg:col-span-7">
          {rest.slice(0, 5).map((story) => (
            <li key={story.id} className="border-b border-line last:border-b-0">
              <ThumbHeadline locale={locale} story={story} />
            </li>
          ))}
        </ul>
      </div>
    </SectionBand>
  )
}

export function HomeOpinion({
  locale,
  dict,
  stories,
}: {
  locale: AppLocale
  dict: Dictionary
  stories: StoryCard[]
}) {
  if (!stories.length) return null
  return (
    <SectionBand title={dict.opinion} href={`/${locale}/bichar`} seeAll={dict.seeAll}>
      <ul className="grid gap-0 md:grid-cols-3 md:divide-x md:divide-line">
        {stories.map((story) => (
          <li
            key={story.id}
            className="border-b border-line last:border-b-0 md:border-b-0 md:px-5 md:first:pl-0 md:last:pr-0"
          >
            <Link
              href={`/${locale}/${story.categorySlug}/${story.slug}`}
              className="block py-3.5 hover:text-accent md:py-4"
            >
              <span className="font-[family-name:var(--font-serif)] text-lg leading-snug tracking-[-0.02em] text-ink">
                {story.title}
              </span>
              <span className="mt-1.5 block text-xs text-stone">{story.authorNames.join(', ')}</span>
            </Link>
          </li>
        ))}
      </ul>
    </SectionBand>
  )
}

export function HomeVisual({
  locale,
  dict,
  stories,
}: {
  locale: AppLocale
  dict: Dictionary
  stories: StoryCard[]
}) {
  if (stories.length < 2) return null
  const [hero, ...rest] = stories.slice(0, 4)
  return (
    <SectionBand title={dict.visual}>
      <div className="grid gap-3 md:grid-cols-12 md:gap-4">
        <Link
          href={`/${locale}/${hero.categorySlug}/${hero.slug}`}
          className="group relative block aspect-[16/10] overflow-hidden md:col-span-7 md:aspect-auto md:min-h-[320px]"
        >
          {hero.hero ? (
            <Image
              src={hero.hero.url}
              alt={hero.hero.alt}
              fill
              sizes="(max-width:768px) 100vw, 60vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          ) : (
            <span className="absolute inset-0 bg-line" />
          )}
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 pt-16">
            <span className="text-lg font-semibold leading-snug text-white md:text-xl">{hero.title}</span>
          </span>
        </Link>
        <ul className="grid gap-3 sm:grid-cols-3 md:col-span-5 md:grid-cols-1">
          {rest.map((story) => (
            <li key={story.id}>
              <Link
                href={`/${locale}/${story.categorySlug}/${story.slug}`}
                className="group grid grid-cols-[5rem_1fr] gap-3 hover:text-accent sm:grid-cols-1 md:grid-cols-[5.5rem_1fr]"
              >
                <span className="relative aspect-[4/3] overflow-hidden bg-line">
                  {story.hero ? (
                    <Image
                      src={story.hero.url}
                      alt=""
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                  ) : null}
                </span>
                <span className="self-center text-[0.98rem] font-medium leading-snug text-ink">
                  {story.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </SectionBand>
  )
}

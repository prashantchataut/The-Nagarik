import Image from 'next/image'
import Link from 'next/link'
import type { Category, StoryCard } from '@thenagarik/content'
import type { AppLocale, Dictionary } from '@/lib/i18n'
import { RelativeTime } from '@/components/RelativeTime'
import { provinceLabel } from '@/lib/provinces'
import { PatroTodayStrip } from '@/components/PatroTodayStrip'

/** Newsroom opening: update wire, patro, lead + latest rail. */
export function HomeCover({
  locale,
  dict,
  lead,
  side,
  updates,
  categoryLabel,
}: {
  locale: AppLocale
  dict: Dictionary
  lead: StoryCard
  side: StoryCard[]
  updates: StoryCard[]
  categoryLabel: (slug: string) => string
}) {
  const href = `/${locale}/${lead.categorySlug}/${lead.slug}`
  const ranked = side.slice(0, 7)
  const underLead = side.slice(7, 10)
  const wireLead = updates[0]
  const wireRest = updates.slice(1, 5)

  return (
    <section className="border-b border-line">
      {wireLead ? (
        <div className="border-b border-line bg-paper-elevated">
          <div className="mx-auto flex max-w-[1400px] items-stretch md:px-6">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 px-4 py-2.5 md:flex-row md:items-center md:gap-4 md:px-0">
              <span className="inline-flex shrink-0 items-center self-start bg-accent px-2 py-0.5 text-[0.68rem] font-semibold text-accent-fg">
                {dict.latestUpdates}
              </span>
              <Link
                href={`/${locale}/${wireLead.categorySlug}/${wireLead.slug}`}
                className="min-w-0 truncate text-sm font-medium text-ink hover:text-accent"
              >
                {wireLead.isBreaking ? (
                  <span className="mr-1.5 text-accent">{dict.breaking}</span>
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

      <PatroTodayStrip locale={locale} dict={dict} />

      <div className="mx-auto grid max-w-[1400px] lg:grid-cols-12">
        <article className="border-b border-line lg:col-span-8 lg:border-b-0 lg:border-r">
          <Link href={href} className="relative block aspect-[16/9] overflow-hidden md:aspect-[2/1]">
            {lead.hero ? (
              <Image
                src={lead.hero.url}
                alt={lead.hero.alt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-line" />
            )}
          </Link>
          <div className="px-4 py-4 md:px-6 md:py-5">
            <p className="mb-1.5 text-xs text-accent">
              <Link href={`/${locale}/${lead.categorySlug}`} className="hover:underline">
                {categoryLabel(lead.categorySlug)}
              </Link>
              {lead.isBreaking ? (
                <>
                  <span className="mx-2 text-line">/</span>
                  <span className="font-semibold">{dict.breaking}</span>
                </>
              ) : null}
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-[1.65rem] leading-[1.28] tracking-[-0.02em] text-ink md:text-[2rem] lg:text-[2.25rem]">
              <Link href={href} className="hover:text-accent">
                {lead.title}
              </Link>
            </h1>
            <p className="mt-2 max-w-[54ch] text-[0.95rem] leading-relaxed text-stone">{lead.deck}</p>
            <p className="mt-3 text-xs text-stone">
              {lead.authorNames[0]}
              <span className="mx-2 text-line">/</span>
              <RelativeTime iso={lead.publishedAt} locale={locale} />
              <span className="mx-2 text-line">/</span>
              {lead.readTimeMinutes} {dict.minutesRead}
            </p>
          </div>
        </article>

        <aside className="px-4 py-4 md:px-6 lg:col-span-4 lg:py-5">
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
            <h2 className="font-[family-name:var(--font-display)] text-lg">{dict.latest}</h2>
            <Link href={`/${locale}/latest`} className="text-xs text-accent hover:underline">
              {dict.seeAll}
            </Link>
          </div>
          <ol>
            {ranked.map((story, i) => {
              const sHref = `/${locale}/${story.categorySlug}/${story.slug}`
              return (
                <li key={story.id} className="border-b border-line last:border-b-0">
                  <Link href={sHref} className="grid grid-cols-[1.1rem_1fr] gap-2.5 py-2.5 sm:grid-cols-[1.1rem_3.25rem_1fr]">
                    <span className="pt-0.5 text-sm tabular-nums text-accent">{i + 1}</span>
                    <span className="relative hidden aspect-square overflow-hidden bg-line sm:block">
                      {story.hero ? (
                        <Image
                          src={story.hero.url}
                          alt=""
                          fill
                          sizes="52px"
                          className="object-cover"
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0">
                      <span className="font-[family-name:var(--font-display)] text-[0.98rem] leading-snug text-ink hover:text-accent">
                        {story.title}
                      </span>
                      <span className="mt-1 block text-[0.7rem] text-stone">
                        <RelativeTime iso={story.publishedAt} locale={locale} />
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ol>
        </aside>
      </div>

      {underLead.length ? (
        <div className="mx-auto grid max-w-[1400px] border-t border-line md:grid-cols-3">
          {underLead.map((story) => {
            const sHref = `/${locale}/${story.categorySlug}/${story.slug}`
            return (
              <article
                key={story.id}
                className="border-b border-line px-4 py-4 last:border-b-0 md:border-b-0 md:border-r md:border-line md:px-5 md:py-5 md:last:border-r-0"
              >
                <h3 className="font-[family-name:var(--font-display)] text-[1.05rem] leading-snug">
                  <Link href={sHref} className="hover:text-accent">
                    {story.title}
                  </Link>
                </h3>
                <p className="mt-1.5 line-clamp-2 text-sm text-stone">{story.deck}</p>
              </article>
            )
          })}
        </div>
      ) : null}
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
    <section className="border-b border-line">
      <div className="mx-auto grid max-w-[1400px] md:grid-cols-2">
        <div className="border-b border-line px-4 py-4 md:border-b-0 md:border-r md:px-6 md:py-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg">{dict.trending}</h2>
          {!trendingLive ? <p className="mt-1 text-xs text-stone">{dict.coldStart}</p> : null}
          <ol className="mt-2">
            {trending.map((story, i) => (
              <li
                key={story.id}
                className="grid grid-cols-[1.1rem_1fr] gap-2 border-b border-line py-2 last:border-b-0"
              >
                <span className="text-sm tabular-nums text-accent">{i + 1}</span>
                <Link
                  href={`/${locale}/${story.categorySlug}/${story.slug}`}
                  className="text-[0.95rem] leading-snug hover:text-accent"
                >
                  {story.title}
                </Link>
              </li>
            ))}
          </ol>
        </div>
        <div className="px-4 py-4 md:px-6 md:py-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg">{dict.mostRead}</h2>
          {!mostReadLive ? <p className="mt-1 text-xs text-stone">{dict.coldStart}</p> : null}
          <ol className="mt-2">
            {mostRead.map((story, i) => (
              <li
                key={story.id}
                className="grid grid-cols-[1.1rem_1fr] gap-2 border-b border-line py-2 last:border-b-0"
              >
                <span className="text-sm tabular-nums text-stone">{i + 1}</span>
                <Link
                  href={`/${locale}/${story.categorySlug}/${story.slug}`}
                  className="text-[0.95rem] leading-snug hover:text-accent"
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
      <div className="mx-auto grid max-w-[1400px] lg:grid-cols-12">
        {feature ? (
          <div className="border-b border-line px-4 py-5 md:px-6 md:py-6 lg:col-span-7 lg:border-b-0 lg:border-r">
            <h2 className="font-[family-name:var(--font-display)] text-lg md:text-xl">
              {dict.editorsPicks}
            </h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] sm:items-start">
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
                <h3 className="font-[family-name:var(--font-display)] text-lg leading-snug tracking-[-0.02em] md:text-xl">
                  <Link
                    href={`/${locale}/${feature.categorySlug}/${feature.slug}`}
                    className="hover:text-accent"
                  >
                    {feature.title}
                  </Link>
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-stone">{feature.deck}</p>
              </div>
            </div>
            {rest.length ? (
              <ul className="mt-4 border-t border-line">
                {rest.map((story) => (
                  <li key={story.id} className="border-b border-line last:border-b-0">
                    <Link
                      href={`/${locale}/${story.categorySlug}/${story.slug}`}
                      className="block py-2.5 font-[family-name:var(--font-display)] text-[1.02rem] leading-snug hover:text-accent"
                    >
                      {story.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {province.length ? (
          <div className="px-4 py-5 md:px-6 md:py-6 lg:col-span-5">
            <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
              <h2 className="font-[family-name:var(--font-display)] text-lg md:text-xl">
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
                      {badge ? <p className="mb-0.5 text-[0.7rem] text-accent">{badge}</p> : null}
                      <span className="font-[family-name:var(--font-display)] text-[1.02rem] leading-snug text-ink">
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

/** Feature + thumb list, one grammar for every category band. */
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
    <section className="border-b border-line">
      <div className="mx-auto max-w-[1400px] px-4 py-5 md:px-6 md:py-6">
        <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2">
          <h2 className="font-[family-name:var(--font-display)] text-lg md:text-xl">
            <Link href={`/${locale}/${category.slug}`}>{title}</Link>
          </h2>
          <Link href={`/${locale}/${category.slug}`} className="text-xs text-accent hover:underline">
            {dict.seeAll}
          </Link>
        </div>
        <div className="mt-4 grid gap-5 lg:grid-cols-12 lg:gap-8">
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
            <h3 className="font-[family-name:var(--font-display)] text-lg leading-snug tracking-[-0.02em] md:text-xl">
              <Link href={featureHref} className="hover:text-accent">
                {feature.title}
              </Link>
            </h3>
            <p className="mt-1.5 line-clamp-2 text-sm text-stone">{feature.deck}</p>
          </article>
          <ul className="lg:col-span-7">
            {rest.slice(0, 5).map((story) => {
              const sHref = `/${locale}/${story.categorySlug}/${story.slug}`
              return (
                <li key={story.id} className="border-b border-line last:border-b-0">
                  <Link href={sHref} className="grid grid-cols-[4rem_1fr] gap-3 py-2.5 sm:grid-cols-[4.5rem_1fr]">
                    <span className="relative aspect-[4/3] overflow-hidden bg-line">
                      {story.hero ? (
                        <Image
                          src={story.hero.url}
                          alt=""
                          fill
                          sizes="72px"
                          className="object-cover"
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0 self-center font-[family-name:var(--font-display)] text-[1.02rem] leading-snug text-ink hover:text-accent">
                      {story.title}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
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
    <section className="border-b border-line">
      <div className="mx-auto max-w-[1400px] px-4 py-5 md:px-6 md:py-6">
        <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2">
          <h2 className="font-[family-name:var(--font-display)] text-lg md:text-xl">{dict.opinion}</h2>
          <Link href={`/${locale}/bichar`} className="text-xs text-accent hover:underline">
            {dict.seeAll}
          </Link>
        </div>
        <ul className="mt-1 grid gap-0 md:grid-cols-3 md:divide-x md:divide-line">
          {stories.map((story) => (
            <li key={story.id} className="border-b border-line last:border-b-0 md:border-b-0 md:px-5 md:first:pl-0 md:last:pr-0">
              <Link
                href={`/${locale}/${story.categorySlug}/${story.slug}`}
                className="block py-3.5 hover:text-accent md:py-4"
              >
                <span className="font-[family-name:var(--font-display)] text-lg leading-snug tracking-[-0.02em] text-ink">
                  {story.title}
                </span>
                <span className="mt-1.5 block text-xs text-stone">{story.authorNames.join(', ')}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
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
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-[1400px] px-4 py-5 md:px-6 md:py-6">
        <h2 className="font-[family-name:var(--font-display)] text-lg md:text-xl">{dict.visual}</h2>
        <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {stories.slice(0, 3).map((story) => {
            const href = `/${locale}/${story.categorySlug}/${story.slug}`
            return (
              <li key={story.id}>
                <Link href={href} className="block hover:text-accent">
                  <span className="relative mb-2 block aspect-[16/10] overflow-hidden">
                    {story.hero ? (
                      <Image
                        src={story.hero.url}
                        alt={story.hero.alt}
                        fill
                        sizes="(max-width:768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <span className="absolute inset-0 bg-line" />
                    )}
                  </span>
                  <span className="font-[family-name:var(--font-display)] text-[1.02rem] leading-snug text-ink">
                    {story.title}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

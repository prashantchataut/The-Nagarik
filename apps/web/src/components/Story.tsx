import Image from 'next/image'
import Link from 'next/link'
import type { Category, StoryCard } from '@thenagarik/content'
import type { AppLocale, Dictionary } from '@/lib/i18n'

export function relativeTime(iso: string | undefined, locale: AppLocale): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.max(1, Math.round(diff / 60_000))
  if (locale === 'ne') {
    if (mins < 60) return `${mins} मिनेट अगाडि`
    const hours = Math.round(mins / 60)
    if (hours < 24) return `${hours} घण्टा अगाडि`
    return `${Math.round(hours / 24)} दिन अगाडि`
  }
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

/** Compact strip under nav — OK “ताजा अपडेट” lesson without marquee spam. */
export function UpdateStrip({
  locale,
  dict,
  stories,
}: {
  locale: AppLocale
  dict: Dictionary
  stories: StoryCard[]
}) {
  if (!stories.length) return null
  const lead = stories[0]
  const rest = stories.slice(1, 5)
  return (
    <div className="border-b border-line bg-paper-elevated/80">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-4 py-2.5 md:flex-row md:items-center md:gap-6 md:px-6">
        <p className="shrink-0 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-accent">
          {dict.latestUpdates}
          <span className="ml-2 font-normal tracking-normal text-stone normal-case">· {dict.hours24}</span>
        </p>
        <div className="min-w-0 flex-1">
          <Link
            href={`/${locale}/${lead.categorySlug}/${lead.slug}`}
            className="block truncate text-sm font-medium text-ink hover:text-accent"
          >
            {lead.isBreaking ? (
              <span className="mr-2 text-accent">{dict.breaking}</span>
            ) : null}
            {lead.title}
          </Link>
        </div>
        <ul className="hidden gap-4 text-xs text-stone lg:flex">
          {rest.map((s) => (
            <li key={s.id} className="max-w-[14rem] truncate">
              <Link href={`/${locale}/${s.categorySlug}/${s.slug}`} className="hover:text-ink">
                {s.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** Lead + side latest rail — portal home, not full-viewport gallery hero. */
export function LeadAndRail({
  locale,
  dict,
  lead,
  side,
}: {
  locale: AppLocale
  dict: Dictionary
  lead: StoryCard
  side: StoryCard[]
}) {
  const href = `/${locale}/${lead.categorySlug}/${lead.slug}`
  return (
    <section className="border-b border-line">
      <div className="mx-auto grid max-w-[1400px] gap-0 lg:grid-cols-12">
        <article className="border-b border-line px-4 py-6 md:px-6 md:py-8 lg:col-span-8 lg:border-b-0 lg:border-r">
          {lead.isBreaking ? (
            <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-accent">
              {dict.breaking}
            </p>
          ) : null}
          <div className="grid gap-5 md:grid-cols-[1.1fr_0.9fr] md:items-start md:gap-8">
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-[1.75rem] leading-[1.22] tracking-[-0.03em] text-ink md:text-[2.15rem] lg:text-[2.45rem]">
                <Link href={href}>{lead.title}</Link>
              </h1>
              <p className="mt-3 max-w-[48ch] text-[0.95rem] leading-relaxed text-stone md:text-base">
                {lead.deck}
              </p>
              <p className="mt-4 text-xs text-stone">
                {lead.authorNames[0]}
                <span className="mx-2 text-line">/</span>
                {relativeTime(lead.publishedAt, locale)}
                <span className="mx-2 text-line">/</span>
                {lead.readTimeMinutes} {dict.minutesRead}
              </p>
            </div>
            <Link href={href} className="relative aspect-[16/10] overflow-hidden md:aspect-[4/3]">
              {lead.hero ? (
                <Image
                  src={lead.hero.url}
                  alt={lead.hero.alt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-line" />
              )}
            </Link>
          </div>
        </article>

        <aside className="px-4 py-5 md:px-6 lg:col-span-4 lg:py-8">
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-3">
            <h2 className="font-[family-name:var(--font-display)] text-xl tracking-[-0.02em]">
              {dict.latest}
            </h2>
            <Link href={`/${locale}/latest`} className="text-xs text-accent hover:underline">
              {dict.seeAll}
            </Link>
          </div>
          <ul>
            {side.map((story) => {
              const sHref = `/${locale}/${story.categorySlug}/${story.slug}`
              return (
                <li key={story.id} className="border-b border-line last:border-b-0">
                  <Link href={sHref} className="group grid grid-cols-[4.5rem_1fr] gap-3 py-3">
                    <span className="relative aspect-[4/3] overflow-hidden bg-line">
                      {story.hero ? (
                        <Image
                          src={story.hero.url}
                          alt={story.hero.alt}
                          fill
                          sizes="72px"
                          className="object-cover"
                        />
                      ) : null}
                    </span>
                    <span>
                      <span className="font-[family-name:var(--font-display)] text-[0.98rem] leading-snug tracking-[-0.02em] text-ink group-hover:text-accent">
                        {story.title}
                      </span>
                      <span className="mt-1.5 block text-xs text-stone">
                        {relativeTime(story.publishedAt, locale)}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </aside>
      </div>
    </section>
  )
}

export function CategorySection({
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
      <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6 md:py-10">
        <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
          <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-[-0.03em] md:text-[1.75rem]">
            <Link href={`/${locale}/${category.slug}`}>{title}</Link>
          </h2>
          <Link href={`/${locale}/${category.slug}`} className="text-xs text-accent hover:underline">
            {dict.seeAll}
          </Link>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-12 lg:gap-10">
          <article className="lg:col-span-5">
            <Link href={featureHref} className="relative mb-4 block aspect-[16/10] overflow-hidden">
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
            <h3 className="font-[family-name:var(--font-display)] text-xl leading-snug tracking-[-0.02em] md:text-2xl">
              <Link href={featureHref}>{feature.title}</Link>
            </h3>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone">{feature.deck}</p>
          </article>

          <ul className="lg:col-span-7">
            {rest.slice(0, 5).map((story) => {
              const href = `/${locale}/${story.categorySlug}/${story.slug}`
              return (
                <li key={story.id} className="border-b border-line last:border-b-0">
                  <Link href={href} className="grid gap-3 py-3.5 sm:grid-cols-[5.5rem_1fr] sm:items-start">
                    {story.hero ? (
                      <span className="relative hidden aspect-[4/3] overflow-hidden sm:block">
                        <Image src={story.hero.url} alt={story.hero.alt} fill sizes="88px" className="object-cover" />
                      </span>
                    ) : (
                      <span className="hidden sm:block" />
                    )}
                    <span>
                      <span className="font-[family-name:var(--font-display)] text-[1.05rem] leading-snug tracking-[-0.02em] text-ink">
                        {story.title}
                      </span>
                      <span className="mt-1 block text-xs text-stone">
                        {relativeTime(story.publishedAt, locale)}
                      </span>
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

export function DualSignalRail({
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
    <section className="border-b border-line bg-paper-elevated/60">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-8 md:px-6 lg:grid-cols-2 lg:gap-12 lg:py-10">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl md:text-2xl">{dict.trending}</h2>
          {!trendingLive ? <p className="mt-1.5 text-xs text-stone">{dict.coldStart}</p> : null}
          <ol className="mt-4">
            {trending.map((story, i) => (
              <li key={story.id} className="grid grid-cols-[1.75rem_1fr] gap-2 border-b border-line py-3 last:border-b-0">
                <span className="text-sm font-medium text-accent">{i + 1}</span>
                <Link
                  href={`/${locale}/${story.categorySlug}/${story.slug}`}
                  className="text-[0.98rem] leading-snug hover:text-accent"
                >
                  {story.title}
                </Link>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl md:text-2xl">{dict.mostRead}</h2>
          {!mostReadLive ? <p className="mt-1.5 text-xs text-stone">{dict.coldStart}</p> : null}
          <ol className="mt-4">
            {mostRead.map((story, i) => (
              <li key={story.id} className="grid grid-cols-[1.75rem_1fr] gap-2 border-b border-line py-3 last:border-b-0">
                <span className="text-sm font-medium text-stone">{i + 1}</span>
                <Link
                  href={`/${locale}/${story.categorySlug}/${story.slug}`}
                  className="text-[0.98rem] leading-snug hover:text-accent"
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

export function OpinionStack({
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
      <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6 md:py-10">
        <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-[-0.03em]">
          {dict.opinion}
        </h2>
        <div className="mt-5 grid gap-6 md:grid-cols-3">
          {stories.map((story) => (
            <blockquote key={story.id} className="border-t border-line pt-4">
              <p className="font-[family-name:var(--font-display)] text-lg leading-snug tracking-[-0.02em]">
                <Link href={`/${locale}/${story.categorySlug}/${story.slug}`} className="hover:text-accent">
                  {story.title}
                </Link>
              </p>
              <footer className="mt-3 text-xs text-stone">{story.authorNames.join(', ')}</footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}

export function StoryLink({
  locale,
  story,
  dict,
}: {
  locale: AppLocale
  story: StoryCard
  dict?: Dictionary
}) {
  const href = `/${locale}/${story.categorySlug}/${story.slug}`
  return (
    <article className="grid gap-3 border-t border-line py-4 sm:grid-cols-[120px_1fr] sm:gap-4">
      {story.hero ? (
        <Link href={href} className="relative aspect-[4/3] overflow-hidden sm:aspect-square">
          <Image src={story.hero.url} alt={story.hero.alt} fill sizes="120px" className="object-cover" />
        </Link>
      ) : (
        <div className="hidden sm:block" />
      )}
      <div className="flex flex-col gap-1.5">
        <h2 className="font-[family-name:var(--font-display)] text-lg leading-snug md:text-xl">
          <Link href={href}>{story.title}</Link>
        </h2>
        <p className="line-clamp-2 max-w-[65ch] text-sm leading-relaxed text-stone">{story.deck}</p>
        <p className="text-xs text-stone">
          {story.authorNames.join(', ')}
          <span className="mx-2 text-line">/</span>
          {story.readTimeMinutes} {dict?.minutesRead ?? 'min'}
        </p>
      </div>
    </article>
  )
}

export function StoryRail({
  title,
  stories,
  locale,
  note,
  dict,
}: {
  title: string
  stories: StoryCard[]
  locale: AppLocale
  note?: string
  dict?: Dictionary
}) {
  if (!stories.length) return null
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-10 md:px-6">
      <h2 className="font-[family-name:var(--font-display)] text-2xl">{title}</h2>
      {note ? <p className="mt-2 text-sm text-stone">{note}</p> : null}
      <div className="mt-4">
        {stories.map((s) => (
          <StoryLink key={s.id} locale={locale} story={s} dict={dict} />
        ))}
      </div>
    </section>
  )
}

export function EditorsPicks({
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
      <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6 md:py-10">
        <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-[-0.03em]">
          {dict.editorsPicks}
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {stories.map((story) => {
            const href = `/${locale}/${story.categorySlug}/${story.slug}`
            return (
              <article key={story.id} className="border-t border-line pt-4">
                <Link href={href} className="relative mb-3 block aspect-[16/10] overflow-hidden">
                  {story.hero ? (
                    <Image
                      src={story.hero.url}
                      alt={story.hero.alt}
                      fill
                      sizes="(max-width:768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-line" />
                  )}
                </Link>
                <h3 className="font-[family-name:var(--font-display)] text-lg leading-snug tracking-[-0.02em]">
                  <Link href={href}>{story.title}</Link>
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-stone">{story.deck}</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function VisualStrip({
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
      <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6 md:py-10">
        <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-[-0.03em]">{dict.visual}</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3 md:gap-4">
          {stories.slice(0, 3).map((story, i) => {
            const href = `/${locale}/${story.categorySlug}/${story.slug}`
            return (
              <Link
                key={story.id}
                href={href}
                className={`group relative overflow-hidden ${
                  i === 0 ? 'min-h-[240px] md:col-span-2 md:row-span-2 md:min-h-[440px]' : 'min-h-[200px]'
                }`}
              >
                {story.hero ? (
                  <Image
                    src={story.hero.url}
                    alt={story.hero.alt}
                    fill
                    sizes={i === 0 ? '(max-width:768px) 100vw, 66vw' : '(max-width:768px) 100vw, 33vw'}
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                  <p className="font-[family-name:var(--font-display)] text-lg leading-snug text-paper md:text-xl">
                    {story.title}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function FixtureBanner({ dict, show }: { dict: Dictionary; show: boolean }) {
  if (!show) return null
  return (
    <div className="border-b border-line bg-paper-elevated px-4 py-2 text-center text-xs text-stone">
      {dict.fixtureBanner}
    </div>
  )
}

/** @deprecated Prefer LeadAndRail — kept for any residual imports */
export function LeadHero(props: {
  locale: AppLocale
  story: StoryCard
  dict: Dictionary
}) {
  return <LeadAndRail locale={props.locale} dict={props.dict} lead={props.story} side={[]} />
}

export function LatestList({
  locale,
  stories,
  dict,
}: {
  locale: AppLocale
  stories: StoryCard[]
  dict: Dictionary
}) {
  if (!stories.length) return null
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-8 md:px-6">
      <div className="flex items-end justify-between gap-4 border-b border-line pb-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">{dict.latest}</h2>
        <Link href={`/${locale}/latest`} className="text-xs text-accent hover:underline">
          {dict.seeAll}
        </Link>
      </div>
      <ul>
        {stories.map((story) => (
          <li key={story.id} className="border-b border-line">
            <Link
              href={`/${locale}/${story.categorySlug}/${story.slug}`}
              className="grid gap-1 py-3.5 md:grid-cols-[6.5rem_1fr] md:items-baseline md:gap-6"
            >
              <time className="text-xs text-stone">{relativeTime(story.publishedAt, locale)}</time>
              <span className="font-[family-name:var(--font-display)] text-lg leading-snug">
                {story.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

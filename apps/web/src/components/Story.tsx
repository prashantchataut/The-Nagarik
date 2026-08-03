import Image from 'next/image'
import Link from 'next/link'
import type { StoryCard } from '@thenagarik/content'
import type { AppLocale, Dictionary } from '@/lib/i18n'

function relativeTime(iso: string | undefined, locale: AppLocale): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const hours = Math.max(1, Math.round(diff / 3600_000))
  if (locale === 'ne') {
    if (hours < 24) return `${hours} घण्टा अगाडि`
    return `${Math.round(hours / 24)} दिन अगाडि`
  }
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export function LeadHero({
  locale,
  story,
  dict,
}: {
  locale: AppLocale
  story: StoryCard
  dict: Dictionary
}) {
  const href = `/${locale}/${story.categorySlug}/${story.slug}`
  return (
    <section className="relative min-h-[100dvh] overflow-hidden border-b border-line">
      {/*
        THESIS: One lead owns the first viewport like a front page after rain.
        OWN-WORLD: Mist paper + ink type + alpine teal + sharp photo edge.
        STORY: Brand in masthead, then one headline, one dek, one CTA, one photo plane.
        FIRST VIEWPORT: Asymmetric split, image full-bleed to the right edge.
        FORM: Asymmetric split hero, variance 8 / motion 3 / density 3.
      */}
      <div className="mx-auto grid min-h-[100dvh] max-w-[1400px] lg:grid-cols-12">
        <div className="relative z-10 flex flex-col justify-center px-4 pb-12 pt-8 md:px-6 lg:col-span-5 lg:pb-20 lg:pt-10">
          {story.isBreaking ? (
            <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-accent">
              {dict.breaking}
            </p>
          ) : null}
          <h1 className="font-[family-name:var(--font-display)] text-[2.35rem] leading-[1.18] tracking-[-0.03em] text-ink md:text-5xl lg:text-[3.35rem]">
            <Link href={href} className="hover:text-ink">
              {story.title}
            </Link>
          </h1>
          <p className="mt-5 max-w-[34ch] text-base leading-relaxed text-stone md:text-lg">{story.deck}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href={href}
              className="rounded-[var(--radius-control)] bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg transition-transform active:scale-[0.98]"
            >
              {dict.readMore}
            </Link>
            <p className="text-sm text-stone">
              {story.authorNames[0]}
              <span className="mx-2 text-line">/</span>
              {story.readTimeMinutes} {dict.minutesRead}
            </p>
          </div>
        </div>

        <div className="relative min-h-[48vh] lg:col-span-7 lg:min-h-full">
          {story.hero ? (
            <Image
              src={story.hero.url}
              alt={story.hero.alt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-line" />
          )}
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-paper to-transparent lg:block" />
        </div>
      </div>
    </section>
  )
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
    <section className="mx-auto max-w-[1400px] px-4 py-16 md:px-6 md:py-20">
      <div className="flex items-end justify-between gap-4 border-b border-line pb-4">
        <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.03em] md:text-4xl">
          {dict.latest}
        </h2>
        <Link href={`/${locale}/latest`} className="text-sm text-accent hover:underline">
          {dict.readMore}
        </Link>
      </div>
      <ul className="mt-2">
        {stories.map((story) => {
          const href = `/${locale}/${story.categorySlug}/${story.slug}`
          return (
            <li key={story.id} className="border-b border-line">
              <Link href={href} className="group grid gap-2 py-5 md:grid-cols-[7rem_1fr_auto] md:items-baseline md:gap-8">
                <time className="text-xs uppercase tracking-[0.08em] text-stone">
                  {relativeTime(story.publishedAt, locale)}
                </time>
                <span className="font-[family-name:var(--font-display)] text-xl leading-snug tracking-[-0.02em] text-ink transition-colors group-hover:text-accent md:text-2xl">
                  {story.title}
                </span>
                <span className="hidden text-sm text-stone md:inline">{story.categorySlug}</span>
              </Link>
            </li>
          )
        })}
      </ul>
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
    <section className="border-y border-line bg-paper-elevated/70">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-16 md:px-6 lg:grid-cols-2 lg:gap-16 lg:py-20">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl">{dict.trending}</h2>
          {!trendingLive ? <p className="mt-2 text-sm text-stone">{dict.coldStart}</p> : null}
          <ol className="mt-6 space-y-5">
            {trending.map((story, i) => (
              <li key={story.id} className="grid grid-cols-[2.5rem_1fr] gap-3">
                <span className="font-[family-name:var(--font-display)] text-2xl text-accent">{String(i + 1).padStart(2, '0')}</span>
                <Link
                  href={`/${locale}/${story.categorySlug}/${story.slug}`}
                  className="text-lg leading-snug tracking-[-0.02em] hover:text-accent md:text-xl"
                >
                  {story.title}
                </Link>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl">{dict.mostRead}</h2>
          {!mostReadLive ? <p className="mt-2 text-sm text-stone">{dict.coldStart}</p> : null}
          <ol className="mt-6 space-y-5">
            {mostRead.map((story, i) => (
              <li key={story.id} className="grid grid-cols-[2.5rem_1fr] gap-3">
                <span className="font-[family-name:var(--font-display)] text-2xl text-stone">{String(i + 1).padStart(2, '0')}</span>
                <Link
                  href={`/${locale}/${story.categorySlug}/${story.slug}`}
                  className="text-lg leading-snug tracking-[-0.02em] hover:text-accent md:text-xl"
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

export function ProvinceFeature({
  locale,
  dict,
  story,
}: {
  locale: AppLocale
  dict: Dictionary
  story: StoryCard | undefined
}) {
  if (!story) return null
  const href = `/${locale}/${story.categorySlug}/${story.slug}`
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-16 md:px-6 md:py-24">
      <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.03em] md:text-4xl">
        {dict.provinces}
      </h2>
      <article className="mt-8 grid gap-6 lg:grid-cols-12 lg:gap-10">
        <div className="relative aspect-[16/10] overflow-hidden lg:col-span-7 lg:aspect-auto lg:min-h-[420px]">
          {story.hero ? (
            <Image src={story.hero.url} alt={story.hero.alt} fill sizes="(max-width:1024px) 100vw, 58vw" className="object-cover" />
          ) : null}
        </div>
        <div className="flex flex-col justify-center lg:col-span-5">
          <p className="text-sm uppercase tracking-[0.12em] text-stone">{story.categorySlug}</p>
          <h3 className="mt-3 font-[family-name:var(--font-display)] text-3xl leading-[1.2] tracking-[-0.03em] md:text-4xl">
            <Link href={href}>{story.title}</Link>
          </h3>
          <p className="mt-4 max-w-[42ch] text-base leading-relaxed text-stone">{story.deck}</p>
          <Link href={href} className="mt-6 text-sm font-medium text-accent hover:underline">
            {dict.readMore}
          </Link>
        </div>
      </article>
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
    <section className="border-y border-line bg-paper-elevated/80">
      <div className="mx-auto max-w-[900px] px-4 py-16 md:px-6 md:py-24">
        <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.03em] text-ink md:text-4xl">
          {dict.opinion}
        </h2>
        <div className="mt-10 space-y-10">
          {stories.map((story) => (
            <blockquote key={story.id} className="border-t border-line pt-8">
              <p className="font-[family-name:var(--font-display)] text-2xl leading-[1.35] tracking-[-0.02em] text-ink md:text-3xl">
                <Link href={`/${locale}/${story.categorySlug}/${story.slug}`} className="hover:text-accent">
                  {story.title}
                </Link>
              </p>
              <footer className="mt-4 text-sm text-stone">{story.authorNames.join(', ')}</footer>
            </blockquote>
          ))}
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
  if (!stories.length) return null
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-16 md:px-6 md:py-24">
      <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.03em] md:text-4xl">
        {dict.visual}
      </h2>
      <div className="mt-8 grid gap-3 md:grid-cols-3 md:gap-4">
        {stories.map((story, i) => {
          const href = `/${locale}/${story.categorySlug}/${story.slug}`
          return (
            <Link
              key={story.id}
              href={href}
              className={`group relative overflow-hidden ${i === 0 ? 'md:col-span-2 md:row-span-2 min-h-[280px] md:min-h-[520px]' : 'min-h-[220px]'}`}
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
              <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
                <p className="font-[family-name:var(--font-display)] text-lg leading-snug text-paper md:text-2xl">
                  {story.title}
                </p>
              </div>
            </Link>
          )
        })}
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
    <article className="grid gap-3 border-t border-line py-5 sm:grid-cols-[140px_1fr] sm:gap-5">
      {story.hero ? (
        <Link href={href} className="relative aspect-[4/3] overflow-hidden sm:aspect-square">
          <Image src={story.hero.url} alt={story.hero.alt} fill sizes="140px" className="object-cover" />
        </Link>
      ) : (
        <div className="hidden sm:block" />
      )}
      <div className="flex flex-col gap-2">
        <h2 className="font-[family-name:var(--font-display)] text-xl leading-snug md:text-2xl">
          <Link href={href}>{story.title}</Link>
        </h2>
        <p className="max-w-[65ch] text-sm leading-relaxed text-stone">{story.deck}</p>
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
    <section className="mx-auto max-w-[1400px] px-4 py-14 md:px-6">
      <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl">{title}</h2>
      {note ? <p className="mt-2 text-sm text-stone">{note}</p> : null}
      <div className="mt-6">
        {stories.map((s) => (
          <StoryLink key={s.id} locale={locale} story={s} dict={dict} />
        ))}
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

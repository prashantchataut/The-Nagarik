import Image from 'next/image'
import Link from 'next/link'
import type { StoryCard } from '@thenagarik/content'
import type { AppLocale, Dictionary } from '@/lib/i18n'

export function StoryLink({
  locale,
  story,
  priority = false,
  featured = false,
}: {
  locale: AppLocale
  story: StoryCard
  priority?: boolean
  featured?: boolean
}) {
  const href = `/${locale}/${story.categorySlug}/${story.slug}`
  if (featured) {
    return (
      <article className="grid gap-6 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5 flex flex-col justify-center gap-4 pt-6 lg:pt-10">
          {story.isBreaking ? (
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Breaking</p>
          ) : null}
          <h1 className="font-[family-name:var(--font-display)] text-4xl leading-[1.15] tracking-tight md:text-5xl lg:text-6xl">
            <Link href={href}>{story.title}</Link>
          </h1>
          <p className="max-w-[36ch] text-base leading-relaxed text-stone md:text-lg">{story.deck}</p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-stone">
            <span>{story.authorNames.join(', ')}</span>
            <span>
              {story.readTimeMinutes} min
            </span>
            <Link
              href={href}
              className="rounded-[var(--radius-control)] bg-accent px-4 py-2 font-medium text-accent-fg active:scale-[0.98]"
            >
              Read
            </Link>
          </div>
        </div>
        <div className="relative min-h-[280px] overflow-hidden lg:col-span-7 lg:min-h-[min(72dvh,720px)]">
          {story.hero ? (
            <Image
              src={story.hero.url}
              alt={story.hero.alt}
              fill
              priority={priority}
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-line" />
          )}
        </div>
      </article>
    )
  }

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
          {story.authorNames.join(', ')} · {story.readTimeMinutes} min
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
}: {
  title: string
  stories: StoryCard[]
  locale: AppLocale
  note?: string
}) {
  if (!stories.length) return null
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-14 md:px-6">
      <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl">{title}</h2>
      {note ? <p className="mt-2 text-sm text-stone">{note}</p> : null}
      <div className="mt-6">
        {stories.map((s) => (
          <StoryLink key={s.id} locale={locale} story={s} />
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

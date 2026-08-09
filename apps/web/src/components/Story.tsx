import Image from 'next/image'
import Link from 'next/link'
import type { StoryCard } from '@thenagarik/content'
import type { AppLocale, Dictionary } from '@/lib/i18n'
import { RelativeTime } from '@/components/RelativeTime'

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
    <article className={`py-4 ${story.hero ? 'grid gap-4 sm:grid-cols-[132px_minmax(0,1fr)]' : ''}`}>
      {story.hero ? (
        <Link href={href} className="relative aspect-[4/3] overflow-hidden bg-paper-elevated">
          <Image src={story.hero.url} alt={story.hero.alt} fill sizes="132px" className="object-cover" />
        </Link>
      ) : null}
      <div className="min-w-0 self-center">
        <h2 className="text-lg font-bold leading-[1.5] tracking-[-0.015em] text-ink md:text-xl">
          <Link href={href} className="hover:text-accent">{story.title}</Link>
        </h2>
        {story.deck ? (
          <p className="mt-1.5 line-clamp-2 max-w-[68ch] text-sm leading-6 text-stone">{story.deck}</p>
        ) : null}
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone">
          {story.authorNames.length ? <span>{story.authorNames.join(', ')}</span> : null}
          {story.authorNames.length && story.publishedAt ? <span aria-hidden="true">·</span> : null}
          {story.publishedAt ? <RelativeTime iso={story.publishedAt} locale={locale} /> : null}
          <span aria-hidden="true">·</span>
          <span>{story.readTimeMinutes} {dict?.minutesRead ?? 'min'}</span>
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
    <section className="mx-auto max-w-[1240px] px-4 py-8 md:px-6 md:py-10">
      <div className="border-b border-line pb-3">
        <h2 className="text-2xl font-bold tracking-[-0.025em] text-ink">{title}</h2>
        {note ? <p className="mt-2 text-sm leading-relaxed text-stone">{note}</p> : null}
      </div>
      <div className="divide-y divide-line">
        {stories.map((story) => (
          <StoryLink key={story.id} locale={locale} story={story} dict={dict} />
        ))}
      </div>
    </section>
  )
}

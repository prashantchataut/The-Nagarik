'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { StoryCard as StoryCardType } from '@thenagarik/content'
import type { AppLocale, Dictionary } from '@/lib/i18n'
import { RelativeTime } from '@/components/RelativeTime'
import { CategoryIcon } from '@/components/CategoryIcon'

export function StoryCard({
  story,
  locale,
  dict,
  aspect = 'card',
  size = 'md',
  showDeck = true,
}: {
  story: StoryCardType
  locale: AppLocale
  dict?: Dictionary
  aspect?: 'hero' | 'card' | 'thumb' | 'square'
  size?: 'sm' | 'md' | 'lg'
  showDeck?: boolean
}) {
  const href = `/${locale}/${story.categorySlug}/${story.slug}`

  const aspectClass =
    aspect === 'hero'
      ? 'aspect-[16/9]'
      : aspect === 'card'
        ? 'aspect-[16/10]'
        : aspect === 'square'
          ? 'aspect-[1/1]'
          : 'aspect-[4/3]'

  const titleClass =
    size === 'lg'
      ? 'text-xl font-bold leading-[1.3] md:text-2xl'
      : size === 'sm'
        ? 'text-sm font-bold leading-snug'
        : 'text-base font-bold leading-snug'

  return (
    <article className="surface-card flex flex-col justify-between overflow-hidden group">
      {story.hero ? (
        <Link href={href} className={`editorial-image relative block ${aspectClass} w-full`}>
          <Image
            src={story.hero.url}
            alt={story.hero.alt || story.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
          {story.isBreaking ? (
            <span className="absolute left-2 top-2 rounded-[var(--radius-control)] bg-danger px-2 py-0.5 text-[0.65rem] font-extrabold text-danger-fg">
              {dict?.breaking ?? 'Breaking'}
            </span>
          ) : null}
        </Link>
      ) : null}

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-accent">
            <CategoryIcon slug={story.categorySlug} size={12} weight="bold" />
            <span className="capitalize">{story.categorySlug}</span>
          </div>

          <h3 className={`mt-2 ${titleClass} tracking-[-0.015em] text-ink group-hover:text-accent transition-colors`}>
            <Link href={href}>{story.title}</Link>
          </h3>

          {showDeck && story.deck ? (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-stone">
              {story.deck}
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-2 text-[0.72rem] font-semibold text-stone">
          <span>{story.authorNames.join(', ') || 'द नागरिक'}</span>
          <RelativeTime iso={story.publishedAt} locale={locale} />
        </div>
      </div>
    </article>
  )
}

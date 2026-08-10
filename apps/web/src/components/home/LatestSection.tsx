'use client'

import Image from 'next/image'
import Link from 'next/link'
import { CaretRight, Lightning } from '@phosphor-icons/react'
import type { StoryCard } from '@thenagarik/content'
import type { AppLocale, Dictionary } from '@/lib/i18n'
import { RelativeTime } from '@/components/RelativeTime'
import { CategoryIcon } from '@/components/CategoryIcon'

export function LatestSection({
  locale,
  dict,
  stories,
  title,
  variant = 'cards',
}: {
  locale: AppLocale
  dict: Dictionary
  stories: StoryCard[]
  title?: string
  variant?: 'cards' | 'list'
}) {
  if (!stories.length) return null
  const displayTitle = title ?? dict.latestUpdates
  const displayStories = stories.slice(0, 4)

  return (
    <section className="border-b border-line bg-paper py-7 md:py-9" aria-label={displayTitle}>
      <div className="mx-auto max-w-[1280px] px-4 md:px-6">
        {/* Section Header */}
        <div className="mb-6 flex items-center justify-between border-b-2 border-accent pb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-fg">
              <Lightning size={16} weight="fill" />
            </span>
            <h2 className="text-xl font-black tracking-tight text-ink md:text-2xl">
              {displayTitle}
            </h2>
          </div>

          <Link
            href={`/${locale}/latest`}
            className="inline-flex items-center gap-0.5 text-xs font-bold text-accent hover:underline"
          >
            <span>{dict.seeAll}</span>
            <CaretRight size={12} weight="bold" />
          </Link>
        </div>

        {variant === 'cards' ? (
          /* 4-column Card Grid */
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {displayStories.map((story) => {
              const href = `/${locale}/${story.categorySlug}/${story.slug}`
              return (
                <article
                  key={story.id}
                  className="surface-card flex flex-col justify-between overflow-hidden group"
                >
                  {story.hero ? (
                    <Link
                      href={href}
                      className="editorial-image relative block aspect-[16/10] w-full"
                    >
                      <Image
                        src={story.hero.url}
                        alt={story.hero.alt || story.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
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
                        <Link href={href}>{story.title}</Link>
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
              )
            })}
          </div>
        ) : (
          /* 2-column Row List */
          <div className="grid gap-4 md:grid-cols-2">
            {displayStories.map((story) => {
              const href = `/${locale}/${story.categorySlug}/${story.slug}`
              return (
                <article
                  key={story.id}
                  className="surface-card grid grid-cols-[1fr_7.5rem] gap-3 p-3.5 sm:grid-cols-[1fr_8.5rem] group"
                >
                  <div className="flex flex-col justify-between min-w-0">
                    <div>
                      <span className="text-[0.72rem] font-bold uppercase text-accent">
                        {story.categorySlug}
                      </span>
                      <h3 className="mt-1 text-sm font-bold leading-snug tracking-[-0.012em] text-ink group-hover:text-accent transition-colors">
                        <Link href={href}>{story.title}</Link>
                      </h3>
                    </div>
                    <p className="mt-2 text-[0.72rem] font-medium text-stone">
                      <RelativeTime iso={story.publishedAt} locale={locale} />
                    </p>
                  </div>
                  {story.hero ? (
                    <Link
                      href={href}
                      className="editorial-image relative aspect-[4/3] rounded-[var(--radius-sm)] overflow-hidden"
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
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

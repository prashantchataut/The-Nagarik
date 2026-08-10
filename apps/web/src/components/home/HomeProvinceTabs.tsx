'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CaretRight, MapTrifold } from '@phosphor-icons/react'
import type { StoryCard } from '@thenagarik/content'
import type { AppLocale, Dictionary } from '@/lib/i18n'
import { RelativeTime } from '@/components/RelativeTime'

export type ProvinceGroup = {
  id: string
  label: string
  stories: StoryCard[]
}

export function HomeProvinceTabs({
  locale,
  title,
  seeAll,
  groups,
  dict,
}: {
  locale: AppLocale
  title: string
  seeAll: string
  groups: ProvinceGroup[]
  dict?: Dictionary
}) {
  const [selected, setSelected] = useState(groups[0]?.id ?? 'koshi')
  if (!groups.length) return null

  const activeGroup = groups.find((g) => g.id === selected) ?? groups[0]

  return (
    <section className="border-b border-line bg-paper-alt py-8 md:py-10" aria-label={title}>
      <div className="mx-auto max-w-[1280px] px-4 md:px-6">
        {/* Section Header */}
        <div className="mb-6 flex items-center justify-between border-b-2 border-accent pb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-fg">
              <MapTrifold size={16} weight="fill" />
            </span>
            <h2 className="text-xl font-black tracking-tight text-ink md:text-2xl">
              {title}
            </h2>
          </div>

          <Link
            href={`/${locale}/pradesh`}
            className="inline-flex items-center gap-0.5 text-xs font-bold text-accent hover:underline"
          >
            <span>{seeAll}</span>
            <CaretRight size={12} weight="bold" />
          </Link>
        </div>

        {/* Province Filter Tabs */}
        <div className="nav-scroller flex gap-2 overflow-x-auto pb-4">
          {groups.map((group) => {
            const isActive = group.id === selected
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setSelected(group.id)}
                className={`inline-flex shrink-0 items-center rounded-full px-4 py-1.5 text-xs font-extrabold transition-colors ${
                  isActive
                    ? 'accent-solid shadow-sm'
                    : 'bg-paper text-ink border border-line hover:border-accent hover:text-accent'
                }`}
                aria-pressed={isActive}
              >
                {group.label}
              </button>
            )
          })}
        </div>

        {/* Stories Grid */}
        {activeGroup.stories.length ? (
          <div className="mt-2 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activeGroup.stories.slice(0, 3).map((story) => (
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
                    <span>{story.authorNames.join(', ') || (dict?.siteName ?? 'द नागरिक')}</span>
                    <RelativeTime iso={story.publishedAt} locale={locale} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--radius-panel)] border border-line bg-paper p-8 text-center">
            <p className="text-sm text-stone">
              {locale === 'ne'
                ? 'यस प्रदेशमा हाल कुनै समाचार प्रकाशित छैन।'
                : 'No published stories for this province yet.'}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

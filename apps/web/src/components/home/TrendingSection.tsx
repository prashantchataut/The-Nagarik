'use client'

import Image from 'next/image'
import Link from 'next/link'
import { CaretRight, Flame } from '@phosphor-icons/react'
import type { StoryCard } from '@thenagarik/content'
import type { AppLocale, Dictionary } from '@/lib/i18n'
import { categoryName } from '@/lib/category-names'
import { RelativeTime } from '@/components/RelativeTime'

const NEP_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']
function toNepDigit(n: number): string {
  return String(n)
    .split('')
    .map((d) => NEP_DIGITS[parseInt(d, 10)] ?? d)
    .join('')
}

export function TrendingSection({
  locale,
  dict,
  stories,
  title,
}: {
  locale: AppLocale
  dict: Dictionary
  stories: StoryCard[]
  title?: string
}) {
  if (!stories.length) return null
  const displayTitle = title ?? dict.trending
  const topStories = stories.slice(0, 5)

  return (
    <section className="border-b border-line bg-paper-elevated py-7 md:py-9" aria-label={displayTitle}>
      <div className="mx-auto max-w-[1280px] px-4 md:px-6">
        {/* Section Header */}
        <div className="mb-6 flex items-center justify-between border-b-2 border-accent pb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-fg">
              <Flame size={16} weight="fill" />
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

        {/* 5-item Responsive Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {topStories.map((story, index) => {
            const rank = index + 1
            const numStr = locale === 'ne' ? toNepDigit(rank) : String(rank)
            const href = `/${locale}/${story.categorySlug}/${story.slug}`

            return (
              <article
                key={story.id}
                className="surface-card flex flex-col justify-between p-3.5 group relative"
              >
                <div>
                  {/* Thumbnail with Rank Badge */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-control)] bg-paper-strong">
                    {story.hero ? (
                      <Image
                        src={story.hero.url}
                        alt={story.hero.alt || story.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : null}

                    {/* Rank Number Overlay */}
                    <div className="absolute left-2 top-2">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black shadow-md ${
                          rank <= 3
                            ? 'bg-accent text-accent-fg'
                            : 'bg-paper text-ink border border-line'
                        }`}
                      >
                        {numStr}
                      </span>
                    </div>

                    {rank <= 2 ? (
                      <div className="absolute right-2 top-2">
                        <span className="rounded-full bg-danger px-2 py-0.5 text-[0.65rem] font-black text-danger-fg">
                          {dict.hot}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {/* Title */}
                  <h3 className="mt-3 text-[0.95rem] font-bold leading-snug tracking-[-0.015em] text-ink group-hover:text-accent transition-colors">
                    <Link href={href}>{story.title}</Link>
                  </h3>
                </div>

                {/* Footer meta */}
                <div className="mt-3 flex items-center justify-between text-[0.72rem] font-semibold text-stone border-t border-line/60 pt-2">
                  <span className="text-accent font-bold">
                    {categoryName(story.categorySlug, locale)}
                  </span>
                  <RelativeTime iso={story.publishedAt} locale={locale} />
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

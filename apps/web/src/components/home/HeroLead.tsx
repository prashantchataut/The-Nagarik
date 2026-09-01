'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Clock, CaretRight } from '@phosphor-icons/react'
import type { StoryCard } from '@thenagarik/content'
import type { AppLocale, Dictionary } from '@/lib/i18n'
import { categoryName as localizedCategoryName } from '@/lib/category-names'
import { RelativeTime } from '@/components/RelativeTime'
import { CategoryIcon } from '@/components/CategoryIcon'

export function HeroLead({
  locale,
  dict,
  lead,
  sideUpdates = [],
  categoryName,
}: {
  locale: AppLocale
  dict: Dictionary
  lead: StoryCard
  sideUpdates?: StoryCard[]
  categoryName?: string
}) {
  if (!lead) return null
  const href = `/${locale}/${lead.categorySlug}/${lead.slug}`
  const catLabel = categoryName || lead.categorySlug

  return (
    <section className="border-b border-line bg-paper py-6 md:py-8" aria-label="Lead Story">
      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 md:px-6 lg:grid-cols-12 lg:gap-10">
        {/* Dominant Main Lead Story (8 cols) */}
        <article className="lg:col-span-8">
          {lead.hero ? (
            <Link
              href={href}
              className="editorial-image relative block aspect-[16/9] w-full rounded-[var(--radius-panel)] shadow-[0_8px_24px_rgb(16_32_29_/_0.08)]"
            >
              <Image
                src={lead.hero.url}
                alt={lead.hero.alt || lead.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 840px"
                className="object-cover"
              />
            </Link>
          ) : null}

          {/* Meta & Badges */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs font-extrabold">
            <Link
              href={`/${locale}/${lead.categorySlug}`}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] bg-accent-muted px-2.5 py-1 text-accent hover:bg-accent hover:text-accent-fg transition-colors"
            >
              <CategoryIcon slug={lead.categorySlug} size={14} weight="bold" />
              <span>{catLabel}</span>
            </Link>

            {lead.isBreaking ? (
              <span className="inline-flex items-center gap-1 rounded-[var(--radius-control)] bg-danger px-2.5 py-1 text-danger-fg animate-pulse">
                {dict.breaking}
              </span>
            ) : null}
          </div>

          {/* Main Headline */}
          <h1 className="mt-3 text-3xl font-black leading-[1.26] tracking-[-0.035em] text-ink sm:text-4xl md:text-[2.65rem] lg:text-[3rem]">
            <Link href={href} className="hover:text-accent transition-colors">
              {lead.title}
            </Link>
          </h1>

          {/* Deck */}
          {lead.deck ? (
            <p className="mt-3 max-w-[68ch] text-base font-medium leading-relaxed text-stone md:text-lg">
              {lead.deck}
            </p>
          ) : null}

          {/* Byline & Timestamp */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-stone">
            {lead.authorNames.length ? (
              <span className="font-bold text-ink">
                {lead.authorNames.join(', ')}
              </span>
            ) : (
              <span className="font-bold text-ink">{dict.siteName}</span>
            )}
            <span className="h-3 w-px bg-line" aria-hidden="true" />
            <div className="inline-flex items-center gap-1">
              <Clock size={13} weight="bold" aria-hidden="true" />
              <span>
                {lead.readTimeMinutes} {dict.minutesRead}
              </span>
            </div>
            <span className="h-3 w-px bg-line" aria-hidden="true" />
            <RelativeTime iso={lead.publishedAt} locale={locale} />
          </div>
        </article>

        {/* Side Updates Column (4 cols) */}
        <aside className="border-t border-line pt-6 lg:col-span-4 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <div className="flex items-center justify-between border-b-2 border-accent pb-2">
            <h2 className="text-base font-black tracking-tight text-ink">
              {dict.latestUpdates}
            </h2>
            <Link
              href={`/${locale}/latest`}
              className="inline-flex items-center gap-0.5 text-xs font-bold text-accent hover:underline"
            >
              <span>{dict.seeAll}</span>
              <CaretRight size={12} weight="bold" />
            </Link>
          </div>

          {/* Side Updates: thumbnail rows for visual weight balance with the hero */}
          <div className="divide-y divide-line">
            {sideUpdates.slice(0, 4).map((story) => (
              <article key={story.id} className="flex gap-3 py-3.5 first:pt-3 last:pb-0 group">
                {story.hero ? (
                  <Link
                    href={`/${locale}/${story.categorySlug}/${story.slug}`}
                    className="editorial-image relative aspect-[4/3] w-[4.5rem] shrink-0 rounded-[var(--radius-sm)]"
                  >
                    <Image
                      src={story.hero.url}
                      alt={story.hero.alt || story.title}
                      fill
                      sizes="72px"
                      className="object-cover"
                    />
                  </Link>
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[0.72rem] font-bold text-stone">
                    <span className="text-accent">{localizedCategoryName(story.categorySlug, locale)}</span>
                    <span>·</span>
                    <RelativeTime iso={story.publishedAt} locale={locale} />
                  </div>
                  <h3 className="mt-1 line-clamp-2 text-[0.95rem] font-bold leading-snug tracking-[-0.015em] text-ink group-hover:text-accent transition-colors">
                    <Link href={`/${locale}/${story.categorySlug}/${story.slug}`}>
                      {story.title}
                    </Link>
                  </h3>
                </div>
              </article>
            ))}
          </div>

          {/* Quick Category Jump Pill Bar */}
          <div className="mt-6 rounded-[var(--radius-panel)] bg-paper-elevated p-4 border border-line">
            <p className="text-xs font-bold uppercase tracking-wider text-stone mb-2.5">
              {dict.categories}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {['samachar', 'rajniti', 'arth', 'pradesh', 'khel', 'pravas'].map((cat) => (
                <Link
                  key={cat}
                  href={`/${locale}/${cat}`}
                  className="inline-flex items-center gap-1 rounded-full bg-paper px-2.5 py-1 text-xs font-semibold text-ink border border-line hover:border-accent hover:text-accent transition-colors"
                >
                  <CategoryIcon slug={cat} size={12} weight="bold" />
                  <span>{localizedCategoryName(cat, locale)}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

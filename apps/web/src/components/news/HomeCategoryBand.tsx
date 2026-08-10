'use client'

import Image from 'next/image'
import Link from 'next/link'
import { CaretRight } from '@phosphor-icons/react'
import type { Category, StoryCard } from '@thenagarik/content'
import type { AppLocale, Dictionary } from '@/lib/i18n'
import { RelativeTime } from '@/components/RelativeTime'
import { CategoryIcon } from '@/components/CategoryIcon'
import { SectionBand } from '@/components/news/SectionBand'

export function HomeCategoryBand({
  locale,
  dict,
  category,
  stories,
  variant = 'feature-grid',
}: {
  locale: AppLocale
  dict: Dictionary
  category: Category
  stories: StoryCard[]
  variant?: 'feature-grid' | 'card-grid' | 'image-strip' | 'opinion' | 'dense'
}) {
  if (!stories.length) return null
  const title = locale === 'en' ? category.nameEn : category.nameNe
  const catHref = `/${locale}/${category.slug}`
  const [lead, second, third, fourth, fifth] = stories

  /* Variant 1: Feature Grid (Lead 7 cols + 4 side rows 5 cols) */
  if (variant === 'feature-grid') {
    return (
      <SectionBand title={title} href={catHref} seeAll={dict.seeAll}>
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Lead feature (7 cols) */}
          {lead ? (
            <article className="lg:col-span-7 group">
              {lead.hero ? (
                <Link
                  href={`/${locale}/${lead.categorySlug}/${lead.slug}`}
                  className="editorial-image relative block aspect-[16/9] w-full rounded-[var(--radius-panel)] shadow-[0_4px_16px_rgb(16_32_29_/_0.06)]"
                >
                  <Image
                    src={lead.hero.url}
                    alt={lead.hero.alt || lead.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 680px"
                    className="object-cover"
                  />
                </Link>
              ) : null}

              <div className="mt-4">
                <h3 className="text-2xl font-black leading-tight tracking-[-0.025em] text-ink group-hover:text-accent transition-colors md:text-[1.85rem]">
                  <Link href={`/${locale}/${lead.categorySlug}/${lead.slug}`}>
                    {lead.title}
                  </Link>
                </h3>
                {lead.deck ? (
                  <p className="mt-2.5 max-w-[62ch] text-sm leading-relaxed text-stone md:text-base">
                    {lead.deck}
                  </p>
                ) : null}
                <div className="mt-3 flex items-center gap-3 text-xs font-semibold text-stone">
                  <span className="font-bold text-ink">
                    {lead.authorNames.join(', ') || dict.siteName}
                  </span>
                  <span>·</span>
                  <RelativeTime iso={lead.publishedAt} locale={locale} />
                </div>
              </div>
            </article>
          ) : null}

          {/* Secondary stories list (5 cols) */}
          <div className="divide-y divide-line lg:col-span-5">
            {[second, third, fourth, fifth].filter(Boolean).map((story) => (
              <article
                key={story.id}
                className="grid grid-cols-[1fr_6.5rem] gap-3 py-3.5 first:pt-0 last:pb-0 sm:grid-cols-[1fr_8rem] group"
              >
                <div className="flex flex-col justify-between min-w-0 pr-1">
                  <h4 className="text-[0.95rem] font-bold leading-snug tracking-[-0.015em] text-ink group-hover:text-accent transition-colors">
                    <Link href={`/${locale}/${story.categorySlug}/${story.slug}`}>
                      {story.title}
                    </Link>
                  </h4>
                  <p className="mt-1.5 text-[0.72rem] font-medium text-stone">
                    <RelativeTime iso={story.publishedAt} locale={locale} />
                  </p>
                </div>

                {story.hero ? (
                  <Link
                    href={`/${locale}/${story.categorySlug}/${story.slug}`}
                    className="editorial-image relative aspect-[4/3] rounded-[var(--radius-sm)] overflow-hidden"
                  >
                    <Image
                      src={story.hero.url}
                      alt={story.hero.alt || story.title}
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </SectionBand>
    )
  }

  /* Variant 2: Card Grid (4 uniform cards) */
  if (variant === 'card-grid') {
    return (
      <SectionBand title={title} href={catHref} seeAll={dict.seeAll} className="bg-paper-elevated">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stories.slice(0, 4).map((story) => (
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
                    sizes="(max-width: 640px) 100vw, 25vw"
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
                  <span>{story.authorNames.join(', ') || dict.siteName}</span>
                  <RelativeTime iso={story.publishedAt} locale={locale} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </SectionBand>
    )
  }

  /* Variant 3: Image Strip (3-column photo-forward) */
  if (variant === 'image-strip') {
    return (
      <SectionBand title={title} href={catHref} seeAll={dict.seeAll}>
        <div className="grid gap-6 md:grid-cols-3">
          {stories.slice(0, 3).map((story) => (
            <article key={story.id} className="group">
              {story.hero ? (
                <Link
                  href={`/${locale}/${story.categorySlug}/${story.slug}`}
                  className="editorial-image relative block aspect-[16/10] rounded-[var(--radius-panel)] shadow-[0_4px_12px_rgb(16_32_29_/_0.06)]"
                >
                  <Image
                    src={story.hero.url}
                    alt={story.hero.alt || story.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </Link>
              ) : null}
              <h3 className="mt-3 text-lg font-bold leading-snug tracking-[-0.018em] text-ink group-hover:text-accent transition-colors md:text-xl">
                <Link href={`/${locale}/${story.categorySlug}/${story.slug}`}>
                  {story.title}
                </Link>
              </h3>
              {story.deck ? (
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-stone">
                  {story.deck}
                </p>
              ) : null}
              <p className="mt-2 text-xs font-semibold text-stone">
                <RelativeTime iso={story.publishedAt} locale={locale} />
              </p>
            </article>
          ))}
        </div>
      </SectionBand>
    )
  }

  /* Default dense variant */
  return (
    <SectionBand title={title} href={catHref} seeAll={dict.seeAll} className="bg-paper-elevated">
      <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
        {lead ? (
          <article className="lg:col-span-5 group">
            {lead.hero ? (
              <Link
                href={`/${locale}/${lead.categorySlug}/${lead.slug}`}
                className="editorial-image relative block aspect-[16/10] rounded-[var(--radius-panel)]"
              >
                <Image
                  src={lead.hero.url}
                  alt={lead.hero.alt || lead.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover"
                />
              </Link>
            ) : null}
            <h3 className="mt-3 text-xl font-bold leading-snug tracking-[-0.02em] text-ink group-hover:text-accent transition-colors md:text-2xl">
              <Link href={`/${locale}/${lead.categorySlug}/${lead.slug}`}>
                {lead.title}
              </Link>
            </h3>
            {lead.deck ? (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone">
                {lead.deck}
              </p>
            ) : null}
          </article>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
          {[second, third, fourth, fifth].filter(Boolean).map((story) => (
            <article key={story.id} className="surface-card overflow-hidden group">
              {story.hero ? (
                <Link
                  href={`/${locale}/${story.categorySlug}/${story.slug}`}
                  className="editorial-image relative block aspect-[16/9]"
                >
                  <Image
                    src={story.hero.url}
                    alt={story.hero.alt || story.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 28vw"
                    className="object-cover"
                  />
                </Link>
              ) : null}
              <div className="p-3.5">
                <h4 className="text-[0.98rem] font-bold leading-snug text-ink group-hover:text-accent transition-colors">
                  <Link href={`/${locale}/${story.categorySlug}/${story.slug}`}>
                    {story.title}
                  </Link>
                </h4>
                <p className="mt-2 text-xs text-stone">
                  <RelativeTime iso={story.publishedAt} locale={locale} />
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </SectionBand>
  )
}

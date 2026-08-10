'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Camera, ChatCircleDots } from '@phosphor-icons/react'
import type { StoryCard } from '@thenagarik/content'
import type { AppLocale, Dictionary } from '@/lib/i18n'
import { SectionBand } from '@/components/news/SectionBand'

const hrefFor = (locale: AppLocale, story: StoryCard) =>
  `/${locale}/${story.categorySlug}/${story.slug}`

export function HomeOpinion({
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
    <SectionBand
      title={dict.opinion}
      href={`/${locale}/bichar`}
      seeAll={dict.seeAll}
      className="bg-paper-alt"
    >
      <div className="grid gap-5 md:grid-cols-3">
        {stories.slice(0, 3).map((story) => (
          <article
            key={story.id}
            className="surface-card flex flex-col justify-between p-5 group"
          >
            <div>
              {/* Author badge */}
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-fg text-xs font-black">
                  <ChatCircleDots size={15} weight="bold" />
                </span>
                <span className="text-xs font-bold text-accent">
                  {story.authorNames.join(', ') || dict.authors}
                </span>
              </div>

              <h3 className="mt-3 text-lg font-bold leading-snug tracking-[-0.018em] text-ink group-hover:text-accent transition-colors">
                <Link href={hrefFor(locale, story)}>{story.title}</Link>
              </h3>

              {story.deck ? (
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-stone">
                  {story.deck}
                </p>
              ) : null}
            </div>

            <div className="mt-4 border-t border-line/60 pt-3">
              <Link
                href={hrefFor(locale, story)}
                className="text-xs font-bold text-accent hover:underline"
              >
                {dict.readMore} →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </SectionBand>
  )
}

export function HomeVisual({
  locale,
  dict,
  stories,
}: {
  locale: AppLocale
  dict: Dictionary
  stories: StoryCard[]
}) {
  const visual = stories.filter((story) => story.hero).slice(0, 4)
  if (visual.length < 2) return null
  const [feature, ...rest] = visual

  return (
    <section className="border-y border-nav bg-nav text-nav-fg py-8 md:py-12" aria-label={dict.visual}>
      <div className="mx-auto max-w-[1280px] px-4 md:px-6">
        <div className="mb-6 flex items-center justify-between border-b border-nav-fg/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-nav-accent text-nav font-black">
              <Camera size={16} weight="bold" />
            </span>
            <h2 className="text-2xl font-black tracking-tight">{dict.visual}</h2>
          </div>
          <span className="text-xs font-bold text-nav-accent">
            {locale === 'ne' ? 'फोटो फिचर' : 'Photo feature'}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Main Visual Feature */}
          <article className="lg:col-span-8 group">
            <Link
              href={hrefFor(locale, feature)}
              className="editorial-image relative block aspect-[16/9] w-full rounded-[var(--radius-panel)] overflow-hidden shadow-lg"
            >
              <Image
                src={feature.hero!.url}
                alt={feature.hero!.alt || feature.title}
                fill
                sizes="(max-width: 1024px) 100vw, 840px"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </Link>
            <h3 className="mt-3 text-xl font-bold leading-snug md:text-2xl">
              <Link href={hrefFor(locale, feature)} className="hover:text-nav-accent transition-colors">
                {feature.title}
              </Link>
            </h3>
          </article>

          {/* Secondary Visuals */}
          <div className="grid gap-4 sm:grid-cols-3 lg:col-span-4 lg:grid-cols-1">
            {rest.map((story) => (
              <article
                key={story.id}
                className="grid grid-cols-[6.5rem_1fr] gap-3 items-center group sm:block lg:grid lg:grid-cols-[7.5rem_1fr]"
              >
                <Link
                  href={hrefFor(locale, story)}
                  className="editorial-image relative aspect-[4/3] rounded-[var(--radius-sm)] overflow-hidden"
                >
                  <Image
                    src={story.hero!.url}
                    alt={story.hero!.alt || story.title}
                    fill
                    sizes="120px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </Link>
                <div>
                  <h4 className="text-sm font-bold leading-snug group-hover:text-nav-accent transition-colors">
                    <Link href={hrefFor(locale, story)}>{story.title}</Link>
                  </h4>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

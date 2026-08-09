'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { StoryCard } from '@thenagarik/content'
import type { AppLocale } from '@/lib/i18n'
import { RelativeTime } from '@/components/RelativeTime'

type ProvinceGroup = {
  id: string
  label: string
  stories: StoryCard[]
}

export function HomeProvinceTabs({
  locale,
  title,
  seeAll,
  groups,
}: {
  locale: AppLocale
  title: string
  seeAll: string
  groups: ProvinceGroup[]
}) {
  const available = useMemo(() => groups.filter((group) => group.stories.length > 0), [groups])
  const [activeId, setActiveId] = useState(available[0]?.id ?? '')
  const active = available.find((group) => group.id === activeId) ?? available[0]
  if (!active) return null

  const [lead, ...rest] = active.stories

  return (
    <section className="border-b border-line" aria-labelledby="province-section-title">
      <div className="mx-auto max-w-[1240px] px-4 py-7 md:px-6 md:py-9">
        <div className="flex items-end justify-between gap-4 border-b border-line pb-3">
          <h2 id="province-section-title" className="text-xl font-bold tracking-[-0.025em] md:text-2xl">{title}</h2>
          <Link href={`/${locale}/pradesh`} className="inline-flex min-h-11 items-center text-xs font-semibold text-accent hover:underline">{seeAll}</Link>
        </div>

        <div className="nav-scroller -mx-1 mt-2 flex overflow-x-auto" role="group" aria-label={title}>
          {available.map((group) => (
            <button
              key={group.id}
              type="button"
              aria-pressed={group.id === active.id}
              onClick={() => setActiveId(group.id)}
              className={`min-h-11 shrink-0 border-b-2 px-3 text-sm font-semibold ${group.id === active.id ? 'border-accent text-ink' : 'border-transparent text-stone hover:text-ink'}`}
            >
              {group.label}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-12 lg:gap-8" aria-live="polite">
          <article className="lg:col-span-7">
            {lead.hero ? (
              <Link href={`/${locale}/${lead.categorySlug}/${lead.slug}`} className="relative block aspect-[16/9] overflow-hidden bg-line">
                <Image src={lead.hero.url} alt={lead.hero.alt} fill sizes="(max-width:1024px) 100vw, 58vw" className="object-cover" />
              </Link>
            ) : null}
            <p className="mt-3 text-xs font-bold text-accent">{active.label}</p>
            <h3 className="mt-1 text-xl font-bold leading-[1.45] tracking-[-0.02em] md:text-2xl">
              <Link href={`/${locale}/${lead.categorySlug}/${lead.slug}`} className="hover:text-accent">{lead.title}</Link>
            </h3>
            {lead.deck ? <p className="mt-2 line-clamp-2 max-w-[60ch] text-sm leading-6 text-stone">{lead.deck}</p> : null}
          </article>

          <ol className="lg:col-span-5">
            {rest.slice(0, 5).map((story) => (
              <li key={story.id} className="border-b border-line first:border-t">
                <Link href={`/${locale}/${story.categorySlug}/${story.slug}`} className="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-3 py-3 hover:text-accent sm:grid-cols-[minmax(0,1fr)_7rem]">
                  <span className="min-w-0 self-center">
                    <span className="block text-[1.02rem] font-semibold leading-[1.45] text-ink">{story.title}</span>
                    <span className="mt-1 block text-xs text-stone"><RelativeTime iso={story.publishedAt} locale={locale} /></span>
                  </span>
                  {story.hero ? (
                    <span className="relative aspect-[4/3] overflow-hidden bg-line">
                      <Image src={story.hero.url} alt="" fill sizes="112px" className="object-cover" />
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import type { StoryCard } from '@thenagarik/content'
import type { AppLocale } from '@/lib/i18n'
import { RelativeTime } from '@/components/RelativeTime'

export function HomeSignalRail({
  locale,
  latest,
  popular,
  popularLive,
  latestLabel,
  popularLabel,
  coldLabel,
  seeAllLabel,
}: {
  locale: AppLocale
  latest: StoryCard[]
  popular: StoryCard[]
  popularLive: boolean
  latestLabel: string
  popularLabel: string
  coldLabel: string
  seeAllLabel: string
}) {
  const popularReady = popularLive && popular.length > 0
  const [mode, setMode] = useState<'latest' | 'popular'>('latest')
  const visible = mode === 'popular' && popularReady ? popular : latest

  return (
    <aside className="bg-paper-elevated lg:border-l lg:border-line" aria-label={latestLabel}>
      <div className="sticky top-12">
        <div className="flex min-h-14 items-end justify-between border-b border-line px-4 md:px-5">
          <div className="flex h-full items-end gap-5" role="group" aria-label={latestLabel}>
            <button
              type="button"
              aria-pressed={mode === 'latest'}
              onClick={() => setMode('latest')}
              className={`h-14 border-b-[3px] text-[0.95rem] font-bold transition-colors ${mode === 'latest' ? 'border-accent text-ink' : 'border-transparent text-stone hover:text-ink'}`}
            >
              {latestLabel}
            </button>
            <button
              type="button"
              aria-pressed={mode === 'popular'}
              disabled={!popularReady}
              onClick={() => setMode('popular')}
              className={`h-14 border-b-[3px] text-[0.95rem] font-bold transition-colors ${mode === 'popular' ? 'border-accent text-ink' : 'border-transparent text-stone hover:text-ink'} disabled:cursor-not-allowed disabled:opacity-45`}
            >
              {popularLabel}
            </button>
          </div>
          <Link href={`/${locale}/latest`} className="inline-flex min-h-11 items-center text-xs font-bold text-accent hover:underline">
            {seeAllLabel}
          </Link>
        </div>

        {!popularReady ? <p className="border-b border-line px-4 py-2 text-[0.72rem] leading-5 text-stone md:px-5">{coldLabel}</p> : null}

        <div className="px-4 pb-4 md:px-5" aria-live="polite">
          {visible.slice(0, 6).map((story, index) => (
            <article key={story.id} className="border-b border-line py-3.5 last:border-b-0">
              <Link href={`/${locale}/${story.categorySlug}/${story.slug}`} className="group grid grid-cols-[minmax(0,1fr)_6.8rem] gap-3">
                <span className="min-w-0 self-center">
                  <span className="mb-1 flex items-center gap-2 text-[0.68rem] font-bold text-stone">
                    <span className="tabular-nums text-accent">{String(index + 1).padStart(2, '0')}</span>
                    <RelativeTime iso={story.publishedAt} locale={locale} />
                  </span>
                  <span className="block text-[1rem] font-bold leading-[1.42] text-ink transition-colors group-hover:text-accent">{story.title}</span>
                </span>
                {story.hero ? (
                  <span className="editorial-image relative aspect-[4/3] rounded-[6px]">
                    <Image src={story.hero.url} alt="" fill sizes="110px" className="object-cover" />
                  </span>
                ) : null}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </aside>
  )
}

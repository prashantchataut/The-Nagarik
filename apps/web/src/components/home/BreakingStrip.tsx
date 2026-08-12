'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CaretRight, Lightning } from '@phosphor-icons/react'
import type { StoryCard } from '@thenagarik/content'
import type { AppLocale, Dictionary } from '@/lib/i18n'

const REFRESH_MS = 60_000

const NEP_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']
function toNepDigit(n: number): string {
  return String(n)
    .split('')
    .map((d) => NEP_DIGITS[parseInt(d, 10)] ?? d)
    .join('')
}

export function BreakingStrip({
  locale,
  dict,
  stories,
}: {
  locale: AppLocale
  dict: Dictionary
  stories: StoryCard[]
}) {
  const [liveStories, setLiveStories] = useState<StoryCard[]>(stories)

  // Live refresh: pull the current breaking set so new alerts pulse in
  // without a full page reload.
  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      try {
        const res = await fetch(`/api/breaking?locale=${locale}`)
        if (!res.ok) return
        const data = (await res.json()) as { ok?: boolean; stories?: StoryCard[] }
        if (!cancelled && data.ok && Array.isArray(data.stories) && data.stories.length) {
          setLiveStories(data.stories)
        }
      } catch {
        // Keep showing the last known set when offline.
      }
    }
    const id = window.setInterval(() => void tick(), REFRESH_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [locale])

  if (!liveStories.length) return null
  const displayStories = liveStories.slice(0, 5)
  const isBreaking = displayStories.some((s) => s.isBreaking)

  return (
    <section
      className="border-b border-line bg-paper-elevated"
      aria-label={isBreaking ? dict.breaking : dict.latestUpdates}
      aria-live="polite"
    >
      <div className="mx-auto flex min-h-[44px] max-w-[1280px] items-center gap-3 px-4 md:px-6">
        {/* Badge */}
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-[var(--radius-control)] px-2.5 py-1 text-xs font-extrabold tracking-wide ${
              isBreaking
                ? 'bg-danger text-danger-fg animate-pulse'
                : 'accent-solid'
            }`}
          >
            <Lightning size={13} weight="fill" aria-hidden="true" />
            <span>{isBreaking ? dict.breaking : dict.hot}</span>
          </span>
          {isBreaking ? (
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-danger" />
            </span>
          ) : null}
        </div>

        {/* Scrollable Story Strip */}
        <div className="nav-scroller flex min-w-0 flex-1 items-center gap-5 overflow-x-auto py-1.5 text-sm">
          {displayStories.map((story, index) => {
            const rank = index + 1
            const numStr = locale === 'ne' ? toNepDigit(rank) : String(rank)
            return (
              <Link
                key={story.id}
                href={`/${locale}/${story.categorySlug}/${story.slug}`}
                className="group inline-flex shrink-0 items-center gap-2 text-ink hover:text-accent"
              >
                <span
                  className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    rank <= 3
                      ? 'bg-accent-muted text-accent font-black'
                      : 'bg-paper-strong text-stone font-semibold'
                  }`}
                >
                  {numStr}
                </span>
                <span className="max-w-[280px] truncate font-bold group-hover:underline md:max-w-[360px] lg:max-w-[420px]">
                  {story.title}
                </span>
              </Link>
            )
          })}
        </div>

        {/* See All link */}
        <Link
          href={`/${locale}/latest`}
          className="hidden shrink-0 items-center gap-0.5 text-xs font-bold text-accent hover:underline sm:inline-flex"
        >
          <span>{dict.seeAll}</span>
          <CaretRight size={12} weight="bold" />
        </Link>
      </div>
    </section>
  )
}

'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Sparkle } from '@phosphor-icons/react'
import { readHistory, readProfile } from '@/components/account/reader-store'

type StoryCardData = {
  id: string
  slug: string
  categorySlug: string
  title: string
  deck?: string
  hero?: { url: string; alt: string } | null
  readTimeMinutes?: number
  isBreaking?: boolean
}

const COPY = {
  ne: {
    title: 'तपाईंका लागि',
    subtitle: 'रुचि र पढाइका आधारमा - यो पङ्क्ति तपाईंलाई मात्र देखिन्छ',
    minutes: 'मिनेट',
  },
  en: {
    title: 'For you',
    subtitle: 'Based on your interests and reading - only you see this row',
    minutes: 'min',
  },
} as const

/**
 * Personalized homepage strip. Client-rendered on purpose: the homepage
 * HTML stays ISR-cacheable and identical for everyone; personalization
 * happens after hydration from device/account signals. Renders NOTHING
 * for visitors with no signals - no empty placeholder, no layout shift
 * (the section only mounts once stories exist).
 */
export function ForYouStrip({ locale = 'ne' }: { locale?: 'ne' | 'en' }) {
  const copy = COPY[locale]
  const [stories, setStories] = useState<StoryCardData[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        // Account interests win; device profile is the anonymous fallback.
        let interests = readProfile().interests
        try {
          const me = await fetch('/api/reader/me').then((r) => (r.ok ? r.json() : null))
          const accountInterests = (me?.reader?.interests ?? []) as string[]
          if (accountInterests.length) interests = accountInterests
        } catch {
          // Anonymous is fine.
        }
        const recent = readHistory()
          .slice(0, 8)
          .map((h) => h.storyId)
        if (!interests.length && !recent.length) return

        const params = new URLSearchParams({ locale })
        if (interests.length) params.set('interests', interests.join(','))
        if (recent.length) params.set('recent', recent.join(','))
        const res = await fetch(`/api/recommendations?${params.toString()}`)
        if (!res.ok) return
        const data = (await res.json()) as { stories?: StoryCardData[] }
        if (!cancelled && Array.isArray(data.stories) && data.stories.length >= 3) {
          setStories(data.stories.slice(0, 6))
        }
      } catch {
        // Personalization is optional; the homepage stands on its own.
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [locale])

  if (!stories.length) return null

  return (
    <section
      className="border-b border-line bg-paper-elevated"
      aria-labelledby="for-you-title"
      data-nosnippet
    >
      <div className="mx-auto max-w-[1140px] px-4 py-6 md:px-6">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-center gap-2 text-accent">
            <Sparkle size={18} weight="fill" aria-hidden="true" />
            <h2 id="for-you-title" className="text-base font-black text-ink md:text-lg">
              {copy.title}
            </h2>
          </div>
          <p className="hidden text-[0.7rem] text-stone sm:block">{copy.subtitle}</p>
        </div>
        <ul className="scrollbar-none -mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          {stories.map((story) => (
            <li
              key={story.id}
              className="w-[240px] shrink-0 snap-start rounded-[var(--radius-md)] border border-line bg-paper p-4 transition-colors hover:border-accent"
            >
              <Link
                href={`/${locale}/${story.categorySlug}/${story.slug}`}
                className="group block"
              >
                <p className="text-[0.68rem] font-bold uppercase tracking-wider text-accent">
                  {story.categorySlug}
                </p>
                <h3 className="mt-1.5 line-clamp-3 text-sm font-bold leading-[1.55] text-ink group-hover:text-accent">
                  {story.title}
                </h3>
                {story.readTimeMinutes ? (
                  <p className="mt-2 text-[0.68rem] text-stone">
                    {story.readTimeMinutes} {copy.minutes}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

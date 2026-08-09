'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { continueReading, type ReadingProgressEntry } from '@thenagarik/algorithms'
import type { StoryCard } from '@thenagarik/content'
import type { AppLocale, Dictionary } from '@/lib/i18n'

const STORAGE_KEY = 'tn_reading_progress_v1'

export function loadReadingProgress(): ReadingProgressEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ReadingProgressEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveReadingProgress(entry: ReadingProgressEntry) {
  try {
    const existing = loadReadingProgress().filter((e) => e.storyId !== entry.storyId)
    existing.unshift(entry)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, 40)))
  } catch {
    // private mode / quota
  }
}

export function ContinueReadingRail({
  locale,
  dict,
  stories,
}: {
  locale: AppLocale
  dict: Dictionary
  stories: StoryCard[]
}) {
  const [items, setItems] = useState<Array<StoryCard & { progress: number }>>([])

  useEffect(() => {
    const byId = new Map(stories.map((s) => [s.id, s]))
    const result = continueReading({
      entries: loadReadingProgress(),
      availableIds: stories.map((s) => s.id),
      limit: 4,
    })
    setItems(
      result.items
        .map((e) => {
          const story = byId.get(e.storyId)
          if (!story) return null
          return { ...story, progress: e.progress }
        })
        .filter(Boolean) as Array<StoryCard & { progress: number }>,
    )
  }, [stories])

  if (!items.length) return null

  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-[1240px] px-4 py-5 md:px-6 md:py-6">
        <h2 className="font-[family-name:var(--font-display)] text-lg">{dict.continueReading}</h2>
        <ul className="mt-3 grid gap-0 md:grid-cols-2 lg:grid-cols-4">
          {items.map((story) => (
            <li key={story.id} className="border-t border-line py-3 md:border-r md:border-t-0 md:px-4 md:first:pl-0 md:last:border-r-0 md:last:pr-0 lg:py-0 lg:pt-3">
              <Link href={`/${locale}/${story.categorySlug}/${story.slug}`} className="block hover:text-accent">
                <p className="font-[family-name:var(--font-display)] text-[0.98rem] leading-snug text-ink">
                  {story.title}
                </p>
                <div className="mt-2.5 h-px overflow-hidden bg-line">
                  <div className="h-full accent-solid" style={{ width: `${Math.round(story.progress * 100)}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-stone">{Math.round(story.progress * 100)}%</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

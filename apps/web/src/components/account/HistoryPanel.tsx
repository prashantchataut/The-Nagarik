'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ClockCounterClockwise, Trash } from '@phosphor-icons/react'
import { readHistory, writeHistory, type HistoryEntry } from './reader-store'
import { deleteFromLibrary, LIBRARY_EVENT, syncLibrary } from './library-sync'

const COPY = {
  ne: {
    title: 'पढाइ इतिहास',
    empty: 'पढाइ इतिहास खाली छ। लेख पढ्न थालेपछि यहाँ प्रगति देखिन्छ।',
    continue: 'जारी राख्नुहोस्',
    finished: 'पढिसकियो',
    remove: 'हटाउनुहोस्',
    clearAll: 'इतिहास मेटाउनुहोस्',
    confirmClear: 'पढाइ इतिहास मेटाउने? यो कार्य फर्काउन सकिँदैन।',
    seeAll: 'सबै हेर्नुहोस्',
    filterAll: 'सबै',
    filterUnfinished: 'अधुरो',
    filterFinished: 'सकिएको',
    readPercent: 'पढिएको',
    privacyNote: 'इतिहास यही उपकरणमा रहन्छ; लगइन गरेको खातामा मात्र उपकरणहरूबीच सिंक हुन्छ।',
  },
  en: {
    title: 'Reading history',
    empty: 'Your reading history is empty. Progress appears once you start reading.',
    continue: 'Continue',
    finished: 'Finished',
    remove: 'Remove',
    clearAll: 'Clear history',
    confirmClear: 'Clear your reading history? This cannot be undone.',
    seeAll: 'See all',
    filterAll: 'All',
    filterUnfinished: 'In progress',
    filterFinished: 'Finished',
    readPercent: 'read',
    privacyNote: 'History stays on this device; it syncs across devices only when you are logged in.',
  },
} as const

type Filter = 'all' | 'unfinished' | 'finished'

export function HistoryPanel({
  locale = 'ne',
  variant = 'full',
}: {
  locale?: 'ne' | 'en'
  variant?: 'full' | 'compact'
}) {
  const copy = COPY[locale]
  const [items, setItems] = useState<HistoryEntry[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setItems(readHistory())
    setHydrated(true)
    // Logged-in readers: pull the server-merged history (multi-device).
    void syncLibrary().then((merged) => {
      if (merged) setItems(readHistory())
    })
    const onLibrary = () => setItems(readHistory())
    window.addEventListener(LIBRARY_EVENT, onLibrary)
    return () => window.removeEventListener(LIBRARY_EVENT, onLibrary)
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'finished') return items.filter((h) => h.progress >= 0.97)
    if (filter === 'unfinished') return items.filter((h) => h.progress < 0.97)
    return items
  }, [filter, items])

  const visible = variant === 'compact' ? items.slice(0, 4) : filtered

  function remove(storyId: string) {
    const next = items.filter((h) => h.storyId !== storyId)
    setItems(next)
    writeHistory(next)
    void deleteFromLibrary('history', [storyId])
  }

  function clearAll() {
    if (!window.confirm(copy.confirmClear)) return
    setItems([])
    writeHistory([])
    void deleteFromLibrary('history')
  }

  const filterButton = (value: Filter, label: string) => (
    <button
      key={value}
      type="button"
      onClick={() => setFilter(value)}
      aria-pressed={filter === value}
      className={`inline-flex min-h-9 items-center rounded-full px-3 text-xs font-bold transition-colors ${
        filter === value
          ? 'accent-solid'
          : 'border border-line bg-paper text-stone hover:border-accent hover:text-accent'
      }`}
    >
      {label}
    </button>
  )

  return (
    <section className="surface-card p-6" aria-labelledby={`history-panel-${variant}`}>
      <div className="flex items-center justify-between gap-3 border-b-2 border-accent pb-3">
        <div className="flex items-center gap-2 text-accent">
          <ClockCounterClockwise size={20} weight="bold" aria-hidden="true" />
          <h2 id={`history-panel-${variant}`} className="text-base font-black text-ink">
            {copy.title}
          </h2>
        </div>
        <span className="rounded-full border border-line bg-paper-elevated px-2.5 py-0.5 text-xs font-bold tabular-nums text-stone">
          {items.length}
        </span>
      </div>

      {variant === 'full' && items.length ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {filterButton('all', copy.filterAll)}
          {filterButton('unfinished', copy.filterUnfinished)}
          {filterButton('finished', copy.filterFinished)}
        </div>
      ) : null}

      {!hydrated ? (
        <div className="mt-4 space-y-2.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-[var(--radius-control)] bg-paper-elevated" />
          ))}
        </div>
      ) : visible.length ? (
        <>
          <ul className="mt-2 divide-y divide-line">
            {visible.map((h) => {
              const percent = Math.round(Math.max(0, Math.min(1, h.progress)) * 100)
              const done = percent >= 97
              return (
                <li key={h.storyId} className="py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/${locale}/${h.categorySlug}/${h.slug}`}
                      className="min-w-0 text-sm font-bold leading-snug text-ink hover:text-accent"
                    >
                      {h.title}
                    </Link>
                    <div className="flex shrink-0 items-center gap-1">
                      <Link
                        href={`/${locale}/${h.categorySlug}/${h.slug}`}
                        className={`inline-flex min-h-9 items-center rounded-full px-3 text-[0.7rem] font-bold ${
                          done
                            ? 'bg-success-muted text-success'
                            : 'bg-accent-muted text-accent hover:bg-accent hover:text-accent-fg'
                        }`}
                      >
                        {done ? copy.finished : copy.continue}
                      </Link>
                      {variant === 'full' ? (
                        <button
                          type="button"
                          onClick={() => remove(h.storyId)}
                          aria-label={`${copy.remove}: ${h.title}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-stone hover:bg-danger-muted hover:text-danger"
                        >
                          <Trash size={14} weight="bold" aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div
                      role="progressbar"
                      aria-valuenow={percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${h.title}: ${percent}% ${copy.readPercent}`}
                      className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-strong"
                    >
                      <div className="h-full accent-solid" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="text-[0.68rem] font-bold tabular-nums text-stone">{percent}%</span>
                    <span className="text-[0.68rem] tabular-nums text-stone" suppressHydrationWarning>
                      {new Date(h.updatedAt).toLocaleDateString(locale === 'ne' ? 'ne-NP' : 'en-NP')}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>

          {variant === 'compact' && items.length > visible.length ? (
            <Link
              href={`/${locale}/account/history`}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline"
            >
              {copy.seeAll} ({items.length})
              <ArrowRight size={13} weight="bold" aria-hidden="true" />
            </Link>
          ) : null}

          {variant === 'full' ? (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <p className="max-w-[46ch] text-[0.7rem] leading-relaxed text-stone">{copy.privacyNote}</p>
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-control)] border border-line px-3 text-xs font-bold text-stone hover:border-danger hover:text-danger"
              >
                <Trash size={13} weight="bold" aria-hidden="true" />
                {copy.clearAll}
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <p className="mt-4 rounded-[var(--radius-control)] bg-paper-elevated px-4 py-6 text-center text-xs leading-relaxed text-stone">
          {copy.empty}
        </p>
      )}
    </section>
  )
}

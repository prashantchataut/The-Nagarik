'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, BookmarkSimple, CloudCheck, Trash } from '@phosphor-icons/react'
import { readBookmarks, writeBookmarks, type Bookmark } from './reader-store'
import { deleteFromLibrary, LIBRARY_EVENT, syncLibrary } from './library-sync'

const COPY = {
  ne: {
    title: 'सुरक्षित समाचार',
    empty: 'अहिलेसम्म कुनै समाचार सुरक्षित छैन। लेख पढ्दा ‘सेभ’ बटन थिच्नुहोस्।',
    remove: 'हटाउनुहोस्',
    clearAll: 'सबै हटाउनुहोस्',
    confirmClear: 'सबै सुरक्षित समाचार हटाउने? यो कार्य फर्काउन सकिँदैन।',
    savedOn: 'सुरक्षित',
    seeAll: 'सबै हेर्नुहोस्',
    offlineNote: 'सुरक्षित समाचार अफलाइनमा पनि खुल्छन् (सेभ गर्दा उपकरणमा पिन हुन्छन्)।',
  },
  en: {
    title: 'Saved stories',
    empty: 'Nothing saved yet. Tap the bookmark button while reading a story.',
    remove: 'Remove',
    clearAll: 'Clear all',
    confirmClear: 'Remove every saved story? This cannot be undone.',
    savedOn: 'Saved',
    seeAll: 'See all',
    offlineNote: 'Saved stories open offline too (pinned to this device on save).',
  },
} as const

export function SavedStoriesPanel({
  locale = 'ne',
  variant = 'full',
}: {
  locale?: 'ne' | 'en'
  variant?: 'full' | 'compact'
}) {
  const copy = COPY[locale]
  const [items, setItems] = useState<Bookmark[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setItems(readBookmarks())
    setHydrated(true)
    // Logged-in readers: pull the server-merged library (multi-device).
    void syncLibrary().then((merged) => {
      if (merged) setItems(readBookmarks())
    })
    const onLibrary = () => setItems(readBookmarks())
    window.addEventListener(LIBRARY_EVENT, onLibrary)
    return () => window.removeEventListener(LIBRARY_EVENT, onLibrary)
  }, [])

  function remove(storyId: string) {
    const next = items.filter((b) => b.storyId !== storyId)
    setItems(next)
    writeBookmarks(next)
    unpinFromServiceWorker(storyId)
    void deleteFromLibrary('saved', [storyId])
  }

  function unpinFromServiceWorker(storyId: string) {
    const target = items.find((b) => b.storyId === storyId)
    if (!target) return
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then((registration) => {
            registration.active?.postMessage({
              type: 'UNCACHE_STORY',
              url: `/${locale}/${target.categorySlug}/${target.slug}`,
            })
          })
          .catch(() => {})
      }
    } catch {
      // best effort
    }
  }

  function clearAll() {
    if (!window.confirm(copy.confirmClear)) return
    for (const item of items) unpinFromServiceWorker(item.storyId)
    setItems([])
    writeBookmarks([])
    void deleteFromLibrary('saved')
  }

  const visible = variant === 'compact' ? items.slice(0, 4) : items

  return (
    <section className="surface-card p-6" aria-labelledby={`saved-panel-${variant}`}>
      <div className="flex items-center justify-between gap-3 border-b-2 border-accent pb-3">
        <div className="flex items-center gap-2 text-accent">
          <BookmarkSimple size={20} weight="bold" aria-hidden="true" />
          <h2 id={`saved-panel-${variant}`} className="text-base font-black text-ink">
            {copy.title}
          </h2>
        </div>
        <span className="rounded-full border border-line bg-paper-elevated px-2.5 py-0.5 text-xs font-bold tabular-nums text-stone">
          {items.length}
        </span>
      </div>

      {!hydrated ? (
        <div className="mt-4 space-y-2.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-[var(--radius-control)] bg-paper-elevated" />
          ))}
        </div>
      ) : visible.length ? (
        <>
          <ul className="mt-2 divide-y divide-line">
            {visible.map((b) => (
              <li key={b.storyId} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link
                    href={`/${locale}/${b.categorySlug}/${b.slug}`}
                    className="block text-sm font-bold leading-snug text-ink hover:text-accent"
                  >
                    {b.title}
                  </Link>
                  <p className="mt-0.5 text-[0.68rem] text-stone" suppressHydrationWarning>
                    {copy.savedOn}:{' '}
                    {new Date(b.savedAt).toLocaleDateString(locale === 'ne' ? 'ne-NP' : 'en-NP')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(b.storyId)}
                  aria-label={`${copy.remove}: ${b.title}`}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-stone hover:bg-danger-muted hover:text-danger"
                >
                  <Trash size={16} weight="bold" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>

          {variant === 'compact' && items.length > visible.length ? (
            <Link
              href={`/${locale}/account/saved`}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline"
            >
              {copy.seeAll} ({items.length})
              <ArrowRight size={13} weight="bold" aria-hidden="true" />
            </Link>
          ) : null}

          {variant === 'full' ? (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <p className="inline-flex items-center gap-1.5 text-[0.7rem] leading-relaxed text-stone">
                <CloudCheck size={14} weight="bold" className="shrink-0 text-success" aria-hidden="true" />
                {copy.offlineNote}
              </p>
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

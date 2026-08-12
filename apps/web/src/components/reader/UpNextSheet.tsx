'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CaretUp, Clock, Lightning, Sparkle, X } from '@phosphor-icons/react'

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
    fab: 'अर्को पढ्नुहोस्',
    fabLabel: 'सिफारिस गरिएका अर्का समाचार खोल्नुहोस्',
    title: 'तपाईंका लागि अर्को',
    subtitle: 'रुचि, पढाइ र ताजापनका आधारमा छानिएका',
    close: 'बन्द गर्नुहोस्',
    minutes: 'मिनेट',
    breaking: 'ब्रेकिङ',
    empty: 'अहिले सिफारिस उपलब्ध छैन।',
  },
  en: {
    fab: 'Read next',
    fabLabel: 'Open recommended next stories',
    title: 'Up next for you',
    subtitle: 'Picked from your interests, reading, and freshness',
    close: 'Close',
    minutes: 'min',
    breaking: 'Breaking',
    empty: 'No recommendations available right now.',
  },
} as const

function deviceSignals(): { interests: string[]; recent: string[] } {
  try {
    const profile = JSON.parse(localStorage.getItem('tn_reader_profile_v1') || '{}') as {
      interests?: string[]
    }
    const history = JSON.parse(localStorage.getItem('tn_reading_progress_v1') || '[]') as Array<{
      storyId?: string
    }>
    return {
      interests: Array.isArray(profile.interests) ? profile.interests.slice(0, 8) : [],
      recent: Array.isArray(history)
        ? history.map((h) => String(h?.storyId ?? '')).filter(Boolean).slice(0, 10)
        : [],
    }
  } catch {
    return { interests: [], recent: [] }
  }
}

/**
 * SPA-style story hopping: a floating "Read next" control on every article
 * opens a bottom sheet of personalized recommendations. Items navigate with
 * client-side transitions - readers hop story to story without going back.
 */
export function UpNextSheet({
  storyId,
  locale = 'ne',
}: {
  storyId: string
  locale?: 'ne' | 'en'
}) {
  const copy = COPY[locale]
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [stories, setStories] = useState<StoryCardData[]>([])
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'empty'>('idle')
  const sheetRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const fabRef = useRef<HTMLButtonElement>(null)

  const load = useCallback(async () => {
    setState('loading')
    try {
      const device = deviceSignals()
      // Account interests (reader session) win over device interests.
      let interests = device.interests
      try {
        const me = await fetch('/api/reader/me').then((r) => (r.ok ? r.json() : null))
        if (me?.reader?.interests?.length) interests = me.reader.interests
      } catch {
        // anonymous is fine
      }
      const params = new URLSearchParams({
        storyId,
        locale,
        interests: interests.join(','),
        recent: device.recent.join(','),
      })
      const res = await fetch(`/api/recommendations?${params.toString()}`)
      if (!res.ok) throw new Error(String(res.status))
      const data = (await res.json()) as { stories?: StoryCardData[] }
      const items = Array.isArray(data.stories) ? data.stories : []
      setStories(items)
      setState(items.length ? 'ready' : 'empty')
    } catch {
      setStories([])
      setState('empty')
    }
  }, [locale, storyId])

  // Close on navigation: the reader hopped to the next story.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Focus management + Escape + scroll lock while the sheet is open.
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    const fabElement = fabRef.current
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
      }
      if (event.key === 'Tab' && sheetRef.current) {
        const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])',
        )
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKey)
      fabElement?.focus()
    }
  }, [open])

  function toggle() {
    if (!open && state === 'idle') void load()
    setOpen((v) => !v)
  }

  return (
    <>
      {/* Floating "Read next" control */}
      <button
        ref={fabRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={copy.fabLabel}
        data-focus-hide
        className="fixed bottom-[4.5rem] right-4 z-40 inline-flex min-h-12 items-center gap-2 rounded-full accent-solid px-5 text-sm font-bold shadow-[0_10px_30px_rgb(16_32_29_/_0.25)] transition-transform hover:scale-[1.03] active:scale-[0.98] md:bottom-6 md:right-6"
      >
        <CaretUp size={16} weight="bold" aria-hidden="true" />
        <span>{copy.fab}</span>
      </button>

      {/* Bottom sheet */}
      {open ? (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-[2px]"
            aria-label={copy.close}
            onClick={() => setOpen(false)}
          />
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="upnext-title"
            className="absolute inset-x-0 bottom-0 mx-auto max-h-[78dvh] w-full max-w-2xl overflow-hidden rounded-t-[var(--radius-lg)] border border-b-0 border-line bg-paper shadow-[0_-18px_60px_rgb(16_32_29_/_0.3)]"
          >
            {/* Grab handle + header */}
            <div className="sticky top-0 border-b border-line bg-paper/95 px-5 pb-3 pt-2.5 backdrop-blur">
              <div className="mx-auto h-1.5 w-10 rounded-full bg-line-strong" aria-hidden="true" />
              <div className="mt-2.5 flex items-center justify-between gap-3">
                <div>
                  <h2 id="upnext-title" className="flex items-center gap-2 text-base font-black text-ink">
                    <Sparkle size={18} weight="fill" className="text-accent" aria-hidden="true" />
                    {copy.title}
                  </h2>
                  <p className="mt-0.5 text-[0.7rem] text-stone">{copy.subtitle}</p>
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={copy.close}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full text-stone hover:bg-paper-elevated hover:text-ink"
                >
                  <X size={20} weight="bold" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Recommendations */}
            <div className="overflow-y-auto px-4 pb-6 pt-3" style={{ maxHeight: 'calc(78dvh - 6rem)' }}>
              {state === 'loading' || state === 'idle' ? (
                <div className="space-y-3" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-[var(--radius-panel)] bg-paper-elevated" />
                  ))}
                </div>
              ) : state === 'empty' ? (
                <p className="rounded-[var(--radius-control)] bg-paper-elevated px-4 py-8 text-center text-sm text-stone">
                  {copy.empty}
                </p>
              ) : (
                <ul className="space-y-2">
                  {stories.map((story, index) => (
                    <li key={story.id}>
                      <Link
                        href={`/${locale}/${story.categorySlug}/${story.slug}`}
                        className="group flex gap-3.5 rounded-[var(--radius-panel)] border border-line bg-paper p-3 transition-colors hover:border-accent hover:bg-accent-muted/30"
                      >
                        {story.hero ? (
                          <span className="editorial-image relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-[var(--radius-control)]">
                            <Image
                              src={story.hero.url}
                              alt=""
                              fill
                              sizes="96px"
                              className="object-cover"
                            />
                          </span>
                        ) : (
                          <span
                            aria-hidden="true"
                            className="flex aspect-[4/3] w-24 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-accent-muted text-xl font-black text-accent"
                          >
                            {index + 1}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-1.5 text-[0.68rem] font-bold">
                            <span className="capitalize text-accent">{story.categorySlug}</span>
                            {story.isBreaking ? (
                              <span className="inline-flex items-center gap-0.5 rounded bg-danger px-1.5 py-0.5 text-[0.62rem] font-black text-danger-fg">
                                <Lightning size={10} weight="fill" aria-hidden="true" />
                                {copy.breaking}
                              </span>
                            ) : null}
                          </span>
                          <span className="mt-1 line-clamp-2 block text-sm font-bold leading-snug text-ink group-hover:text-accent">
                            {story.title}
                          </span>
                          {story.readTimeMinutes ? (
                            <span className="mt-1.5 inline-flex items-center gap-1 text-[0.68rem] font-semibold text-stone">
                              <Clock size={11} weight="bold" aria-hidden="true" />
                              {story.readTimeMinutes} {copy.minutes}
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

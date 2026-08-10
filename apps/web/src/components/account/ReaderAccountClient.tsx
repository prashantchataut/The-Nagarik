'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  BookmarkSimple,
  ClockCounterClockwise,
  Desktop,
  DownloadSimple,
  Moon,
  Palette,
  Sun,
  TextAa,
  Trash,
} from '@phosphor-icons/react'

const BOOKMARKS_KEY = 'tn_saved_stories_v1'
const HISTORY_KEY = 'tn_reading_progress_v1'
const TYPE_SCALE_KEY = 'tn_article_type_scale_v1'
const THEME_KEY = 'tn_theme'
const TINT_KEY = 'tn_reading_tint_v1'

type Bookmark = {
  storyId: string
  title: string
  categorySlug: string
  slug: string
  savedAt: string
}

type HistoryEntry = {
  storyId: string
  progress: number
  updatedAt: string
  categorySlug: string
  slug: string
  title: string
}

type ThemeMode = 'system' | 'light' | 'dark'
type TypeScale = 'sm' | 'md' | 'lg'
type Tint = 'paper' | 'night' | 'white'

const COPY = {
  ne: {
    bookmarks: 'सुरक्षित समाचार',
    bookmarksEmpty: 'अहिलेसम्म कुनै समाचार सुरक्षित छैन। लेख पढ्दा ‘सेभ’ थिच्नुहोस्।',
    history: 'पढाइ इतिहास',
    historyEmpty: 'पढाइ इतिहास खाली छ। लेख पढ्न थालेपछि यहाँ प्रगति देखिन्छ।',
    continue: 'जारी राख्नुहोस्',
    remove: 'हटाउनुहोस्',
    clearBookmarks: 'सबै सुरक्षित समाचार हटाउनुहोस्',
    clearHistory: 'इतिहास मेटाउनुहोस्',
    confirmClearBookmarks: 'सबै सुरक्षित समाचार हटाउने? यो कार्य फर्काउन सकिँदैन।',
    confirmClearHistory: 'पढाइ इतिहास मेटाउने? यो कार्य फर्काउन सकिँदैन।',
    prefs: 'पढाइ प्राथमिकता',
    theme: 'थिम',
    themeSystem: 'प्रणाली',
    themeLight: 'उज्यालो',
    themeDark: 'अँध्यारो',
    textSize: 'अक्षर आकार',
    textSm: 'सानो',
    textMd: 'मध्यम',
    textLg: 'ठूलो',
    tint: 'फोकस मोड पृष्ठभूमि',
    tintPaper: 'न्यानो कागज',
    tintNight: 'रात',
    tintWhite: 'सेतो',
    prefsNote: 'यी प्राथमिकता यही उपकरणमा मात्र सुरक्षित हुन्छन् र तपाईंको पढाइ अनुभवमा तुरुन्तै लागू हुन्छन्।',
    export: 'मेरो डाटा डाउनलोड',
    saved: 'सुरक्षित',
    readPercent: 'पढिएको',
  },
  en: {
    bookmarks: 'Saved stories',
    bookmarksEmpty: 'Nothing saved yet. Tap the bookmark button while reading a story.',
    history: 'Reading history',
    historyEmpty: 'Your reading history is empty. Progress appears once you start reading.',
    continue: 'Continue',
    remove: 'Remove',
    clearBookmarks: 'Clear all saved stories',
    clearHistory: 'Clear history',
    confirmClearBookmarks: 'Remove every saved story? This cannot be undone.',
    confirmClearHistory: 'Clear your reading history? This cannot be undone.',
    prefs: 'Reading preferences',
    theme: 'Theme',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    textSize: 'Text size',
    textSm: 'Small',
    textMd: 'Medium',
    textLg: 'Large',
    tint: 'Focus mode background',
    tintPaper: 'Warm paper',
    tintNight: 'Night',
    tintWhite: 'Pure white',
    prefsNote: 'Preferences live on this device only and apply instantly to your reading experience.',
    export: 'Download my data',
    saved: 'Saved',
    readPercent: 'read',
  },
} as const

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const value = JSON.parse(raw) as T
    return Array.isArray(fallback) && !Array.isArray(value) ? fallback : value
  } catch {
    return fallback
  }
}

function applyTheme(mode: ThemeMode) {
  const resolved =
    mode === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : mode
  document.documentElement.dataset.themeMode = mode
  document.documentElement.dataset.theme = resolved
}

export function ReaderAccountClient({ locale = 'ne' }: { locale?: 'ne' | 'en' }) {
  const copy = COPY[locale]
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [theme, setTheme] = useState<ThemeMode>('system')
  const [scale, setScale] = useState<TypeScale>('md')
  const [tint, setTint] = useState<Tint>('paper')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setBookmarks(readJson<Bookmark[]>(BOOKMARKS_KEY, []))
    setHistory(readJson<HistoryEntry[]>(HISTORY_KEY, []))
    try {
      const storedTheme = localStorage.getItem(THEME_KEY)
      if (storedTheme === 'light' || storedTheme === 'dark') setTheme(storedTheme)
      const storedScale = localStorage.getItem(TYPE_SCALE_KEY)
      if (storedScale === 'sm' || storedScale === 'md' || storedScale === 'lg') {
        setScale(storedScale)
      }
      const storedTint = localStorage.getItem(TINT_KEY)
      if (storedTint === 'paper' || storedTint === 'night' || storedTint === 'white') {
        setTint(storedTint)
      }
    } catch {
      // Preferences are optional
    }
    setHydrated(true)
  }, [])

  function removeBookmark(storyId: string) {
    const next = bookmarks.filter((b) => b.storyId !== storyId)
    setBookmarks(next)
    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next))
    } catch {
      // ignore quota errors
    }
  }

  function clearBookmarks() {
    if (!window.confirm(copy.confirmClearBookmarks)) return
    setBookmarks([])
    try {
      localStorage.removeItem(BOOKMARKS_KEY)
    } catch {
      // ignore
    }
  }

  function clearHistory() {
    if (!window.confirm(copy.confirmClearHistory)) return
    setHistory([])
    try {
      localStorage.removeItem(HISTORY_KEY)
    } catch {
      // ignore
    }
  }

  function chooseTheme(mode: ThemeMode) {
    setTheme(mode)
    try {
      if (mode === 'system') localStorage.removeItem(THEME_KEY)
      else localStorage.setItem(THEME_KEY, mode)
    } catch {
      // ignore
    }
    applyTheme(mode)
  }

  function chooseScale(value: TypeScale) {
    setScale(value)
    const map = { sm: '0.95', md: '1', lg: '1.14' } as const
    document.documentElement.style.setProperty('--article-type-scale', map[value])
    try {
      localStorage.setItem(TYPE_SCALE_KEY, value)
    } catch {
      // ignore
    }
  }

  function chooseTint(value: Tint) {
    setTint(value)
    try {
      localStorage.setItem(TINT_KEY, value)
    } catch {
      // ignore
    }
  }

  function exportData() {
    const blob = new Blob(
      [
        JSON.stringify(
          { bookmarks, history, preferences: { theme, scale, tint }, exportedAt: new Date().toISOString() },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'the-nagarik-reader-data.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const segButton = (active: boolean) =>
    `inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-control)] border px-3.5 text-xs font-bold transition-colors ${
      active
        ? 'border-accent bg-accent-muted text-accent'
        : 'border-line bg-paper text-ink hover:border-accent hover:text-accent'
    }`

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Saved stories */}
      <section className="surface-card p-6" aria-labelledby="account-bookmarks-title">
        <div className="flex items-center justify-between gap-3 border-b-2 border-accent pb-3">
          <div className="flex items-center gap-2 text-accent">
            <BookmarkSimple size={20} weight="bold" aria-hidden="true" />
            <h2 id="account-bookmarks-title" className="text-base font-black text-ink">
              {copy.bookmarks}
            </h2>
          </div>
          <span className="rounded-full bg-paper-elevated border border-line px-2.5 py-0.5 text-xs font-bold tabular-nums text-stone">
            {bookmarks.length}
          </span>
        </div>

        {!hydrated ? (
          <div className="mt-4 space-y-2.5" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-[var(--radius-control)] bg-paper-elevated" />
            ))}
          </div>
        ) : bookmarks.length ? (
          <>
            <ul className="mt-2 divide-y divide-line">
              {bookmarks.map((b) => (
                <li key={b.storyId} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/${locale}/${b.categorySlug}/${b.slug}`}
                      className="block text-sm font-bold leading-snug text-ink hover:text-accent"
                    >
                      {b.title}
                    </Link>
                    <p className="mt-0.5 text-[0.68rem] text-stone" suppressHydrationWarning>
                      {copy.saved}: {new Date(b.savedAt).toLocaleDateString(locale === 'ne' ? 'ne-NP' : 'en-NP')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBookmark(b.storyId)}
                    aria-label={`${copy.remove}: ${b.title}`}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-stone hover:bg-danger-muted hover:text-danger"
                  >
                    <Trash size={16} weight="bold" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={clearBookmarks}
              className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-control)] border border-line px-3 text-xs font-bold text-stone hover:border-danger hover:text-danger"
            >
              <Trash size={13} weight="bold" aria-hidden="true" />
              {copy.clearBookmarks}
            </button>
          </>
        ) : (
          <p className="mt-4 rounded-[var(--radius-control)] bg-paper-elevated px-4 py-6 text-center text-xs leading-relaxed text-stone">
            {copy.bookmarksEmpty}
          </p>
        )}
      </section>

      {/* Reading history */}
      <section className="surface-card p-6" aria-labelledby="account-history-title">
        <div className="flex items-center justify-between gap-3 border-b-2 border-accent pb-3">
          <div className="flex items-center gap-2 text-accent">
            <ClockCounterClockwise size={20} weight="bold" aria-hidden="true" />
            <h2 id="account-history-title" className="text-base font-black text-ink">
              {copy.history}
            </h2>
          </div>
          <span className="rounded-full bg-paper-elevated border border-line px-2.5 py-0.5 text-xs font-bold tabular-nums text-stone">
            {history.length}
          </span>
        </div>

        {!hydrated ? (
          <div className="mt-4 space-y-2.5" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-[var(--radius-control)] bg-paper-elevated" />
            ))}
          </div>
        ) : history.length ? (
          <>
            <ul className="mt-2 divide-y divide-line">
              {history.slice(0, 12).map((h) => {
                const percent = Math.round(Math.max(0, Math.min(1, h.progress)) * 100)
                return (
                  <li key={h.storyId} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={`/${locale}/${h.categorySlug}/${h.slug}`}
                        className="min-w-0 text-sm font-bold leading-snug text-ink hover:text-accent"
                      >
                        {h.title}
                      </Link>
                      <Link
                        href={`/${locale}/${h.categorySlug}/${h.slug}`}
                        className="shrink-0 text-[0.7rem] font-bold text-accent hover:underline"
                      >
                        {copy.continue}
                      </Link>
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
                      <span className="text-[0.68rem] font-bold tabular-nums text-stone">
                        {percent}%
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
            <button
              type="button"
              onClick={clearHistory}
              className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-control)] border border-line px-3 text-xs font-bold text-stone hover:border-danger hover:text-danger"
            >
              <Trash size={13} weight="bold" aria-hidden="true" />
              {copy.clearHistory}
            </button>
          </>
        ) : (
          <p className="mt-4 rounded-[var(--radius-control)] bg-paper-elevated px-4 py-6 text-center text-xs leading-relaxed text-stone">
            {copy.historyEmpty}
          </p>
        )}
      </section>

      {/* Preferences */}
      <section className="surface-card p-6 lg:col-span-2" aria-labelledby="account-prefs-title">
        <div className="flex items-center gap-2 border-b-2 border-accent pb-3 text-accent">
          <Palette size={20} weight="bold" aria-hidden="true" />
          <h2 id="account-prefs-title" className="text-base font-black text-ink">
            {copy.prefs}
          </h2>
        </div>

        <div className="mt-5 grid gap-6 md:grid-cols-3">
          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wider text-stone">
              {copy.theme}
            </legend>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button type="button" onClick={() => chooseTheme('system')} className={segButton(theme === 'system')} aria-pressed={theme === 'system'}>
                <Desktop size={15} weight="bold" aria-hidden="true" />
                {copy.themeSystem}
              </button>
              <button type="button" onClick={() => chooseTheme('light')} className={segButton(theme === 'light')} aria-pressed={theme === 'light'}>
                <Sun size={15} weight="bold" aria-hidden="true" />
                {copy.themeLight}
              </button>
              <button type="button" onClick={() => chooseTheme('dark')} className={segButton(theme === 'dark')} aria-pressed={theme === 'dark'}>
                <Moon size={15} weight="bold" aria-hidden="true" />
                {copy.themeDark}
              </button>
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wider text-stone">
              {copy.textSize}
            </legend>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {([['sm', copy.textSm], ['md', copy.textMd], ['lg', copy.textLg]] as const).map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => chooseScale(value)}
                    className={segButton(scale === value)}
                    aria-pressed={scale === value}
                  >
                    <TextAa size={15} weight="bold" aria-hidden="true" />
                    {label}
                  </button>
                ),
              )}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wider text-stone">
              {copy.tint}
            </legend>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {([['paper', copy.tintPaper], ['night', copy.tintNight], ['white', copy.tintWhite]] as const).map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => chooseTint(value)}
                    className={segButton(tint === value)}
                    aria-pressed={tint === value}
                  >
                    <span
                      aria-hidden="true"
                      className="inline-block h-3.5 w-3.5 rounded-full border border-line-strong"
                      style={{
                        background:
                          value === 'paper' ? '#f6efdf' : value === 'night' ? '#141a19' : '#ffffff',
                      }}
                    />
                    {label}
                  </button>
                ),
              )}
            </div>
          </fieldset>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
          <p className="max-w-[52ch] text-[0.7rem] leading-relaxed text-stone">{copy.prefsNote}</p>
          <button
            type="button"
            onClick={exportData}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-control)] border border-line px-3.5 text-xs font-bold text-ink hover:border-accent hover:text-accent"
          >
            <DownloadSimple size={14} weight="bold" aria-hidden="true" />
            {copy.export}
          </button>
        </div>
      </section>
    </div>
  )
}

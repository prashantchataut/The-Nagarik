'use client'

/**
 * Device-local reader data layer (privacy-first: nothing leaves the browser).
 * Single source for the account hub, profile, saved, and history pages.
 */

export const PROFILE_KEY = 'tn_reader_profile_v1'
export const BOOKMARKS_KEY = 'tn_saved_stories_v1'
export const HISTORY_KEY = 'tn_reading_progress_v1'
export const TYPE_SCALE_KEY = 'tn_article_type_scale_v1'
export const THEME_KEY = 'tn_theme'
export const TINT_KEY = 'tn_reading_tint_v1'

export const PROFILE_EVENT = 'tn:reader-profile'

export type ReaderProfile = {
  name: string
  /** Swatch id from PROFILE_SWATCHES. */
  color: string
  /** Followed category slugs. */
  interests: string[]
}

export type Bookmark = {
  storyId: string
  title: string
  categorySlug: string
  slug: string
  savedAt: string
}

export type HistoryEntry = {
  storyId: string
  progress: number
  updatedAt: string
  categorySlug: string
  slug: string
  title: string
}

/** WCAG AA safe on white text. */
export const PROFILE_SWATCHES: Array<{ id: string; bg: string; labelNe: string; labelEn: string }> = [
  { id: 'teal', bg: '#0b6b63', labelNe: 'टिल', labelEn: 'Teal' },
  { id: 'blue', bg: '#1d4ed8', labelNe: 'नीलो', labelEn: 'Blue' },
  { id: 'maroon', bg: '#9f1239', labelNe: 'मरून', labelEn: 'Maroon' },
  { id: 'violet', bg: '#6d28d9', labelNe: 'बैजनी', labelEn: 'Violet' },
  { id: 'forest', bg: '#166534', labelNe: 'वन हरियो', labelEn: 'Forest' },
  { id: 'slate', bg: '#334155', labelNe: 'स्लेट', labelEn: 'Slate' },
]

export function swatchBg(colorId: string): string {
  return PROFILE_SWATCHES.find((s) => s.id === colorId)?.bg ?? PROFILE_SWATCHES[0].bg
}

const DEFAULT_PROFILE: ReaderProfile = { name: '', color: 'teal', interests: [] }

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const value = JSON.parse(raw) as T
    if (Array.isArray(fallback) && !Array.isArray(value)) return fallback
    return value
  } catch {
    return fallback
  }
}

export function readProfile(): ReaderProfile {
  const raw = readJson<Partial<ReaderProfile>>(PROFILE_KEY, {})
  return {
    name: typeof raw.name === 'string' ? raw.name : DEFAULT_PROFILE.name,
    color: typeof raw.color === 'string' ? raw.color : DEFAULT_PROFILE.color,
    interests: Array.isArray(raw.interests) ? raw.interests.filter((i) => typeof i === 'string') : [],
  }
}

export function writeProfile(profile: ReaderProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    window.dispatchEvent(new CustomEvent(PROFILE_EVENT))
  } catch {
    // Storage is optional
  }
}

export function readBookmarks(): Bookmark[] {
  return readJson<Bookmark[]>(BOOKMARKS_KEY, []).filter(
    (b) => b && typeof b.storyId === 'string' && typeof b.slug === 'string',
  )
}

export function writeBookmarks(items: Bookmark[]): void {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(items.slice(0, 50)))
  } catch {
    // Storage is optional
  }
}

export function readHistory(): HistoryEntry[] {
  return readJson<HistoryEntry[]>(HISTORY_KEY, []).filter(
    (h) => h && typeof h.storyId === 'string' && typeof h.slug === 'string',
  )
}

export function writeHistory(items: HistoryEntry[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 40)))
  } catch {
    // Storage is optional
  }
}

/** Full local data export for the reader (data portability). */
export function exportReaderData(): string {
  return JSON.stringify(
    {
      profile: readProfile(),
      bookmarks: readBookmarks(),
      history: readHistory(),
      preferences: {
        theme: safeGet(THEME_KEY) ?? 'system',
        textScale: safeGet(TYPE_SCALE_KEY) ?? 'md',
        readingTint: safeGet(TINT_KEY) ?? 'paper',
      },
      exportedAt: new Date().toISOString(),
    },
    null,
    2,
  )
}

/** Erase every locally stored reader trace (bookmarks, history, profile, prefs). */
export function eraseReaderData(): void {
  for (const key of [PROFILE_KEY, BOOKMARKS_KEY, HISTORY_KEY, TYPE_SCALE_KEY, THEME_KEY, TINT_KEY]) {
    try {
      localStorage.removeItem(key)
    } catch {
      // Storage is optional
    }
  }
  window.dispatchEvent(new CustomEvent(PROFILE_EVENT))
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export type ReadingProgressEntry = {
  storyId: string
  /** 0–1 fraction of article scrolled */
  progress: number
  updatedAt: string
  categorySlug?: string
  slug?: string
  title?: string
}

export type ContinueReadingInput = {
  entries: ReadingProgressEntry[]
  /** Story ids that still exist / are published */
  availableIds: Set<string> | string[]
  limit?: number
  /** Minimum progress to show (default 0.08); skip near-finished (default 0.92) */
  minProgress?: number
  maxProgress?: number
}

/**
 * Device-local continue-reading: unfinished articles sorted by most recent progress.
 * Honest: empty when no progress store; never invents items.
 */
export function continueReading(input: ContinueReadingInput): {
  items: ReadingProgressEntry[]
  live: boolean
} {
  const available = input.availableIds instanceof Set
    ? input.availableIds
    : new Set(input.availableIds)
  const min = input.minProgress ?? 0.08
  const max = input.maxProgress ?? 0.92
  const limit = input.limit ?? 4

  const items = [...input.entries]
    .filter((e) => available.has(e.storyId))
    .filter((e) => e.progress >= min && e.progress < max)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit)

  return { items, live: items.length > 0 }
}

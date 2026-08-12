export type ReaderProfile = {
  readerId: string
  recentCategoryIds: string[]
  recentStoryIds: string[]
  followedAuthorIds?: string[]
}

export type RecommendCandidate = {
  id: string
  categoryId?: string
  authorIds?: string[]
  publishedAt?: string
  isBreaking?: boolean
  sponsored?: boolean
  termWeights?: Record<string, number>
}

export type RecommendResult = {
  items: RecommendCandidate[]
  strategy: 'cold-start' | 'hybrid' | 'hybrid+cf'
}

import { categoryQuota } from './diversity'
import { impressionFatigue } from './personalize'

const DEFAULT_WEIGHTS = {
  content: 1,
  session: 0.6,
  sequence: 0.35,
  collaborative: 0.4,
  freshness: 0.8,
  follow: 0.95,
  editorial: 0.5,
}

function cosine(a: Record<string, number> = {}, b: Record<string, number> = {}): number {
  let dot = 0
  let na = 0
  let nb = 0
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const k of keys) {
    const x = a[k] ?? 0
    const y = b[k] ?? 0
    dot += x * y
    na += x * x
    nb += y * y
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

function freshness(publishedAt: string | undefined, now: Date): number {
  if (!publishedAt) return 0.2
  const ageHours = Math.max(0, (now.getTime() - new Date(publishedAt).getTime()) / 3600_000)
  return 1 / (1 + ageHours / 24)
}

export function recommendForReader(
  candidates: RecommendCandidate[],
  profile: ReaderProfile,
  opts: {
    limit?: number
    cfScores?: Record<string, number>
    minCfReaders?: number
    cfReaderCount?: number
    now?: Date
    /** Impressions already shown per story id - applies fatigue dampening. */
    seenCounts?: Record<string, number>
    /** Max stories per category inside the result window (default 2). */
    maxPerCategory?: number
  } = {},
): RecommendResult {
  const limit = opts.limit ?? 8
  const now = opts.now ?? new Date()
  const cold = profile.recentStoryIds.length === 0 && profile.recentCategoryIds.length === 0
  const cfReady =
    (opts.cfReaderCount ?? 0) >= (opts.minCfReaders ?? 25) &&
    opts.cfScores &&
    Object.keys(opts.cfScores).length > 0

  const sessionTerms: Record<string, number> = {}
  for (const c of profile.recentCategoryIds) sessionTerms[`cat:${c}`] = (sessionTerms[`cat:${c}`] ?? 0) + 1

  const scored = candidates
    .filter((c) => !c.sponsored)
    .filter((c) => !profile.recentStoryIds.includes(c.id))
    .map((c) => {
      const content = cosine(c.termWeights, sessionTerms)
      const session = profile.recentCategoryIds.includes(c.categoryId ?? '') ? 1 : 0
      const sequence =
        profile.recentCategoryIds[0] && profile.recentCategoryIds[0] === c.categoryId ? 1 : 0
      const collaborative = cfReady ? opts.cfScores?.[c.id] ?? 0 : 0
      const follow = (c.authorIds ?? []).some((a) => profile.followedAuthorIds?.includes(a))
        ? 1
        : 0
      const editorial = c.isBreaking ? 1 : 0
      const raw =
        content * DEFAULT_WEIGHTS.content +
        session * DEFAULT_WEIGHTS.session +
        sequence * DEFAULT_WEIGHTS.sequence +
        collaborative * DEFAULT_WEIGHTS.collaborative +
        freshness(c.publishedAt, now) * DEFAULT_WEIGHTS.freshness +
        follow * DEFAULT_WEIGHTS.follow +
        editorial * DEFAULT_WEIGHTS.editorial
      // ALGO pers.fatigue - repeated impressions dampen the score.
      const fatigue = impressionFatigue(opts.seenCounts?.[c.id] ?? 0)
      return { c, score: raw * fatigue }
    })
    .sort((a, b) => b.score - a.score)

  // ALGO div.category_quota - no category may flood the recommendation window.
  const diversified = categoryQuota(
    scored.map((x) => ({ ...x.c, score: x.score })),
    opts.maxPerCategory ?? 2,
    limit,
  ).slice(0, limit)

  return {
    items: diversified,
    strategy: cold ? 'cold-start' : cfReady ? 'hybrid+cf' : 'hybrid',
  }
}

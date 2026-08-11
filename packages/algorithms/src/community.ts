import { wilsonLowerBound } from './moderation'
import { betaMean } from './stats'
import { freshnessScore } from './scoring'
import { commentSpamScore } from './quality'

/**
 * Community algorithms: comment ranking, Nepali toxicity, thread collapse,
 * reputation, brigading detection, and moderation queue prioritization.
 */

export type RankableComment = {
  id: string
  upvotes: number
  votes: number
  createdAt: string
}

/**
 * ALGO com.rank - comment ranking: Wilson lower bound on approval blended
 * with freshness (6h half-life). Confidence-first, but yesterday's best
 * comment does not pin the thread forever.
 */
export function rankComments<T extends RankableComment>(
  comments: T[],
  now = new Date(),
  weights: { quality: number; freshness: number } = { quality: 0.75, freshness: 0.25 },
): Array<T & { rankScore: number }> {
  return comments
    .map((comment) => {
      const quality = wilsonLowerBound(comment.upvotes, comment.votes)
      const ageHours = Math.max(0, (now.getTime() - new Date(comment.createdAt).getTime()) / 3600_000)
      const fresh = freshnessScore(ageHours, 6)
      return { ...comment, rankScore: quality * weights.quality + fresh * weights.freshness }
    })
    .sort((a, b) => b.rankScore - a.rankScore || a.id.localeCompare(b.id))
}

export type ToxicityLexicon = {
  severe: string[]
  moderate: string[]
  mild: string[]
}

/**
 * ALGO com.toxicity - weighted wordlist toxicity for Nepali + English:
 * severe hits dominate (weight 1.0), moderate 0.5, mild 0.2. Lists are
 * CMS-fed; this is the matching+scoring engine. NFC-normalized substring
 * matching for Devanagari (conjunct-safe), word-boundary for Latin.
 */
export function toxicityScore(text: string, lexicon: ToxicityLexicon): {
  score: number
  hits: Array<{ word: string; tier: 'severe' | 'moderate' | 'mild' }>
} {
  const normalized = text.toLowerCase().normalize('NFC')
  const hits: Array<{ word: string; tier: 'severe' | 'moderate' | 'mild' }> = []
  const matchTier = (words: string[], tier: 'severe' | 'moderate' | 'mild') => {
    for (const raw of words) {
      const word = raw.toLowerCase().normalize('NFC').trim()
      if (!word) continue
      const isDevanagari = /[\u0900-\u097F]/.test(word)
      const matched = isDevanagari
        ? normalized.includes(word)
        : new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(normalized)
      if (matched) hits.push({ word: raw, tier })
    }
  }
  matchTier(lexicon.severe, 'severe')
  matchTier(lexicon.moderate, 'moderate')
  matchTier(lexicon.mild, 'mild')

  const tierWeight = { severe: 1, moderate: 0.5, mild: 0.2 } as const
  const score = Math.min(1, hits.reduce((sum, h) => sum + tierWeight[h.tier], 0))
  return { score, hits }
}

/**
 * ALGO com.thread_collapse - collapse low-value reply chains: thread value
 * = Wilson bound of thread approval, minus a depth tax for sprawling
 * back-and-forth. Collapse when value < threshold and length >= minLength.
 */
export function shouldCollapseThread(
  thread: { upvotes: number; votes: number; replyCount: number },
  opts: { threshold?: number; minLength?: number } = {},
): boolean {
  const threshold = opts.threshold ?? 0.15
  const minLength = opts.minLength ?? 4
  if (thread.replyCount < minLength) return false
  const quality = wilsonLowerBound(thread.upvotes, thread.votes)
  const depthTax = Math.min(0.3, thread.replyCount * 0.01)
  return quality - depthTax < threshold
}

/**
 * ALGO com.reputation - commenter reputation from moderation history:
 * Beta-smoothed accept rate (prior 2 accepts / 2 rejects = neutral 0.5)
 * so two lucky approvals do not mint a trusted account.
 */
export function commenterReputation(accepted: number, rejected: number): number {
  return betaMean(accepted, accepted + rejected, 2, 2)
}

export type BrigadeSignal = {
  brigading: boolean
  score: number
  reasons: string[]
}

/**
 * ALGO com.brigading - brigading detection on one article: comment burst in
 * a short window x source concentration (few ipHashes, many comments) x
 * newness (sources never seen before the window). All three multiply -
 * an organic viral thread has diverse, familiar sources.
 */
export function detectBrigading(
  recentComments: Array<{ ipHash: string; at: string }>,
  knownIpHashes: Set<string>,
  opts: { windowMinutes?: number; minComments?: number; now?: Date } = {},
): BrigadeSignal {
  const windowMinutes = opts.windowMinutes ?? 30
  const minComments = opts.minComments ?? 8
  const now = opts.now ?? new Date()
  const cutoff = now.getTime() - windowMinutes * 60_000
  const inWindow = recentComments.filter((c) => new Date(c.at).getTime() >= cutoff)

  if (inWindow.length < minComments) return { brigading: false, score: 0, reasons: [] }

  const reasons: string[] = [`volume:${inWindow.length}/${windowMinutes}m`]
  const sources = new Set(inWindow.map((c) => c.ipHash))
  // Concentration: 1 when one source wrote everything, ~0 when all distinct.
  const concentration = 1 - (sources.size - 1) / Math.max(1, inWindow.length - 1)
  if (concentration > 0.4) reasons.push(`concentration:${concentration.toFixed(2)}`)

  const newSources = [...sources].filter((s) => !knownIpHashes.has(s)).length
  const newness = sources.size === 0 ? 0 : newSources / sources.size
  if (newness > 0.6) reasons.push(`new-sources:${(newness * 100).toFixed(0)}%`)

  const volumeTerm = Math.min(1, inWindow.length / (minComments * 3))
  const score = volumeTerm * (0.4 + concentration * 0.3 + newness * 0.3)
  return { brigading: score >= 0.4, score, reasons }
}

export type QueueItem = {
  id: string
  body: string
  articleViews15m: number
  createdAt: string
}

/**
 * ALGO com.queue_priority - moderation queue prioritization: review first
 * where (a) the article is hot right now, (b) the comment is borderline
 * (uncertainty peaks near spam 0.5 - obvious spam/ham needs less human
 * time), and (c) the comment has waited long.
 */
export function prioritizeModerationQueue<T extends QueueItem>(
  queue: T[],
  now = new Date(),
): Array<T & { priority: number }> {
  const maxViews = Math.max(1, ...queue.map((q) => q.articleViews15m))
  return queue
    .map((item) => {
      const spam = commentSpamScore(item.body).score
      const uncertainty = 1 - Math.abs(spam - 0.5) * 2 // 1 at 0.5, 0 at extremes
      const visibility = item.articleViews15m / maxViews
      const waitedHours = Math.max(0, (now.getTime() - new Date(item.createdAt).getTime()) / 3600_000)
      const staleness = Math.min(1, waitedHours / 12)
      const priority = visibility * 0.45 + uncertainty * 0.3 + staleness * 0.25
      return { ...item, priority }
    })
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))
}

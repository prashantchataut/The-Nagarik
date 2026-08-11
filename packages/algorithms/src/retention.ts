import { wilsonLowerBound } from './moderation'
import { profileAffinity } from './personalize'
import { categoryQuota } from './diversity'
import { dedupeHeadlines } from './text'

/**
 * Distribution & retention: newsletter selection, send-time optimization,
 * digest dedupe, social card feedback, streaks, and churn risk.
 */

export type NewsletterCandidate = {
  id: string
  categoryId?: string
  title: string
  score: number
}

/**
 * ALGO ret.newsletter_select - per-subscriber newsletter selection:
 * interest-weighted scores, already-read stories excluded, near-duplicate
 * headlines removed, category quota so no digest is five politics stories.
 */
export function selectNewsletterStories(
  candidates: NewsletterCandidate[],
  subscriber: { interests: Map<string, number>; readStoryIds: Set<string> },
  opts: { count?: number; maxPerCategory?: number } = {},
): NewsletterCandidate[] {
  const count = opts.count ?? 5
  const maxPerCategory = opts.maxPerCategory ?? 2
  const scored = candidates
    .filter((c) => !subscriber.readStoryIds.has(c.id))
    .map((c) => ({
      ...c,
      score: c.score * (1 + profileAffinity(subscriber.interests, { categoryId: c.categoryId }) * 2),
    }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
  const deduped = dedupeHeadlines(scored, (c) => c.title)
  return categoryQuota(deduped, maxPerCategory, count).slice(0, count)
}

/**
 * ALGO ret.send_time - send-time optimization: Laplace-smoothed open-hour
 * histogram per subscriber; below minOpens the cohort default wins.
 */
export function bestSendHour(
  openHours: number[],
  opts: { minOpens?: number; defaultHour?: number } = {},
): { hour: number; basis: 'personal' | 'default' } {
  const minOpens = opts.minOpens ?? 5
  const defaultHour = opts.defaultHour ?? 7
  if (openHours.length < minOpens) return { hour: defaultHour, basis: 'default' }
  const counts = new Array<number>(24).fill(1) // Laplace prior
  for (const hour of openHours) {
    counts[((Math.floor(hour) % 24) + 24) % 24] += 1
  }
  let best = 0
  for (let h = 1; h < 24; h++) if (counts[h] > counts[best]) best = h
  return { hour: best, basis: 'personal' }
}

/**
 * ALGO ret.digest_dedupe - digest deduplication: drop stories the reader
 * already read AND stories whose headlines near-duplicate ones already
 * placed in this digest or recently sent ones.
 */
export function dedupeDigest<T extends { id: string; title: string }>(
  stories: T[],
  readStoryIds: Set<string>,
  recentlySentTitles: string[],
): T[] {
  const unread = stories.filter((s) => !readStoryIds.has(s.id))
  const combined = [
    ...recentlySentTitles.map((title, i) => ({ id: `__sent-${i}`, title })),
    ...unread,
  ]
  const deduped = dedupeHeadlines(combined, (s) => s.title)
  return deduped.filter((s): s is T => !s.id.startsWith('__sent-'))
}

export type CardVariant = { id: string; impressions: number; clicks: number }

/**
 * ALGO ret.card_ctr_feedback - social card feedback loop: pick the variant
 * whose Wilson lower bound beats the other's upper-ish estimate; otherwise
 * keep testing. Conservative by construction.
 */
export function socialCardWinner(
  variants: CardVariant[],
  minImpressions = 200,
): { winner: string | null; keepTesting: boolean } {
  if (variants.length < 2 || variants.some((v) => v.impressions < minImpressions)) {
    return { winner: null, keepTesting: true }
  }
  const bounds = variants.map((v) => ({
    id: v.id,
    lower: wilsonLowerBound(v.clicks, v.impressions),
    point: v.impressions === 0 ? 0 : v.clicks / v.impressions,
  }))
  const sorted = [...bounds].sort((a, b) => b.lower - a.lower)
  const [best, second] = sorted
  if (best.lower > second.point) {
    return { winner: best.id, keepTesting: false }
  }
  return { winner: null, keepTesting: true }
}

export type StreakState = {
  current: number
  longest: number
  milestone: number | null
}

/**
 * ALGO ret.streak - reading streak from visit dates (YYYY-MM-DD strings,
 * already in the reader's timezone): consecutive-day chains, longest run,
 * and milestone detection (3/7/30/100).
 */
export function readingStreak(visitDates: string[], today: string): StreakState {
  const days = [...new Set(visitDates)].sort()
  if (!days.length) return { current: 0, longest: 0, milestone: null }

  const toSerial = (d: string) => Math.floor(new Date(`${d}T00:00:00Z`).getTime() / 86_400_000)
  const serials = days.map(toSerial)
  let longest = 1
  let run = 1
  for (let i = 1; i < serials.length; i++) {
    run = serials[i] - serials[i - 1] === 1 ? run + 1 : 1
    longest = Math.max(longest, run)
  }

  // Current streak: must include today or yesterday to still be alive.
  const todaySerial = toSerial(today)
  const daySet = new Set(serials)
  let current = 0
  let cursor = daySet.has(todaySerial) ? todaySerial : todaySerial - 1
  while (daySet.has(cursor)) {
    current += 1
    cursor -= 1
  }

  const milestones = [100, 30, 7, 3]
  const milestone = milestones.find((m) => current === m) ?? null
  return { current, longest: Math.max(longest, current), milestone }
}

export type ChurnRisk = {
  score: number
  bucket: 'healthy' | 'cooling' | 'at-risk' | 'churned'
}

/**
 * ALGO ret.churn_risk - RF-decay churn scoring: recency decays with a
 * 7-day half-life, frequency saturates at ~a visit a day over 30 days.
 * risk = 1 - (0.6 * recency + 0.4 * frequency). Monotonic by construction.
 */
export function churnRisk(
  lastVisitDaysAgo: number,
  visitsLast30Days: number,
): ChurnRisk {
  const recency = Math.pow(0.5, Math.max(0, lastVisitDaysAgo) / 7)
  const frequency = Math.min(1, visitsLast30Days / 30)
  const score = Math.min(1, Math.max(0, 1 - (0.6 * recency + 0.4 * frequency)))
  const bucket =
    score < 0.3 ? 'healthy' : score < 0.6 ? 'cooling' : score < 0.85 ? 'at-risk' : 'churned'
  return { score, bucket }
}

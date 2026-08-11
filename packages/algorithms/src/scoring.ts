import { betaMean } from './stats'

/**
 * Feed scoring functions: the classic, battle-tested formulas news and
 * community sites actually run, implemented exactly.
 */

/**
 * ALGO score.hn_gravity - Hacker News ranking:
 * score = (points - 1) / (ageHours + 2)^gravity, gravity default 1.8.
 */
export function hackerNewsScore(points: number, ageHours: number, gravity = 1.8): number {
  return Math.max(0, points - 1) / Math.pow(Math.max(0, ageHours) + 2, gravity)
}

/**
 * ALGO score.reddit_hot - Reddit "hot": log10 of net votes plus a time term.
 * epochSeconds anchors newer content above older at equal votes.
 */
export function redditHotScore(ups: number, downs: number, epochSeconds: number): number {
  const s = ups - downs
  const order = Math.log10(Math.max(Math.abs(s), 1))
  const sign = s > 0 ? 1 : s < 0 ? -1 : 0
  return Number((sign * order + epochSeconds / 45_000).toFixed(7))
}

/**
 * ALGO score.bayesian_avg - IMDb-style Bayesian average:
 * pulls sparse ratings toward the global mean until n outweighs the prior.
 */
export function bayesianAverage(
  itemMean: number,
  itemCount: number,
  globalMean: number,
  priorWeight = 25,
): number {
  if (itemCount < 0 || priorWeight < 0) return globalMean
  return (itemMean * itemCount + globalMean * priorWeight) / (itemCount + priorWeight)
}

/** ALGO score.freshness - half-life freshness in [0,1]; 0.5 at halfLife. */
export function freshnessScore(ageHours: number, halfLifeHours = 24): number {
  if (halfLifeHours <= 0) return 0
  return Math.pow(0.5, Math.max(0, ageHours) / halfLifeHours)
}

/** ALGO score.ctr - Beta-smoothed click-through rate (safe on zero data). */
export function smoothedCtr(clicks: number, impressions: number, priorCtr = 0.02, priorStrength = 50): number {
  const a = priorCtr * priorStrength
  const b = (1 - priorCtr) * priorStrength
  return betaMean(clicks, impressions, a, b)
}

/**
 * ALGO score.dwell - dwell quality: actual read time vs expected read time,
 * capped at 1.5 so wall-of-tabs sessions cannot dominate.
 */
export function dwellScore(dwellMs: number, expectedReadMinutes: number): number {
  if (expectedReadMinutes <= 0) return 0
  const ratio = dwellMs / (expectedReadMinutes * 60_000)
  return Math.min(1.5, Math.max(0, ratio))
}

/** ALGO score.completion - completion rate in [0,1] with zero-safe division. */
export function completionRate(completions: number, views: number): number {
  if (views <= 0) return 0
  return Math.min(1, Math.max(0, completions / views))
}

/**
 * ALGO score.position_bias - inverse-propensity correction for rank position.
 * Expected attention follows 1/log2(position+1); dividing observed CTR by it
 * makes items at position 8 comparable with items at position 1.
 */
export function positionBiasCorrectedCtr(clicks: number, impressions: number, position: number): number {
  const propensity = 1 / Math.log2(Math.max(1, position) + 1)
  const ctr = smoothedCtr(clicks, impressions)
  return ctr / propensity
}

/**
 * ALGO score.editorial_decay - editorial boost that decays linearly to zero
 * over `decayHours`, so a morning pin does not still dominate at midnight.
 */
export function editorialBoostDecay(boost: number, ageHours: number, decayHours = 12): number {
  if (decayHours <= 0 || boost <= 0) return 0
  const remaining = Math.max(0, 1 - Math.max(0, ageHours) / decayHours)
  return boost * remaining
}

export type EngagementWeights = {
  ctr: number
  dwell: number
  completion: number
  share: number
}

export const DEFAULT_ENGAGEMENT_WEIGHTS: EngagementWeights = {
  ctr: 0.4,
  dwell: 0.3,
  completion: 0.2,
  share: 0.1,
}

/**
 * ALGO score.engagement_composite - normalized engagement blend in [0, ~1.5].
 * Every term is already rate-normalized, so no story wins on volume alone.
 */
export function engagementComposite(
  signals: {
    clicks?: number
    impressions?: number
    dwellMs?: number
    expectedReadMinutes?: number
    completions?: number
    views?: number
    shares?: number
  },
  weights: EngagementWeights = DEFAULT_ENGAGEMENT_WEIGHTS,
): number {
  const ctr = smoothedCtr(signals.clicks ?? 0, signals.impressions ?? 0)
  // Normalize ctr against a strong 10% reference so the term lands in [0,1].
  const ctrTerm = Math.min(1, ctr / 0.1)
  const dwellTerm = dwellScore(signals.dwellMs ?? 0, signals.expectedReadMinutes ?? 3)
  const completionTerm = completionRate(signals.completions ?? 0, signals.views ?? 0)
  const shareTerm = Math.min(1, (signals.shares ?? 0) / Math.max(1, (signals.views ?? 0) * 0.05))
  return (
    ctrTerm * weights.ctr +
    dwellTerm * weights.dwell +
    completionTerm * weights.completion +
    shareTerm * weights.share
  )
}

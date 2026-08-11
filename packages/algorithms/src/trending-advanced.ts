import { mean, poissonTail, regressionSlope, stdDev } from './stats'
import { jaccardSimilarity } from './text'

/**
 * Advanced trending: burst automata, statistical surprise, baselines,
 * clustering, geography, seasonality, lifecycle, and decay fitting.
 */

export type BurstInterval = { start: number; end: number }

/**
 * ALGO trend.kleinberg - Kleinberg's two-state burst automaton over event
 * timestamps (ms). Gap costs -ln(lambda * e^(-lambda * gap)); entering the
 * burst state (rate = s * base) costs gamma * ln(n). Minimum-cost state
 * sequence via Viterbi; returns burst intervals as gap-index ranges.
 */
export function kleinbergBursts(
  timestampsMs: number[],
  opts: { s?: number; gamma?: number } = {},
): BurstInterval[] {
  const s = opts.s ?? 2
  const gamma = opts.gamma ?? 1
  const times = [...timestampsMs].sort((a, b) => a - b)
  if (times.length < 3) return []

  const gaps: number[] = []
  for (let i = 1; i < times.length; i++) gaps.push(Math.max(1, times[i] - times[i - 1]))
  const n = gaps.length
  const total = gaps.reduce((a, b) => a + b, 0)
  const lambda0 = n / total
  const lambda1 = lambda0 * s
  const transitionCost = gamma * Math.log(n + 1)

  const cost = (lambda: number, gap: number) => lambda * gap - Math.log(lambda)

  // Viterbi over states {0: base, 1: burst}.
  let prev0 = cost(lambda0, gaps[0])
  let prev1 = transitionCost + cost(lambda1, gaps[0])
  const back0: number[] = [0]
  const back1: number[] = [0]

  for (let i = 1; i < n; i++) {
    const c0 = cost(lambda0, gaps[i])
    const c1 = cost(lambda1, gaps[i])
    const stay0 = prev0 + c0
    const from1to0 = prev1 + c0
    const next0 = Math.min(stay0, from1to0)
    back0.push(stay0 <= from1to0 ? 0 : 1)
    const stay1 = prev1 + c1
    const from0to1 = prev0 + transitionCost + c1
    const next1 = Math.min(stay1, from0to1)
    back1.push(stay1 <= from0to1 ? 1 : 0)
    prev0 = next0
    prev1 = next1
  }

  // Backtrack.
  const states = new Array<number>(n)
  states[n - 1] = prev1 < prev0 ? 1 : 0
  for (let i = n - 1; i > 0; i--) {
    states[i - 1] = states[i] === 0 ? back0[i] : back1[i]
  }

  const intervals: BurstInterval[] = []
  let start = -1
  for (let i = 0; i < n; i++) {
    if (states[i] === 1 && start === -1) start = i
    if (states[i] === 0 && start !== -1) {
      intervals.push({ start, end: i - 1 })
      start = -1
    }
  }
  if (start !== -1) intervals.push({ start, end: n - 1 })
  return intervals
}

/**
 * ALGO trend.poisson_surprise - how surprising is observing k events when
 * lambda were expected? surprise = -log10 P(X >= k). 2 = a 1-in-100 hour,
 * 3 = 1-in-1000. The units editors can reason about.
 */
export function poissonSurprise(observed: number, expected: number): number {
  if (expected <= 0) return observed > 0 ? 6 : 0
  const p = poissonTail(Math.round(observed), expected)
  if (p <= 0) return 12
  return Math.min(12, -Math.log10(p))
}

export type CategoryNormalizedItem<T> = T & { categoryZ: number }

/**
 * ALGO trend.category_baseline - normalize story velocity against its own
 * category's distribution: politics velocity is judged against politics,
 * sports against sports. Falls back to the global distribution for thin
 * categories (< 3 stories).
 */
export function normalizeByCategoryBaseline<T extends { categoryId?: string; velocity: number }>(
  items: T[],
): Array<CategoryNormalizedItem<T>> {
  const byCategory = new Map<string, number[]>()
  for (const item of items) {
    const key = item.categoryId ?? ''
    byCategory.set(key, [...(byCategory.get(key) ?? []), item.velocity])
  }
  const globalVelocities = items.map((i) => i.velocity)
  const globalMean = mean(globalVelocities)
  const globalSd = stdDev(globalVelocities)

  return items.map((item) => {
    const sample = byCategory.get(item.categoryId ?? '') ?? []
    const useGlobal = sample.length < 3
    const m = useGlobal ? globalMean : mean(sample)
    const sd = useGlobal ? globalSd : stdDev(sample)
    const categoryZ = sd === 0 ? 0 : (item.velocity - m) / sd
    return { ...item, categoryZ }
  })
}

export type TopicCluster = { keywords: string[]; storyIds: string[] }

/**
 * ALGO trend.topic_cluster - cluster bursting keywords by the stories they
 * co-occur in: keywords whose story sets overlap (Jaccard >= threshold)
 * merge into one topic. Greedy agglomeration, deterministic order.
 */
export function clusterTrendingTopics(
  stories: Array<{ id: string; keywords: string[] }>,
  burstingKeywords: string[],
  threshold = 0.5,
): TopicCluster[] {
  const storySets = new Map<string, Set<string>>()
  for (const keyword of burstingKeywords) {
    const set = new Set(
      stories.filter((s) => s.keywords.includes(keyword)).map((s) => s.id),
    )
    if (set.size > 0) storySets.set(keyword, set)
  }

  const clusters: Array<{ keywords: string[]; stories: Set<string> }> = []
  for (const [keyword, set] of storySets) {
    const host = clusters.find((c) => jaccardSimilarity(c.stories, set) >= threshold)
    if (host) {
      host.keywords.push(keyword)
      for (const id of set) host.stories.add(id)
    } else {
      clusters.push({ keywords: [keyword], stories: new Set(set) })
    }
  }
  return clusters
    .map((c) => ({ keywords: c.keywords.sort(), storyIds: [...c.stories].sort() }))
    .sort((a, b) => b.storyIds.length - a.storyIds.length || a.keywords[0].localeCompare(b.keywords[0]))
}

export type ProvinceTrend = {
  province: string
  eventCount: number
  share: number
  topStoryIds: string[]
}

/**
 * ALGO trend.geo - province-level trending: event share per province and
 * the top stories inside each. Provinces below minEvents are omitted
 * (honest cold-start, no fake regional rankings).
 */
export function provinceTrending(
  events: Array<{ storyId: string; province?: string }>,
  opts: { minEvents?: number; topK?: number } = {},
): ProvinceTrend[] {
  const minEvents = opts.minEvents ?? 5
  const topK = opts.topK ?? 3
  const byProvince = new Map<string, Map<string, number>>()
  let total = 0
  for (const event of events) {
    if (!event.province) continue
    total += 1
    const row = byProvince.get(event.province) ?? new Map<string, number>()
    row.set(event.storyId, (row.get(event.storyId) ?? 0) + 1)
    byProvince.set(event.province, row)
  }
  const out: ProvinceTrend[] = []
  for (const [province, counts] of byProvince) {
    const eventCount = [...counts.values()].reduce((a, b) => a + b, 0)
    if (eventCount < minEvents) continue
    const topStoryIds = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, topK)
      .map(([id]) => id)
    out.push({ province, eventCount, share: total === 0 ? 0 : eventCount / total, topStoryIds })
  }
  return out.sort((a, b) => b.eventCount - a.eventCount)
}

/**
 * ALGO trend.hour_of_week - seasonality normalization: divide the observed
 * count by the hour-of-week baseline factor (168 buckets). 9am Sunday
 * traffic is judged against 9am Sundays, not midnight Tuesdays.
 */
export function hourOfWeekNormalize(
  observed: number,
  hourOfWeek: number,
  baseline168: number[],
): number {
  if (baseline168.length !== 168) throw new RangeError('baseline must have 168 buckets')
  const idx = ((Math.floor(hourOfWeek) % 168) + 168) % 168
  const avg = mean(baseline168)
  if (avg === 0) return observed
  const factor = baseline168[idx] / avg
  return factor <= 0 ? observed : observed / factor
}

/** Hour-of-week index (0 = Sunday 00:00 UTC) for a timestamp. */
export function hourOfWeek(date: Date): number {
  return date.getUTCDay() * 24 + date.getUTCHours()
}

export type LifecyclePhase = 'dormant' | 'rising' | 'peak' | 'decaying'

/**
 * ALGO trend.lifecycle - classify a story's traffic phase from its window
 * series: rising (climbing to a fresh max), peak (at/near max, flat),
 * decaying (past max, falling), dormant (no meaningful traffic).
 */
export function lifecyclePhase(countsPerWindow: number[], minTotal = 10): LifecyclePhase {
  const total = countsPerWindow.reduce((a, b) => a + b, 0)
  if (countsPerWindow.length < 3 || total < minTotal) return 'dormant'
  const maxValue = Math.max(...countsPerWindow)
  const maxIdx = countsPerWindow.lastIndexOf(maxValue)
  const tail = countsPerWindow.slice(-3)
  const slope = regressionSlope(tail)
  const last = countsPerWindow[countsPerWindow.length - 1]
  const atEnd = maxIdx >= countsPerWindow.length - 2

  if (atEnd && slope > 0) return 'rising'
  if (last >= maxValue * 0.7 && Math.abs(slope) <= maxValue * 0.1) return 'peak'
  if (slope < 0 || last < maxValue * 0.5) return 'decaying'
  return 'peak'
}

/**
 * ALGO trend.half_life_fit - fit an exponential decay to (ageHours, value)
 * observations via log-linear least squares; returns the half-life in hours
 * or null when the data is not decaying (slope >= 0) or too thin.
 */
export function fitHalfLife(points: Array<{ ageHours: number; value: number }>): number | null {
  const usable = points.filter((p) => p.value > 0 && p.ageHours >= 0)
  if (usable.length < 3) return null
  const xs = usable.map((p) => p.ageHours)
  const ys = usable.map((p) => Math.log(p.value))
  const mx = mean(xs)
  const my = mean(ys)
  let num = 0
  let den = 0
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - mx) * (ys[i] - my)
    den += (xs[i] - mx) ** 2
  }
  if (den === 0) return null
  const slope = num / den
  if (slope >= 0) return null
  return -Math.LN2 / slope
}

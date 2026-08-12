import { ewma, madZScore, winsorize, zScore } from './stats'

/**
 * Velocity, acceleration, and burst detection over event-count windows.
 * Windows are equal-duration buckets ordered oldest -> newest.
 */

/** ALGO vel.velocity - events per minute in the most recent window. */
export function velocity(countsPerWindow: number[], windowMinutes: number): number {
  if (!countsPerWindow.length || windowMinutes <= 0) return 0
  return countsPerWindow[countsPerWindow.length - 1] / windowMinutes
}

/**
 * ALGO vel.acceleration - change in events/minute between the last two
 * windows. Positive = story is speeding up.
 */
export function acceleration(countsPerWindow: number[], windowMinutes: number): number {
  if (countsPerWindow.length < 2 || windowMinutes <= 0) return 0
  const n = countsPerWindow.length
  return (countsPerWindow[n - 1] - countsPerWindow[n - 2]) / windowMinutes
}

export type BurstVerdict = {
  bursting: boolean
  score: number
  method: 'z' | 'mad-z'
}

/**
 * ALGO vel.burst_z - burst detection: is the newest window an outlier
 * against the baseline windows? Uses robust MAD z-score when the baseline
 * has >= 6 windows (spike-resistant), classic z-score otherwise.
 * Default threshold 3 = "three sigma" burst.
 */
export function detectBurst(
  countsPerWindow: number[],
  opts: { threshold?: number; minBaseline?: number } = {},
): BurstVerdict {
  const threshold = opts.threshold ?? 3
  const minBaseline = opts.minBaseline ?? 3
  if (countsPerWindow.length < minBaseline + 1) {
    return { bursting: false, score: 0, method: 'z' }
  }
  const baseline = countsPerWindow.slice(0, -1)
  const current = countsPerWindow[countsPerWindow.length - 1]
  const robust = baseline.length >= 6
  let score = robust ? madZScore(current, baseline) : zScore(current, baseline)

  // Flat baseline (zero spread) breaks both z-scores. A jump from a flat
  // floor is the clearest burst there is: score it by fold-change instead.
  if (score === 0) {
    const m = baseline.reduce((a, b) => a + b, 0) / baseline.length
    const flat = baseline.every((v) => v === baseline[0])
    if (flat && current > m) {
      score = m === 0 ? current : ((current - m) / Math.max(m, 1)) * threshold
    }
  }

  return { bursting: score >= threshold, score, method: robust ? 'mad-z' : 'z' }
}

export type BurstState = 'quiet' | 'bursting'

/**
 * ALGO vel.burst_hysteresis - two-state burst machine with separate enter
 * and exit thresholds so stories do not flap in and out of "trending".
 */
export function stepBurstState(
  previous: BurstState,
  burstScore: number,
  opts: { enter?: number; exit?: number } = {},
): BurstState {
  const enter = opts.enter ?? 3
  const exit = opts.exit ?? 1.5
  if (previous === 'quiet') return burstScore >= enter ? 'bursting' : 'quiet'
  return burstScore <= exit ? 'quiet' : 'bursting'
}

/** ALGO vel.ewma_velocity - smoothed velocity series (alpha default 0.4). */
export function ewmaVelocity(
  countsPerWindow: number[],
  windowMinutes: number,
  alpha = 0.4,
): number {
  if (!countsPerWindow.length || windowMinutes <= 0) return 0
  const perMinute = countsPerWindow.map((c) => c / windowMinutes)
  const smoothed = ewma(perMinute, alpha)
  return smoothed[smoothed.length - 1]
}

/**
 * ALGO vel.spike_guard - winsorized copy of a window series so a single
 * bot-driven spike cannot dominate baseline statistics.
 */
export function spikeGuard(countsPerWindow: number[]): number[] {
  return winsorize(countsPerWindow, 5, 95)
}

/** ALGO rank.half_life - exponential decay factory: value 0.5 at halfLife. */
export function halfLifeDecay(halfLifeHours: number): (ageHours: number) => number {
  if (halfLifeHours <= 0) throw new RangeError('halfLifeHours must be > 0')
  return (ageHours: number) => Math.pow(0.5, Math.max(0, ageHours) / halfLifeHours)
}

export type VelocityRankedItem<T> = T & {
  velocityScore: number
  bursting: boolean
}

/**
 * ALGO vel.velocity_rank - rank stories by smoothed velocity x freshness,
 * with a burst multiplier. The composite that "velocity ranking" means in
 * newsroom dashboards: fast AND fresh beats big AND old.
 */
export function velocityRank<T extends { id: string; publishedAt?: string }>(
  stories: T[],
  windows: Map<string, number[]>,
  opts: { windowMinutes?: number; halfLifeHours?: number; limit?: number } = {},
  now = new Date(),
): Array<VelocityRankedItem<T>> {
  const windowMinutes = opts.windowMinutes ?? 15
  const decay = halfLifeDecay(opts.halfLifeHours ?? 6)
  const limit = opts.limit ?? 10

  return stories
    .map((story) => {
      const counts = windows.get(story.id) ?? []
      const v = ewmaVelocity(spikeGuard(counts), windowMinutes)
      const burst = detectBurst(counts)
      const ageHours = story.publishedAt
        ? Math.max(0, (now.getTime() - new Date(story.publishedAt).getTime()) / 3600_000)
        : 48
      const velocityScore = v * (burst.bursting ? 1 + Math.min(burst.score, 6) * 0.25 : 1) * decay(ageHours)
      return { ...story, velocityScore, bursting: burst.bursting }
    })
    .filter((s) => s.velocityScore > 0)
    .sort((a, b) => b.velocityScore - a.velocityScore)
    .slice(0, limit)
}

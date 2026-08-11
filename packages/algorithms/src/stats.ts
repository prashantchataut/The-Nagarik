/**
 * Statistical primitives shared by ranking, trending, and experimentation.
 * All functions are pure and deterministic; randomness is injected.
 */

/** ALGO stats.mean - arithmetic mean. Returns 0 for empty input. */
export function mean(values: number[]): number {
  if (!values.length) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

/** ALGO stats.std_dev - population standard deviation. */
export function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const m = mean(values)
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)))
}

/** ALGO stats.sma - simple moving average over a trailing window. */
export function simpleMovingAverage(values: number[], window: number): number[] {
  if (window <= 0) return []
  const out: number[] = []
  let sum = 0
  for (let i = 0; i < values.length; i++) {
    sum += values[i]
    if (i >= window) sum -= values[i - window]
    out.push(sum / Math.min(i + 1, window))
  }
  return out
}

/** ALGO stats.ewma - exponentially weighted moving average (alpha in (0,1]). */
export function ewma(values: number[], alpha: number): number[] {
  if (alpha <= 0 || alpha > 1) throw new RangeError('alpha must be in (0, 1]')
  const out: number[] = []
  let prev: number | null = null
  for (const v of values) {
    prev = prev === null ? v : alpha * v + (1 - alpha) * prev
    out.push(prev)
  }
  return out
}

/** ALGO stats.z_score - standard score of x against a sample. 0 when flat. */
export function zScore(x: number, sample: number[]): number {
  const sd = stdDev(sample)
  if (sd === 0) return 0
  return (x - mean(sample)) / sd
}

/** ALGO stats.mad - median absolute deviation (robust spread). */
export function medianAbsoluteDeviation(values: number[]): number {
  if (!values.length) return 0
  const med = percentile(values, 50)
  return percentile(values.map((v) => Math.abs(v - med)), 50)
}

/**
 * ALGO stats.mad_z - robust z-score using MAD (x1.4826 normal consistency).
 * Far less sensitive to traffic spikes than classic z-score.
 */
export function madZScore(x: number, sample: number[]): number {
  const mad = medianAbsoluteDeviation(sample)
  if (mad === 0) return 0
  const med = percentile(sample, 50)
  return (x - med) / (1.4826 * mad)
}

/** ALGO stats.percentile - linear-interpolated percentile (p in [0,100]). */
export function percentile(values: number[], p: number): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const clamped = Math.min(100, Math.max(0, p))
  const idx = (clamped / 100) * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

/** ALGO stats.laplace - additive smoothing for count proportions. */
export function laplaceSmooth(successes: number, trials: number, alpha = 1, categories = 2): number {
  return (successes + alpha) / (trials + alpha * categories)
}

/**
 * ALGO stats.beta_mean - posterior mean of a Beta-Bernoulli model.
 * The standard smoothed CTR: (clicks + a) / (impressions + a + b).
 */
export function betaMean(successes: number, trials: number, priorA = 1, priorB = 49): number {
  return (successes + priorA) / (trials + priorA + priorB)
}

export type TwoProportionResult = {
  z: number
  pValue: number
  significant: boolean
}

/**
 * ALGO stats.two_proportion_z - two-proportion z-test (two-tailed).
 * Standard A/B conversion significance test.
 */
export function twoProportionZTest(
  successesA: number,
  trialsA: number,
  successesB: number,
  trialsB: number,
  alpha = 0.05,
): TwoProportionResult {
  if (trialsA === 0 || trialsB === 0) return { z: 0, pValue: 1, significant: false }
  const pA = successesA / trialsA
  const pB = successesB / trialsB
  const pooled = (successesA + successesB) / (trialsA + trialsB)
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / trialsA + 1 / trialsB))
  if (se === 0) return { z: 0, pValue: 1, significant: false }
  const z = (pA - pB) / se
  const pValue = 2 * (1 - standardNormalCdf(Math.abs(z)))
  return { z, pValue, significant: pValue < alpha }
}

/** Abramowitz-Stegun approximation of the standard normal CDF (|err| < 7.5e-8). */
export function standardNormalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x))
  const d = 0.3989422804014327 * Math.exp((-x * x) / 2)
  const poly =
    t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
  const cdf = 1 - d * poly
  return x >= 0 ? cdf : 1 - cdf
}

/** ALGO stats.regression_slope - least-squares slope over (index, value) points. */
export function regressionSlope(values: number[]): number {
  const n = values.length
  if (n < 2) return 0
  const xs = values.map((_, i) => i)
  const mx = mean(xs)
  const my = mean(values)
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (values[i] - my)
    den += (xs[i] - mx) ** 2
  }
  return den === 0 ? 0 : num / den
}

/** ALGO stats.minmax - min-max normalization onto [0,1]. Flat input maps to 0. */
export function normalizeMinMax(values: number[]): number[] {
  if (!values.length) return []
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  if (hi === lo) return values.map(() => 0)
  return values.map((v) => (v - lo) / (hi - lo))
}

/** ALGO stats.softmax - temperature-scaled softmax distribution. */
export function softmax(values: number[], temperature = 1): number[] {
  if (!values.length) return []
  if (temperature <= 0) throw new RangeError('temperature must be > 0')
  const maxV = Math.max(...values)
  const exps = values.map((v) => Math.exp((v - maxV) / temperature))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum)
}

export type SessionizedEvent<T> = T & { sessionIndex: number }

/**
 * ALGO stats.sessionize - split a user's timestamped events into sessions
 * using an inactivity gap (default 30 minutes, the industry standard).
 */
export function sessionize<T extends { at: string }>(
  events: T[],
  gapMinutes = 30,
): Array<SessionizedEvent<T>> {
  const sorted = [...events].sort((a, b) => a.at.localeCompare(b.at))
  const gapMs = gapMinutes * 60_000
  let session = 0
  let lastTime: number | null = null
  return sorted.map((event) => {
    const t = new Date(event.at).getTime()
    if (lastTime !== null && t - lastTime > gapMs) session += 1
    lastTime = t
    return { ...event, sessionIndex: session }
  })
}

/** ALGO stats.winsorize - clamp outliers to the given percentile bounds. */
export function winsorize(values: number[], lowerP = 5, upperP = 95): number[] {
  if (!values.length) return []
  const lo = percentile(values, lowerP)
  const hi = percentile(values, upperP)
  return values.map((v) => Math.min(hi, Math.max(lo, v)))
}

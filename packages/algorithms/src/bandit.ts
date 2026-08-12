import { fnv1a32 } from './text'
import { twoProportionZTest } from './stats'

/**
 * Multi-armed bandits and experiment assignment.
 * Randomness is always injected (rng: () => number in [0,1)) so every
 * decision is reproducible in tests.
 */

export type Arm = {
  id: string
  pulls: number
  rewards: number
}

/**
 * ALGO exp.epsilon_greedy - explore with probability epsilon, otherwise
 * exploit the best observed mean. Unpulled arms are tried first.
 */
export function epsilonGreedy(arms: Arm[], epsilon: number, rng: () => number): string {
  if (!arms.length) throw new RangeError('at least one arm required')
  const unpulled = arms.find((a) => a.pulls === 0)
  if (unpulled) return unpulled.id
  if (rng() < epsilon) {
    return arms[Math.floor(rng() * arms.length)].id
  }
  return [...arms].sort(
    (a, b) => b.rewards / b.pulls - a.rewards / a.pulls || a.id.localeCompare(b.id),
  )[0].id
}

/**
 * ALGO exp.ucb1 - Upper Confidence Bound:
 * pick argmax( mean + sqrt(2 ln totalPulls / pulls) ).
 * Optimism under uncertainty; no randomness needed.
 */
export function ucb1(arms: Arm[]): string {
  if (!arms.length) throw new RangeError('at least one arm required')
  const unpulled = arms.find((a) => a.pulls === 0)
  if (unpulled) return unpulled.id
  const total = arms.reduce((sum, a) => sum + a.pulls, 0)
  return [...arms]
    .map((a) => ({
      id: a.id,
      value: a.rewards / a.pulls + Math.sqrt((2 * Math.log(total)) / a.pulls),
    }))
    .sort((x, y) => y.value - x.value || x.id.localeCompare(y.id))[0].id
}

/** Marsaglia-Tsang gamma sampler (shape >= 0), used by the Beta sampler. */
export function gammaSample(shape: number, rng: () => number): number {
  if (shape <= 0) return 0
  if (shape < 1) {
    // Johnk boost for shape < 1.
    const u = Math.max(rng(), Number.EPSILON)
    return gammaSample(shape + 1, rng) * Math.pow(u, 1 / shape)
  }
  const d = shape - 1 / 3
  const c = 1 / Math.sqrt(9 * d)
  for (;;) {
    let x: number
    let v: number
    do {
      x = normalFromUniform(rng)
      v = 1 + c * x
    } while (v <= 0)
    v = v * v * v
    const u = Math.max(rng(), Number.EPSILON)
    if (u < 1 - 0.0331 * x * x * x * x) return d * v
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v
  }
}

/** Box-Muller standard normal from a uniform RNG. */
function normalFromUniform(rng: () => number): number {
  const u1 = Math.max(rng(), Number.EPSILON)
  const u2 = rng()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

/** ALGO exp.beta_sample - Beta(a,b) sample via two gamma draws. */
export function betaSample(a: number, b: number, rng: () => number): number {
  const x = gammaSample(a, rng)
  const y = gammaSample(b, rng)
  if (x + y === 0) return 0.5
  return x / (x + y)
}

/**
 * ALGO exp.thompson - Thompson sampling over Bernoulli arms:
 * sample Beta(rewards+1, pulls-rewards+1) per arm, pick the max.
 * The self-correcting default for module ordering experiments.
 */
export function thompsonSample(arms: Arm[], rng: () => number): string {
  if (!arms.length) throw new RangeError('at least one arm required')
  let bestId = arms[0].id
  let bestDraw = -1
  for (const arm of arms) {
    const draw = betaSample(arm.rewards + 1, Math.max(0, arm.pulls - arm.rewards) + 1, rng)
    if (draw > bestDraw) {
      bestDraw = draw
      bestId = arm.id
    }
  }
  return bestId
}

/**
 * ALGO exp.assign_bucket - deterministic experiment bucketing:
 * hash(unitId:experimentId) mod 10000 -> weighted variant. Same unit always
 * gets the same variant; no storage needed.
 */
export function assignBucket(
  unitId: string,
  experimentId: string,
  variants: Array<{ id: string; weight: number }>,
): string {
  if (!variants.length) throw new RangeError('at least one variant required')
  const totalWeight = variants.reduce((sum, v) => sum + Math.max(0, v.weight), 0)
  if (totalWeight <= 0) throw new RangeError('total weight must be > 0')
  const bucket = fnv1a32(`${unitId}:${experimentId}`) % 10_000
  let cursor = 0
  for (const variant of variants) {
    cursor += (Math.max(0, variant.weight) / totalWeight) * 10_000
    if (bucket < cursor) return variant.id
  }
  return variants[variants.length - 1].id
}

/**
 * ALGO exp.srm - sample ratio mismatch check: is the observed split
 * significantly different from the intended split? Uses a two-proportion
 * z-test at alpha=0.001 (SRM must be a loud, rare alarm).
 */
export function sampleRatioMismatch(
  observedA: number,
  observedB: number,
  expectedRatioA = 0.5,
): { mismatch: boolean; pValue: number } {
  const total = observedA + observedB
  if (total === 0) return { mismatch: false, pValue: 1 }
  const expectedA = total * expectedRatioA
  const expectedB = total * (1 - expectedRatioA)
  const result = twoProportionZTest(observedA, total, Math.round(expectedA), Math.round(expectedA + expectedB), 0.001)
  return { mismatch: result.significant, pValue: result.pValue }
}

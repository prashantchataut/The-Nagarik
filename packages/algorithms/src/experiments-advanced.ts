import { lnGamma, mean, standardNormalCdf } from './stats'

/**
 * Advanced experimentation: exposure joins, Bayesian early stopping, CUPED
 * variance reduction, multi-variant SRM, and guardrail monitoring.
 */

export type Exposure = { unitId: string; variant: string }
export type MetricEvent = { unitId: string; value: number }

export type VariantMetrics = {
  variant: string
  units: number
  convertedUnits: number
  totalValue: number
  meanValue: number
}

/**
 * ALGO exp.exposure_join - join exposures with metric events per variant.
 * Units count once; a unit's events only attribute to its assigned variant
 * (intent-to-treat).
 */
export function joinExposuresWithEvents(
  exposures: Exposure[],
  events: MetricEvent[],
): VariantMetrics[] {
  const assignment = new Map<string, string>()
  for (const exposure of exposures) {
    // First exposure wins - stable ITT assignment.
    if (!assignment.has(exposure.unitId)) assignment.set(exposure.unitId, exposure.variant)
  }
  const byVariant = new Map<string, { units: Set<string>; converted: Set<string>; total: number }>()
  for (const [unit, variant] of assignment) {
    const row = byVariant.get(variant) ?? { units: new Set(), converted: new Set(), total: 0 }
    row.units.add(unit)
    byVariant.set(variant, row)
  }
  for (const event of events) {
    const variant = assignment.get(event.unitId)
    if (!variant) continue
    const row = byVariant.get(variant)!
    row.converted.add(event.unitId)
    row.total += event.value
  }
  return [...byVariant.entries()]
    .map(([variant, row]) => ({
      variant,
      units: row.units.size,
      convertedUnits: row.converted.size,
      totalValue: row.total,
      meanValue: row.units.size === 0 ? 0 : row.total / row.units.size,
    }))
    .sort((a, b) => a.variant.localeCompare(b.variant))
}

/**
 * ALGO exp.bayes_stop - Bayesian early stopping: exact P(B > A) for two
 * Beta-Bernoulli posteriors via the closed-form sum
 * P = sum_i [ B(aA+i, bA+bB) / ((bB+i) B(1+i, bB) B(aA, bA)) ]
 * computed in log space with lnGamma. Stop when P >= stopAt or <= 1-stopAt.
 */
export function probabilityBBeatsA(
  successesA: number,
  trialsA: number,
  successesB: number,
  trialsB: number,
): number {
  const aA = successesA + 1
  const bA = trialsA - successesA + 1
  const aB = successesB + 1
  const bB = trialsB - successesB + 1

  const lnBeta = (x: number, y: number) => lnGamma(x) + lnGamma(y) - lnGamma(x + y)
  let total = 0
  for (let i = 0; i < aB; i++) {
    total += Math.exp(
      lnBeta(aA + i, bA + bB) - Math.log(bB + i) - lnBeta(1 + i, bB) - lnBeta(aA, bA),
    )
  }
  return Math.min(1, Math.max(0, total))
}

export function bayesianEarlyStop(
  successesA: number,
  trialsA: number,
  successesB: number,
  trialsB: number,
  stopAt = 0.95,
): { pBBeatsA: number; decision: 'stop-b-wins' | 'stop-a-wins' | 'continue' } {
  const p = probabilityBBeatsA(successesA, trialsA, successesB, trialsB)
  if (p >= stopAt) return { pBBeatsA: p, decision: 'stop-b-wins' }
  if (p <= 1 - stopAt) return { pBBeatsA: p, decision: 'stop-a-wins' }
  return { pBBeatsA: p, decision: 'continue' }
}

/**
 * ALGO exp.cuped - CUPED variance reduction: adjust the experiment metric
 * with pre-experiment data. theta = cov(pre, post) / var(pre);
 * adjusted_i = post_i - theta * (pre_i - mean(pre)). Same mean, lower
 * variance, tighter experiments.
 */
export function cupedAdjust(
  pairs: Array<{ pre: number; post: number }>,
): { adjusted: number[]; theta: number; varianceReductionPct: number } {
  if (pairs.length < 3) {
    return { adjusted: pairs.map((p) => p.post), theta: 0, varianceReductionPct: 0 }
  }
  const preMean = mean(pairs.map((p) => p.pre))
  const postMean = mean(pairs.map((p) => p.post))
  let cov = 0
  let varPre = 0
  for (const { pre, post } of pairs) {
    cov += (pre - preMean) * (post - postMean)
    varPre += (pre - preMean) ** 2
  }
  if (varPre === 0) {
    return { adjusted: pairs.map((p) => p.post), theta: 0, varianceReductionPct: 0 }
  }
  const theta = cov / varPre
  const adjusted = pairs.map((p) => p.post - theta * (p.pre - preMean))

  const variance = (values: number[]) => {
    const m = mean(values)
    return mean(values.map((v) => (v - m) ** 2))
  }
  const before = variance(pairs.map((p) => p.post))
  const after = variance(adjusted)
  const varianceReductionPct = before === 0 ? 0 : Math.max(0, (1 - after / before) * 100)
  return { adjusted, theta, varianceReductionPct }
}

/**
 * Regularized upper incomplete gamma Q(s, x) via series/continued fraction
 * (Numerical Recipes gammp/gammq) - powers the chi-square survival function.
 */
export function gammaQ(s: number, x: number): number {
  if (x < 0 || s <= 0) return 1
  if (x === 0) return 1
  if (x < s + 1) {
    // Series for P, return 1 - P.
    let sum = 1 / s
    let term = sum
    for (let n = 1; n < 200; n++) {
      term *= x / (s + n)
      sum += term
      if (Math.abs(term) < Math.abs(sum) * 1e-12) break
    }
    const p = sum * Math.exp(-x + s * Math.log(x) - lnGamma(s))
    return Math.min(1, Math.max(0, 1 - p))
  }
  // Continued fraction for Q directly.
  let b = x + 1 - s
  let c = 1e300
  let d = 1 / b
  let h = d
  for (let i = 1; i < 200; i++) {
    const an = -i * (i - s)
    b += 2
    d = an * d + b
    if (Math.abs(d) < 1e-300) d = 1e-300
    c = b + an / c
    if (Math.abs(c) < 1e-300) c = 1e-300
    d = 1 / d
    const delta = d * c
    h *= delta
    if (Math.abs(delta - 1) < 1e-12) break
  }
  const q = h * Math.exp(-x + s * Math.log(x) - lnGamma(s))
  return Math.min(1, Math.max(0, q))
}

/**
 * ALGO exp.srm_chi2 - multi-variant sample ratio mismatch: chi-square
 * goodness-of-fit of observed unit counts against intended weights.
 * Alarm at p < 0.001 (SRM must be rare and loud).
 */
export function multiVariantSrm(
  observed: Array<{ variant: string; units: number }>,
  intendedWeights: Array<{ variant: string; weight: number }>,
  alpha = 0.001,
): { chi2: number; pValue: number; mismatch: boolean } {
  const total = observed.reduce((sum, o) => sum + o.units, 0)
  const weightTotal = intendedWeights.reduce((sum, w) => sum + w.weight, 0)
  if (total === 0 || weightTotal === 0 || observed.length < 2) {
    return { chi2: 0, pValue: 1, mismatch: false }
  }
  let chi2 = 0
  for (const row of observed) {
    const weight = intendedWeights.find((w) => w.variant === row.variant)?.weight ?? 0
    const expected = (weight / weightTotal) * total
    if (expected <= 0) continue
    chi2 += (row.units - expected) ** 2 / expected
  }
  const dof = observed.length - 1
  const pValue = gammaQ(dof / 2, chi2 / 2)
  return { chi2, pValue, mismatch: pValue < alpha }
}

export type GuardrailCheck = {
  breached: boolean
  z: number
  relativeChange: number
}

/**
 * ALGO exp.guardrail - guardrail monitor: one-sided z-test that the
 * treatment's guardrail metric (e.g. retention) has NOT degraded more than
 * the tolerated relative amount. Breach => auto-halt recommendation.
 */
export function guardrailBreached(
  control: { successes: number; trials: number },
  treatment: { successes: number; trials: number },
  opts: { toleratedRelativeDrop?: number; alpha?: number } = {},
): GuardrailCheck {
  const tolerated = opts.toleratedRelativeDrop ?? 0.02
  const alpha = opts.alpha ?? 0.05
  if (control.trials === 0 || treatment.trials === 0) {
    return { breached: false, z: 0, relativeChange: 0 }
  }
  const pC = control.successes / control.trials
  const pT = treatment.successes / treatment.trials
  const relativeChange = pC === 0 ? 0 : (pT - pC) / pC
  const threshold = pC * (1 - tolerated)
  const se = Math.sqrt((pT * (1 - pT)) / treatment.trials + (pC * (1 - pC)) / control.trials)
  if (se === 0) return { breached: false, z: 0, relativeChange }
  // H0: pT >= threshold. Reject (breach) when z is significantly below.
  const z = (pT - threshold) / se
  const pValue = standardNormalCdf(z)
  return { breached: pValue < alpha, z, relativeChange }
}

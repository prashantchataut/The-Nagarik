import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  betaMean,
  ewma,
  laplaceSmooth,
  mean,
  medianAbsoluteDeviation,
  madZScore,
  normalizeMinMax,
  percentile,
  regressionSlope,
  sessionize,
  simpleMovingAverage,
  softmax,
  standardNormalCdf,
  stdDev,
  twoProportionZTest,
  winsorize,
  zScore,
} from './stats'
import {
  acceleration,
  detectBurst,
  ewmaVelocity,
  halfLifeDecay,
  spikeGuard,
  stepBurstState,
  velocity,
  velocityRank,
} from './velocity'
import {
  bayesianAverage,
  completionRate,
  dwellScore,
  editorialBoostDecay,
  engagementComposite,
  freshnessScore,
  hackerNewsScore,
  positionBiasCorrectedCtr,
  redditHotScore,
  smoothedCtr,
} from './scoring'

const approx = (actual: number, expected: number, eps = 1e-6) =>
  assert.ok(Math.abs(actual - expected) < eps, `expected ~${expected}, got ${actual}`)

describe('stats primitives', () => {
  it('mean / stdDev match hand-computed values', () => {
    assert.equal(mean([1, 2, 3]), 2)
    assert.equal(mean([]), 0)
    // Classic population SD example.
    assert.equal(stdDev([2, 4, 4, 4, 5, 5, 7, 9]), 2)
  })

  it('simple moving average', () => {
    assert.deepEqual(simpleMovingAverage([1, 2, 3, 4], 2), [1, 1.5, 2.5, 3.5])
    assert.deepEqual(simpleMovingAverage([], 3), [])
  })

  it('ewma smooths with the given alpha', () => {
    assert.deepEqual(ewma([1, 1, 10], 0.5), [1, 1, 5.5])
    assert.throws(() => ewma([1], 0))
  })

  it('percentile with linear interpolation', () => {
    assert.equal(percentile([1, 2, 3, 4], 50), 2.5)
    assert.equal(percentile([3, 1, 2], 0), 1)
    assert.equal(percentile([3, 1, 2], 100), 3)
    assert.equal(percentile([], 50), 0)
  })

  it('z-score and robust MAD z-score', () => {
    assert.equal(zScore(9, [2, 4, 4, 4, 5, 5, 7, 9]), 2)
    assert.equal(zScore(5, [3, 3, 3]), 0, 'flat sample yields 0')
    assert.equal(medianAbsoluteDeviation([1, 1, 2, 2, 4, 6, 9]), 1)
    approx(madZScore(9, [1, 1, 2, 2, 4, 6, 9]), (9 - 2) / 1.4826, 1e-4)
  })

  it('smoothing: laplace and beta-mean', () => {
    assert.equal(laplaceSmooth(0, 0), 0.5)
    assert.equal(betaMean(0, 0, 1, 49), 0.02)
    approx(betaMean(10, 100, 1, 49), 11 / 150)
  })

  it('two-proportion z-test flags a real conversion difference', () => {
    const result = twoProportionZTest(200, 1000, 150, 1000)
    approx(result.z, 2.9423, 1e-3)
    assert.ok(result.pValue < 0.01)
    assert.equal(result.significant, true)

    const noDiff = twoProportionZTest(100, 1000, 100, 1000)
    assert.equal(noDiff.significant, false)
    assert.equal(twoProportionZTest(0, 0, 5, 10).significant, false)
  })

  it('standard normal CDF sanity', () => {
    approx(standardNormalCdf(0), 0.5, 1e-6)
    approx(standardNormalCdf(1.96), 0.975, 1e-3)
    approx(standardNormalCdf(-1.96), 0.025, 1e-3)
  })

  it('regression slope detects trend direction', () => {
    assert.equal(regressionSlope([1, 2, 3]), 1)
    assert.equal(regressionSlope([3, 3, 3]), 0)
    assert.ok(regressionSlope([9, 6, 3]) < 0)
  })

  it('normalization utilities', () => {
    assert.deepEqual(normalizeMinMax([2, 4, 6]), [0, 0.5, 1])
    assert.deepEqual(normalizeMinMax([5, 5]), [0, 0])
    const sm = softmax([1, 1])
    approx(sm[0], 0.5)
    approx(sm.reduce((a, b) => a + b, 0), 1)
  })

  it('sessionize splits on the inactivity gap', () => {
    const t0 = new Date('2026-01-01T08:00:00Z')
    const at = (min: number) => new Date(t0.getTime() + min * 60_000).toISOString()
    const events = [{ at: at(0) }, { at: at(10) }, { at: at(60) }, { at: at(65) }]
    const sessions = sessionize(events, 30).map((e) => e.sessionIndex)
    assert.deepEqual(sessions, [0, 0, 1, 1])
  })

  it('winsorize clamps outliers but keeps order', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1000]
    const guarded = winsorize(values, 5, 95)
    assert.ok(Math.max(...guarded) < 1000)
    assert.equal(guarded.length, values.length)
  })
})

describe('velocity and burst detection', () => {
  it('velocity and acceleration from windows', () => {
    assert.equal(velocity([30], 15), 2)
    assert.equal(velocity([], 15), 0)
    assert.equal(acceleration([15, 30], 15), 1)
    assert.equal(acceleration([30, 15], 15), -1)
  })

  it('detects a burst against a flat baseline (fold-change fallback)', () => {
    const verdict = detectBurst([2, 2, 2, 20])
    assert.equal(verdict.bursting, true)
    assert.equal(detectBurst([5, 5, 5, 5]).bursting, false)
    assert.equal(detectBurst([2, 2]).bursting, false, 'insufficient baseline')
  })

  it('detects a burst against a noisy baseline (robust path)', () => {
    const noisy = [4, 5, 3, 6, 4, 5, 4, 40]
    const verdict = detectBurst(noisy)
    assert.equal(verdict.method, 'mad-z')
    assert.equal(verdict.bursting, true)
    assert.equal(detectBurst([4, 5, 3, 6, 4, 5, 4, 5]).bursting, false)
  })

  it('burst hysteresis prevents flapping', () => {
    assert.equal(stepBurstState('quiet', 3.2), 'bursting')
    assert.equal(stepBurstState('quiet', 2.5), 'quiet')
    assert.equal(stepBurstState('bursting', 2.0), 'bursting', 'stays in until exit threshold')
    assert.equal(stepBurstState('bursting', 1.2), 'quiet')
  })

  it('ewma velocity and half-life decay', () => {
    assert.equal(ewmaVelocity([15, 45], 15, 0.5), 2)
    const decay = halfLifeDecay(6)
    assert.equal(decay(0), 1)
    approx(decay(6), 0.5)
    approx(decay(12), 0.25)
    assert.throws(() => halfLifeDecay(0))
  })

  it('spike guard bounds a bot spike', () => {
    const guarded = spikeGuard([3, 4, 3, 5, 4, 3, 4, 5, 3, 500])
    assert.ok(Math.max(...guarded) < 500)
  })

  it('velocity rank orders fast+fresh above slow, flags bursts', () => {
    const now = new Date('2026-01-01T12:00:00Z')
    const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600_000).toISOString()
    const stories = [
      { id: 'fast-fresh', publishedAt: hoursAgo(1) },
      { id: 'slow-fresh', publishedAt: hoursAgo(1) },
      { id: 'fast-old', publishedAt: hoursAgo(30) },
    ]
    const windows = new Map<string, number[]>([
      ['fast-fresh', [2, 2, 2, 30]],
      ['slow-fresh', [2, 2, 2, 2]],
      ['fast-old', [2, 2, 2, 30]],
    ])
    const ranked = velocityRank(stories, windows, {}, now)
    assert.equal(ranked[0].id, 'fast-fresh')
    assert.equal(ranked[0].bursting, true)
    const fastOld = ranked.find((r) => r.id === 'fast-old')
    assert.ok(fastOld && fastOld.velocityScore < ranked[0].velocityScore)
  })
})

describe('feed scoring formulas', () => {
  it('hacker news gravity', () => {
    approx(hackerNewsScore(101, 0), 100 / Math.pow(2, 1.8))
    assert.equal(hackerNewsScore(1, 5), 0)
    assert.ok(hackerNewsScore(50, 1) > hackerNewsScore(50, 10), 'age decays score')
  })

  it('reddit hot', () => {
    assert.equal(redditHotScore(1, 0, 0), 0)
    approx(redditHotScore(11, 1, 0), 1)
    assert.ok(
      redditHotScore(10, 0, 1_000_000) > redditHotScore(10, 0, 0),
      'newer wins at equal votes',
    )
    assert.ok(redditHotScore(0, 10, 500_000) < redditHotScore(10, 0, 500_000))
  })

  it('bayesian average pulls sparse items toward the global mean', () => {
    assert.equal(bayesianAverage(5, 0, 3, 25), 3)
    approx(bayesianAverage(5, 100, 3, 25), (500 + 75) / 125)
    assert.ok(bayesianAverage(5, 3, 3, 25) < 4, 'three ratings cannot claim a 5')
  })

  it('freshness, ctr smoothing, dwell, completion', () => {
    approx(freshnessScore(24, 24), 0.5)
    assert.equal(freshnessScore(0), 1)
    approx(smoothedCtr(0, 0), 0.02)
    approx(smoothedCtr(10, 100), 11 / 150)
    approx(dwellScore(90_000, 3), 0.5)
    assert.equal(dwellScore(10_000_000, 3), 1.5, 'capped')
    assert.equal(completionRate(5, 10), 0.5)
    assert.equal(completionRate(5, 0), 0)
  })

  it('position bias correction equalizes rank positions', () => {
    const atTop = positionBiasCorrectedCtr(10, 100, 1)
    approx(atTop, smoothedCtr(10, 100))
    approx(positionBiasCorrectedCtr(10, 100, 3), smoothedCtr(10, 100) * 2)
  })

  it('editorial boost decays to zero', () => {
    assert.equal(editorialBoostDecay(10, 6, 12), 5)
    assert.equal(editorialBoostDecay(10, 15, 12), 0)
    assert.equal(editorialBoostDecay(0, 1, 12), 0)
  })

  it('engagement composite is rate-normalized', () => {
    approx(engagementComposite({}), 0.2 * 0.4, 1e-6)
    const strong = engagementComposite({
      clicks: 30,
      impressions: 200,
      dwellMs: 200_000,
      expectedReadMinutes: 3,
      completions: 8,
      views: 10,
      shares: 5,
    })
    assert.ok(strong > 0.8, `strong engagement should approach 1, got ${strong}`)
    assert.ok(strong <= 1.5)
  })
})

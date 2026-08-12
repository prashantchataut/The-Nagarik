import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { lnGamma, poissonTail } from './stats'
import {
  clusterTrendingTopics,
  fitHalfLife,
  hourOfWeek,
  hourOfWeekNormalize,
  kleinbergBursts,
  lifecyclePhase,
  normalizeByCategoryBaseline,
  poissonSurprise,
  provinceTrending,
} from './trending-advanced'
import {
  PrefixTrie,
  diversifySearchResults,
  fuzzyTermMatches,
  levenshtein,
  proximityBoost,
  rewriteZeroResultQuery,
  romanToDevanagari,
  transliterationMatches,
  trendingQueries,
} from './search-advanced'
import {
  applyNegativeFeedback,
  authorAffinityProfile,
  markov2NextRead,
  onboardingSuggestions,
  pushPropensity,
  timeSlotPreference,
  trainFactorModel,
  transferInterests,
} from './personalize-advanced'
import {
  clusterWireCopies,
  detectStoryGaps,
  evergreenCandidates,
  gateRelatedStories,
  headlineTestStep,
  optimalPublishHours,
  propagateCorrections,
  suggestTags,
} from './editorial-intel'
import {
  commenterReputation,
  detectBrigading,
  prioritizeModerationQueue,
  rankComments,
  shouldCollapseThread,
  toxicityScore,
} from './community'
import {
  bayesianEarlyStop,
  cupedAdjust,
  gammaQ,
  guardrailBreached,
  joinExposuresWithEvents,
  multiVariantSrm,
  probabilityBBeatsA,
} from './experiments-advanced'
import {
  bestSendHour,
  churnRisk,
  dedupeDigest,
  readingStreak,
  selectNewsletterStories,
  socialCardWinner,
} from './retention'

const approx = (actual: number, expected: number, eps = 1e-6) =>
  assert.ok(Math.abs(actual - expected) < eps, `expected ~${expected}, got ${actual}`)

function lcg(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

describe('trending depth', () => {
  it('lnGamma and poisson tail are numerically sound', () => {
    approx(lnGamma(5), Math.log(24), 1e-10)
    approx(lnGamma(1), 0, 1e-10)
    approx(poissonTail(0, 5), 1)
    approx(poissonTail(1, 5), 1 - Math.exp(-5), 1e-9)
    assert.ok(poissonTail(30, 5) < 1e-10)
  })

  it('kleinberg finds the burst section, not uniform traffic', () => {
    const uniform = Array.from({ length: 20 }, (_, i) => i * 60_000)
    assert.deepEqual(kleinbergBursts(uniform), [])

    const calm = Array.from({ length: 10 }, (_, i) => i * 60_000)
    const burst = Array.from({ length: 12 }, (_, i) => 9 * 60_000 + 1000 + i * 1500)
    const intervals = kleinbergBursts([...calm, ...burst])
    assert.ok(intervals.length >= 1, 'burst detected')
    assert.ok(intervals[0].start >= 8, `burst starts in the dense section, got ${intervals[0].start}`)
  })

  it('poisson surprise scales with improbability', () => {
    assert.ok(poissonSurprise(5, 5) < 1)
    assert.ok(poissonSurprise(30, 5) > 3)
    assert.equal(poissonSurprise(3, 0), 6)
    assert.equal(poissonSurprise(0, 0), 0)
  })

  it('category baselines judge politics against politics', () => {
    const items = [
      { id: 'p1', categoryId: 'pol', velocity: 10 },
      { id: 'p2', categoryId: 'pol', velocity: 20 },
      { id: 'p3', categoryId: 'pol', velocity: 30 },
      { id: 's1', categoryId: 'sport', velocity: 30 },
    ]
    const out = normalizeByCategoryBaseline(items)
    const p3 = out.find((i) => i.id === 'p3')!
    approx(p3.categoryZ, (30 - 20) / Math.sqrt((100 + 0 + 100) / 3), 1e-9)
    const s1 = out.find((i) => i.id === 's1')!
    assert.ok(Number.isFinite(s1.categoryZ), 'thin category falls back to global stats')
  })

  it('topic clustering merges keywords sharing stories', () => {
    const stories = [
      { id: 's1', keywords: ['budget', 'tax'] },
      { id: 's2', keywords: ['budget', 'tax'] },
      { id: 's3', keywords: ['weather'] },
    ]
    const clusters = clusterTrendingTopics(stories, ['budget', 'tax', 'weather'])
    assert.equal(clusters.length, 2)
    assert.deepEqual(clusters[0].keywords, ['budget', 'tax'])
    assert.deepEqual(clusters[0].storyIds, ['s1', 's2'])
  })

  it('province trending omits thin provinces honestly', () => {
    const events = [
      ...Array(4).fill({ storyId: 's1', province: 'bagmati' }),
      ...Array(2).fill({ storyId: 's2', province: 'bagmati' }),
      ...Array(2).fill({ storyId: 's9', province: 'koshi' }),
    ]
    const trends = provinceTrending(events)
    assert.equal(trends.length, 1)
    assert.equal(trends[0].province, 'bagmati')
    assert.deepEqual(trends[0].topStoryIds, ['s1', 's2'])
    approx(trends[0].share, 6 / 8)
  })

  it('hour-of-week normalization discounts habitual peaks', () => {
    const flat = new Array(168).fill(1)
    assert.equal(hourOfWeekNormalize(10, 9, flat), 10)
    const peaky = [...flat]
    peaky[9] = 3
    assert.ok(hourOfWeekNormalize(10, 9, peaky) < 10, 'peak hour traffic is discounted')
    assert.throws(() => hourOfWeekNormalize(1, 0, [1, 2, 3]))
    assert.equal(hourOfWeek(new Date('2026-01-04T05:00:00Z')), 5, 'Sunday 05:00 => 5')
  })

  it('lifecycle phases', () => {
    assert.equal(lifecyclePhase([0, 1, 0, 2]), 'dormant')
    assert.equal(lifecyclePhase([1, 5, 10, 20]), 'rising')
    assert.equal(lifecyclePhase([2, 10, 9, 10]), 'peak')
    assert.equal(lifecyclePhase([20, 10, 5, 2]), 'decaying')
  })

  it('half-life fitting recovers the true decay', () => {
    const points = [0, 3, 6, 12].map((age) => ({ ageHours: age, value: 100 * Math.pow(0.5, age / 6) }))
    const hl = fitHalfLife(points)
    assert.ok(hl !== null)
    approx(hl!, 6, 1e-9)
    assert.equal(fitHalfLife([{ ageHours: 0, value: 1 }, { ageHours: 1, value: 2 }, { ageHours: 2, value: 4 }]), null, 'growing signal has no half-life')
    assert.equal(fitHalfLife([{ ageHours: 0, value: 1 }]), null)
  })
})

describe('search upgrades', () => {
  it('prefix trie completes by weight', () => {
    const trie = new PrefixTrie()
    trie.insert('नेपाल', 5)
    trie.insert('नेता', 3)
    trie.insert('news', 2)
    assert.deepEqual(
      trie.complete('ने').map((c) => c.term),
      ['नेपाल', 'नेता'],
    )
    assert.deepEqual(trie.complete('xyz'), [])
  })

  it('roman to devanagari generates the real word among candidates', () => {
    assert.ok(romanToDevanagari('nepal').includes('नेपाल'))
    assert.ok(romanToDevanagari('sansad').includes('सन्सद'))
    assert.ok(romanToDevanagari('sansad').includes('संसद'), 'anusvara alternate for nasal+consonant')
    assert.deepEqual(romanToDevanagari('budget3'), [], 'non-alpha input rejected')
    assert.deepEqual(transliterationMatches('sansad', ['सन्सद', 'बजेट']), ['सन्सद'])
    assert.deepEqual(transliterationMatches('zzz', ['सन्सद']), [])
  })

  it('levenshtein with band early-exit', () => {
    assert.equal(levenshtein('kitten', 'sitting'), 3)
    assert.equal(levenshtein('same', 'same'), 0)
    assert.ok(levenshtein('abc', 'xyz', 1) > 1, 'bounded exit reports exceeded budget')
  })

  it('fuzzy term matching scales the budget with length', () => {
    const index = [
      { term: 'sansad', frequency: 5 },
      { term: 'sansaad', frequency: 3 },
      { term: 'budget', frequency: 9 },
    ]
    const hits = fuzzyTermMatches('sansad', index)
    assert.deepEqual(hits.map((h) => h.term), ['sansad', 'sansaad'])
    assert.equal(hits[0].distance, 0)
    assert.deepEqual(fuzzyTermMatches('cat', [{ term: 'car', frequency: 1 }]), [], 'short terms get no typo budget')
  })

  it('zero-result queries get rewritten to the closest winner', () => {
    const rewrite = rewriteZeroResultQuery('बजेट भासन', [
      { query: 'बजेट भाषण', resultCount: 12 },
      { query: 'खेलकुद', resultCount: 5 },
    ])
    assert.equal(rewrite, 'बजेट भाषण')
    assert.equal(rewriteZeroResultQuery('बजेट', []), null)
  })

  it('proximity boost rewards tight phrases', () => {
    const doc = ['बजेट', 'आज', 'संसदमा', 'पेस']
    assert.equal(proximityBoost(doc, ['बजेट', 'आज']), 1)
    assert.equal(proximityBoost(doc, ['बजेट', 'पेस']), 2 / 4)
    assert.equal(proximityBoost(doc, ['बजेट', 'missing']), 0)
    assert.equal(proximityBoost(doc, ['बजेट']), 1)
  })

  it('xQuAD-lite spreads categories', () => {
    const results = [
      { id: 'x1', categoryId: 'x', score: 3 },
      { id: 'x2', categoryId: 'x', score: 2.9 },
      { id: 'y1', categoryId: 'y', score: 2.5 },
    ]
    const out = diversifySearchResults(results, 0.5)
    assert.deepEqual(out.map((r) => r.id), ['x1', 'y1', 'x2'])
  })

  it('trending queries need volume AND a burst', () => {
    const windows = new Map<string, number[]>([
      ['budget', [1, 1, 1, 9]],
      ['rare', [0, 0, 1, 1]],
      ['steady', [5, 5, 5, 5]],
    ])
    const out = trendingQueries(windows)
    assert.deepEqual(out.map((q) => q.query), ['budget'])
  })
})

describe('personalization depth', () => {
  it('matrix factorization separates taste clusters', () => {
    const interactions = [
      { readerId: 'r1', storyId: 's1' }, { readerId: 'r1', storyId: 's2' },
      { readerId: 'r2', storyId: 's1' }, { readerId: 'r2', storyId: 's2' },
      { readerId: 'r3', storyId: 's3' }, { readerId: 'r3', storyId: 's4' },
      { readerId: 'r4', storyId: 's3' }, { readerId: 'r4', storyId: 's4' },
    ]
    const model = trainFactorModel(interactions, { factors: 4, iterations: 15 })
    assert.ok(
      model.predict('r1', 's2') > model.predict('r1', 's4'),
      'in-cluster story outranks cross-cluster story',
    )
    const recs = model.recommend('r1', new Set(['s1', 's2']), 2)
    assert.equal(recs.length, 2)
    assert.ok(!recs.some((r) => r.id === 's1' || r.id === 's2'))
  })

  it('order-2 markov uses the bigram when seen, falls back to order-1', () => {
    const sessions = [
      ['a', 'b', 'c'],
      ['a', 'b', 'c'],
      ['a', 'b', 'd'],
      ['x', 'b', 'd'],
    ]
    const withContext = markov2NextRead(sessions, 'a', 'b')
    assert.equal(withContext[0].id, 'c')
    approx(withContext[0].probability, 3 / 5)
    const fallback = markov2NextRead(sessions, 'zz', 'b')
    assert.equal(fallback.length, 2)
    approx(fallback[0].probability, 0.5)
    assert.equal(fallback[0].id, 'c', 'lexicographic tie-break')
  })

  it('author affinity decays and normalizes', () => {
    const now = new Date('2026-02-01T00:00:00Z')
    const profile = authorAffinityProfile(
      [
        { authorIds: ['A'], at: '2026-02-01T00:00:00Z' },
        { authorIds: ['B'], at: '2026-01-02T00:00:00Z' },
      ],
      { halfLifeDays: 30, now },
    )
    approx(profile.get('A') ?? 0, 1 / 1.5, 1e-9)
    approx(profile.get('B') ?? 0, 0.5 / 1.5, 1e-9)
  })

  it('negative feedback hides and dampens', () => {
    const items = [
      { id: 'i1', categoryId: 'x', authorIds: [], score: 2 },
      { id: 'i2', categoryId: 'y', authorIds: [], score: 1 },
      { id: 'i3', categoryId: 'y', authorIds: [], score: 0.5 },
    ]
    const out = applyNegativeFeedback(items, { categoryIds: ['x'], storyIds: ['i3'] })
    assert.deepEqual(out.map((i) => i.id), ['i2', 'i1'])
    approx(out.find((i) => i.id === 'i1')!.score, 0.6)
  })

  it('onboarding suggestions span the catalogue', () => {
    const picks = onboardingSuggestions(
      [
        { id: 'pol', readShare: 0.4, relatedIds: ['prov'] },
        { id: 'prov', readShare: 0.35, relatedIds: ['pol'] },
        { id: 'sports', readShare: 0.2 },
        { id: 'tech', readShare: 0.1 },
      ],
      3,
    )
    assert.deepEqual(picks, ['pol', 'sports', 'prov'])
  })

  it('locale transfer discounts, time slots read history, push gates hard', () => {
    const transferred = transferInterests(new Map([['pol', 1]]))
    approx(transferred.get('pol') ?? 0, 0.7)

    const eveningReads = [
      { at: '2026-01-30T19:00:00Z', readTimeMinutes: 8 },
      { at: '2026-01-29T20:00:00Z', readTimeMinutes: 7 },
      { at: '2026-01-28T19:30:00Z', readTimeMinutes: 9 },
    ]
    const pref = timeSlotPreference(eveningReads, new Date('2026-02-01T19:00:00Z'))
    assert.deepEqual(pref, { slot: 'evening', preferredLength: 'long' })
    assert.equal(
      timeSlotPreference([], new Date('2026-02-01T08:00:00Z')).preferredLength,
      'short',
    )

    assert.equal(pushPropensity({ interestMatch: 1, hoursSinceLastVisit: 48, visitsLast7Days: 7, isQuietHours: true, notificationsLast24h: 0 }).send, false)
    assert.equal(pushPropensity({ interestMatch: 1, hoursSinceLastVisit: 48, visitsLast7Days: 7, isQuietHours: false, notificationsLast24h: 3 }).send, false)
    assert.equal(pushPropensity({ interestMatch: 0.9, hoursSinceLastVisit: 40, visitsLast7Days: 6, isQuietHours: false, notificationsLast24h: 0 }).send, true)
    assert.equal(pushPropensity({ interestMatch: 0, hoursSinceLastVisit: 1, visitsLast7Days: 0, isQuietHours: false, notificationsLast24h: 0 }).send, false)
  })
})

describe('editorial intelligence', () => {
  it('wire copies collapse under the earliest canonical', () => {
    const clusters = clusterWireCopies([
      { id: 'late', title: 'प्रधानमन्त्रीद्वारा नयाँ बजेट संसदमा पेस', publishedAt: '2026-02-01T10:00:00Z' },
      { id: 'early', title: 'प्रधानमन्त्रीद्वारा नयाँ बजेट संसदमा पेस गरियो', publishedAt: '2026-02-01T09:00:00Z' },
      { id: 'other', title: 'राष्ट्रिय क्रिकेट टोली विश्वकप छनोटमा' },
    ])
    assert.equal(clusters.length, 2)
    const wire = clusters.find((c) => c.members.length === 2)!
    assert.equal(wire.canonical.id, 'early')
  })

  it('publish hours: history when thick, defaults when thin', () => {
    const thin = optimalPublishHours([], 'pol')
    assert.equal(thin.basis, 'default')
    const history = [
      ...Array(8).fill({ categoryId: 'pol', publishedHour: 7, engagement: 100 }),
      ...Array(8).fill({ categoryId: 'pol', publishedHour: 22, engagement: 10 }),
    ]
    const thick = optimalPublishHours(history, 'pol', { topK: 1 })
    assert.deepEqual(thick, { hours: [7], basis: 'history' })
  })

  it('headline testing declares winners only with evidence', () => {
    const undecided = headlineTestStep(
      [
        { id: 'a', impressions: 50, clicks: 10 },
        { id: 'b', impressions: 50, clicks: 2 },
      ],
      lcg(3),
    )
    assert.equal(undecided.winner, null)
    assert.ok(['a', 'b'].includes(undecided.show))

    const decided = headlineTestStep(
      [
        { id: 'a', impressions: 1000, clicks: 200 },
        { id: 'b', impressions: 1000, clicks: 20 },
      ],
      lcg(3),
    )
    assert.equal(decided.winner, 'a')
  })

  it('story gaps: bursting queries absent from the corpus', () => {
    const gaps = detectStoryGaps(
      new Map([
        ['loadshedding', [0, 0, 0, 9]],
        ['budget', [0, 0, 0, 9]],
      ]),
      [['budget', 'speech'], ['budget', 'session']],
    )
    assert.deepEqual(gaps.map((g) => g.term), ['loadshedding'])
  })

  it('evergreen: old + bursting only', () => {
    const now = new Date('2026-02-01T00:00:00Z')
    const out = evergreenCandidates(
      [
        { id: 'old-hot', publishedAt: '2025-11-01T00:00:00Z' },
        { id: 'old-cold', publishedAt: '2025-11-01T00:00:00Z' },
        { id: 'new-hot', publishedAt: '2026-01-30T00:00:00Z' },
      ],
      new Map([
        ['old-hot', [1, 1, 1, 15]],
        ['old-cold', [1, 1, 1, 1]],
        ['new-hot', [1, 1, 1, 15]],
      ]),
      { now },
    )
    assert.deepEqual(out.map((o) => o.id), ['old-hot'])
  })

  it('corrections propagate through the citation graph', () => {
    const flagged = propagateCorrections(
      new Map([
        ['s2', ['s1']],
        ['s3', ['s2']],
        ['s4', ['s9']],
      ]),
      ['s1'],
    )
    assert.deepEqual(flagged, [
      { id: 's2', distance: 1 },
      { id: 's3', distance: 2 },
    ])
  })

  it('tag suggestions map to existing vocabulary first', () => {
    const { existing, proposed } = suggestTags(
      'रेमिट्यान्स प्रवाह रेमिट्यान्स वृद्धि उच्च',
      ['बजेट भाषण आज', 'संसद बैठक'],
      [{ slug: 'remittance', nameNe: 'रेमिट्यान्स', nameEn: 'Remittance' }],
    )
    assert.ok(existing.includes('remittance'))
    assert.ok(proposed.length >= 1)
  })

  it('related gate keeps the rail honest', () => {
    const kept = gateRelatedStories(
      { id: 'src', text: 'संघीय बजेट संसदमा पेस गरियो बजेट भाषण' },
      [
        { id: 'rel', text: 'बजेट भाषणपछि संसदमा छलफल सुरु' },
        { id: 'far', text: 'क्रिकेट टोली विश्वकप छनोट खेल' },
      ],
    )
    assert.deepEqual(kept.map((k) => k.id), ['rel'])
  })
})

describe('community', () => {
  it('comment ranking blends confidence and freshness', () => {
    const now = new Date('2026-02-01T12:00:00Z')
    const ranked = rankComments(
      [
        { id: 'proven', upvotes: 90, votes: 100, createdAt: '2026-01-31T12:00:00Z' },
        { id: 'fresh-thin', upvotes: 1, votes: 2, createdAt: '2026-02-01T12:00:00Z' },
      ],
      now,
    )
    assert.equal(ranked[0].id, 'proven')
    assert.ok(ranked[0].rankScore > ranked[1].rankScore)
  })

  it('toxicity tiers weight severity', () => {
    const lexicon = { severe: ['killword'], moderate: ['midword'], mild: ['heckword'] }
    assert.equal(toxicityScore('this has killword', lexicon).score, 1)
    approx(toxicityScore('a heckword only', lexicon).score, 0.2)
    assert.equal(toxicityScore('cleankillwordish', lexicon).score, 0, 'Latin boundary respected')
  })

  it('thread collapse: long AND low-value only', () => {
    assert.equal(shouldCollapseThread({ upvotes: 0, votes: 8, replyCount: 6 }), true)
    assert.equal(shouldCollapseThread({ upvotes: 0, votes: 8, replyCount: 2 }), false)
    assert.equal(shouldCollapseThread({ upvotes: 40, votes: 50, replyCount: 10 }), false)
  })

  it('reputation is neutral until earned', () => {
    approx(commenterReputation(0, 0), 0.5)
    approx(commenterReputation(8, 0), 10 / 12)
    assert.ok(commenterReputation(2, 0) < commenterReputation(20, 0))
  })

  it('brigading needs volume, concentration, or fresh sources', () => {
    const now = new Date('2026-02-01T12:00:00Z')
    const at = (min: number) => new Date(now.getTime() - min * 60_000).toISOString()
    const burst = Array.from({ length: 12 }, (_, i) => ({
      ipHash: i % 2 === 0 ? 'new1' : 'new2',
      at: at(i),
    }))
    const verdict = detectBrigading(burst, new Set(['old1']), { now })
    assert.equal(verdict.brigading, true)
    assert.ok(verdict.reasons.length >= 2)

    const calm = [{ ipHash: 'old1', at: at(5) }, { ipHash: 'old2', at: at(9) }]
    assert.equal(detectBrigading(calm, new Set(['old1', 'old2']), { now }).brigading, false)
  })

  it('moderation queue: hot article + borderline first', () => {
    const now = new Date('2026-02-01T12:00:00Z')
    const out = prioritizeModerationQueue(
      [
        { id: 'cold-clean', body: 'यो राम्रो विश्लेषण हो।', articleViews15m: 1, createdAt: '2026-02-01T11:50:00Z' },
        { id: 'hot-borderline', body: 'ramro post http://link.example herna', articleViews15m: 100, createdAt: '2026-02-01T11:50:00Z' },
      ],
      now,
    )
    assert.equal(out[0].id, 'hot-borderline')
  })
})

describe('experiments depth', () => {
  it('exposure join is intent-to-treat', () => {
    const metrics = joinExposuresWithEvents(
      [
        { unitId: 'u1', variant: 'A' },
        { unitId: 'u1', variant: 'B' }, // late reassignment ignored
        { unitId: 'u2', variant: 'A' },
        { unitId: 'u3', variant: 'B' },
      ],
      [
        { unitId: 'u1', value: 2 },
        { unitId: 'u3', value: 1 },
        { unitId: 'u9', value: 5 }, // never exposed
      ],
    )
    const a = metrics.find((m) => m.variant === 'A')!
    const b = metrics.find((m) => m.variant === 'B')!
    assert.deepEqual([a.units, a.convertedUnits, a.totalValue, a.meanValue], [2, 1, 2, 1])
    assert.deepEqual([b.units, b.convertedUnits, b.totalValue], [1, 1, 1])
  })

  it('exact P(B beats A) is symmetric and decisive when it should be', () => {
    approx(probabilityBBeatsA(0, 0, 0, 0), 0.5, 1e-9)
    const p = probabilityBBeatsA(10, 100, 30, 100)
    assert.ok(p > 0.99, `30% must beat 10% at n=100: ${p}`)
    const sum = probabilityBBeatsA(20, 100, 30, 100) + probabilityBBeatsA(30, 100, 20, 100)
    approx(sum, 1, 1e-9)
    assert.equal(bayesianEarlyStop(10, 100, 30, 100).decision, 'stop-b-wins')
    assert.equal(bayesianEarlyStop(30, 100, 10, 100).decision, 'stop-a-wins')
    assert.equal(bayesianEarlyStop(20, 100, 22, 100).decision, 'continue')
  })

  it('CUPED removes pre-period variance without moving the mean', () => {
    const perfect = cupedAdjust([
      { pre: 1, post: 2 },
      { pre: 2, post: 4 },
      { pre: 3, post: 6 },
    ])
    approx(perfect.theta, 2)
    approx(perfect.varianceReductionPct, 100)
    const meanAdj = perfect.adjusted.reduce((a, b) => a + b, 0) / 3
    approx(meanAdj, 4)
    assert.equal(cupedAdjust([{ pre: 1, post: 2 }]).theta, 0)
  })

  it('chi-square survival is accurate at the classic critical values', () => {
    approx(gammaQ(0.5, 3.841 / 2), 0.05, 5e-3) // chi2(1) 95th percentile
    approx(gammaQ(1, 5.991 / 2), 0.05, 5e-3) // chi2(2) 95th percentile
  })

  it('multi-variant SRM alarms only on real imbalance', () => {
    const weights = [
      { variant: 'a', weight: 1 },
      { variant: 'b', weight: 1 },
      { variant: 'c', weight: 2 },
    ]
    const balanced = multiVariantSrm(
      [
        { variant: 'a', units: 2500 },
        { variant: 'b', units: 2500 },
        { variant: 'c', units: 5000 },
      ],
      weights,
    )
    assert.equal(balanced.mismatch, false)
    const broken = multiVariantSrm(
      [
        { variant: 'a', units: 3500 },
        { variant: 'b', units: 1500 },
        { variant: 'c', units: 5000 },
      ],
      weights,
    )
    assert.equal(broken.mismatch, true)
  })

  it('guardrail breaches on a real degradation', () => {
    const same = guardrailBreached(
      { successes: 500, trials: 1000 },
      { successes: 500, trials: 1000 },
    )
    assert.equal(same.breached, false)
    const degraded = guardrailBreached(
      { successes: 500, trials: 1000 },
      { successes: 400, trials: 1000 },
    )
    assert.equal(degraded.breached, true)
    approx(degraded.relativeChange, -0.2)
  })
})

describe('distribution & retention', () => {
  it('newsletter selection: interests boost, reads excluded, quota held', () => {
    const interests = new Map([['pol', 0.8]])
    const picks = selectNewsletterStories(
      [
        { id: 'p1', categoryId: 'pol', title: 'संसदमा नयाँ विधेयक दर्ता', score: 1 },
        { id: 'p2', categoryId: 'pol', title: 'प्रदेश बजेट सार्वजनिक भयो', score: 0.9 },
        { id: 'p3', categoryId: 'pol', title: 'मन्त्रिपरिषद् बैठक बस्दै', score: 0.85 },
        { id: 'e1', categoryId: 'econ', title: 'रेमिट्यान्स प्रवाह उच्च बिन्दुमा', score: 0.8 },
        { id: 'read1', categoryId: 'pol', title: 'पढिसकेको समाचार शीर्षक', score: 5 },
      ],
      { interests, readStoryIds: new Set(['read1']) },
      { count: 3, maxPerCategory: 2 },
    )
    assert.equal(picks.length, 3)
    assert.ok(!picks.some((p) => p.id === 'read1'))
    assert.equal(picks.filter((p) => p.categoryId === 'pol').length, 2, 'quota respected')
  })

  it('send-time: personal histogram beats the default only with data', () => {
    assert.deepEqual(bestSendHour([20, 20]), { hour: 7, basis: 'default' })
    assert.deepEqual(bestSendHour([20, 20, 20, 7, 20, 21]), { hour: 20, basis: 'personal' })
  })

  it('digest dedupe drops read stories and resends', () => {
    const digest = dedupeDigest(
      [
        { id: 'a', title: 'नयाँ बजेटका मुख्य बुँदा के के छन्' },
        { id: 'b', title: 'क्रिकेट टोलीको छनोट सूची सार्वजनिक' },
        { id: 'c', title: 'पहिले नै पढेको कथा' },
      ],
      new Set(['c']),
      ['नयाँ बजेटका मुख्य बुँदा के के हुन्'],
    )
    assert.deepEqual(digest.map((d) => d.id), ['b'])
  })

  it('social cards pick a winner conservatively', () => {
    assert.deepEqual(socialCardWinner([
      { id: 'v1', impressions: 50, clicks: 20 },
      { id: 'v2', impressions: 50, clicks: 1 },
    ]), { winner: null, keepTesting: true })
    const decided = socialCardWinner([
      { id: 'v1', impressions: 2000, clicks: 300 },
      { id: 'v2', impressions: 2000, clicks: 80 },
    ])
    assert.deepEqual(decided, { winner: 'v1', keepTesting: false })
  })

  it('reading streaks count consecutive local days', () => {
    const streak = readingStreak(['2026-01-30', '2026-01-31', '2026-02-01'], '2026-02-01')
    assert.deepEqual(streak, { current: 3, longest: 3, milestone: 3 })
    const broken = readingStreak(['2026-01-25', '2026-01-31'], '2026-02-02')
    assert.equal(broken.current, 0)
    assert.equal(readingStreak([], '2026-02-01').current, 0)
  })

  it('churn risk is monotonic and bucketed', () => {
    assert.equal(churnRisk(0, 30).bucket, 'healthy')
    assert.equal(churnRisk(30, 0).bucket, 'churned')
    assert.ok(churnRisk(10, 5).score > churnRisk(2, 5).score)
    assert.ok(churnRisk(5, 1).score > churnRisk(5, 20).score)
  })
})

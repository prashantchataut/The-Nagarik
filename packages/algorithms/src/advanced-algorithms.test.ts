import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildBm25,
  buildTfIdf,
  cosineSimilaritySparse,
  dedupeHeadlines,
  extractKeywords,
  fnv1a32,
  hammingDistance32,
  isNearDuplicate,
  jaccardSimilarity,
  shingles,
  simhash32,
  tokenizeText,
} from './text'
import {
  authorSpacing,
  categoryQuota,
  interleaveLists,
  mmrRerank,
  serendipityInject,
} from './diversity'
import {
  blendScores,
  coVisitationCounts,
  coldStartBlendWeight,
  decayedInterestProfile,
  impressionFatigue,
  itemItemScores,
  markovNextRead,
  profileAffinity,
  withinFrequencyCap,
} from './personalize'
import {
  assignBucket,
  betaSample,
  epsilonGreedy,
  sampleRatioMismatch,
  thompsonSample,
  ucb1,
} from './bandit'
import {
  clickbaitScore,
  commentSpamScore,
  estimateReadTimeMinutes,
  isDuplicateComment,
  profanityMatch,
  readabilityHint,
} from './quality'

const approx = (actual: number, expected: number, eps = 1e-6) =>
  assert.ok(Math.abs(actual - expected) < eps, `expected ~${expected}, got ${actual}`)

/** Deterministic LCG for reproducible randomized tests. */
function lcg(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

describe('text algorithms', () => {
  it('tokenizes Devanagari and Latin together', () => {
    assert.deepEqual(tokenizeText('नेपालको बजेट, Budget 2081!'), [
      'नेपालको',
      'बजेट',
      'budget',
      '2081',
    ])
  })

  it('shingles and jaccard', () => {
    const sh = shingles(['a', 'b', 'c'], 2)
    assert.deepEqual([...sh].sort(), ['a b', 'b c'])
    approx(jaccardSimilarity(new Set(['a', 'b']), new Set(['b', 'c'])), 1 / 3)
    assert.equal(jaccardSimilarity(new Set(), new Set()), 1)
  })

  it('tf-idf favors distinctive terms; cosine behaves', () => {
    const docs = [
      tokenizeText('बजेट बजेट संसद'),
      tokenizeText('संसद बैठक आज'),
      tokenizeText('संसद अधिवेशन सकियो'),
    ]
    const model = buildTfIdf(docs)
    const doc0 = model.vectors[0]
    assert.ok(
      (doc0.get('बजेट') ?? 0) > (doc0.get('संसद') ?? 0),
      'unique term outweighs corpus-wide term',
    )
    approx(cosineSimilaritySparse(doc0, doc0), 1)
    assert.equal(
      cosineSimilaritySparse(new Map([['x', 1]]), new Map([['y', 1]])),
      0,
    )
  })

  it('bm25 ranks repeated matches higher and skips misses', () => {
    const docs = [
      tokenizeText('budget speech parliament budget allocations'),
      tokenizeText('budget session opens'),
      tokenizeText('football match tonight'),
    ]
    const index = buildBm25(docs)
    const q = ['budget']
    assert.ok(index.score(q, 0) > index.score(q, 1))
    assert.equal(index.score(q, 2), 0)
    const hits = index.search(q)
    assert.equal(hits.length, 2)
    assert.equal(hits[0].docIndex, 0)
  })

  it('simhash + hamming detects near-duplicates', () => {
    assert.equal(fnv1a32('nepal'), fnv1a32('nepal'))
    const a = tokenizeText('प्रधानमन्त्रीले आज संसदमा नीति तथा कार्यक्रम प्रस्तुत गरे')
    const b = tokenizeText('प्रधानमन्त्रीले आज संसदमा नीति तथा कार्यक्रम पेस गरे')
    assert.equal(simhash32(a), simhash32([...a]))
    assert.equal(hammingDistance32(0b1010, 0b0011), 2)
    assert.ok(hammingDistance32(simhash32(a), simhash32(b)) <= 6)
    assert.equal(
      isNearDuplicate(
        'प्रधानमन्त्रीले आज संसदमा नीति तथा कार्यक्रम प्रस्तुत गरे',
        'प्रधानमन्त्रीले आज संसदमा नीति तथा कार्यक्रम पेस गरे',
      ),
      true,
    )
    assert.equal(
      isNearDuplicate('आज मौसम सफा रहनेछ', 'football final tonight in kathmandu stadium arena'),
      false,
    )
  })

  it('keyword extraction surfaces the distinctive term', () => {
    const doc = tokenizeText('रेमिट्यान्स रेमिट्यान्स वृद्धि आर्थिक वर्ष')
    const corpus = [tokenizeText('आर्थिक वर्ष बजेट'), tokenizeText('आर्थिक वृद्धि दर')]
    const keywords = extractKeywords(doc, corpus, 3)
    assert.equal(keywords[0].term, 'रेमिट्यान्स')
    assert.ok(keywords.length <= 3)
  })

  it('headline dedupe drops the wire-copy twin', () => {
    const items = [
      { id: '1', h: 'प्रधानमन्त्रीद्वारा नयाँ बजेट सार्वजनिक' },
      { id: '2', h: 'प्रधानमन्त्रीद्वारा नयाँ बजेट सार्वजनिक गरियो' },
      { id: '3', h: 'काठमाडौंमा आज पानी पर्ने' },
    ]
    const kept = dedupeHeadlines(items, (i) => i.h)
    assert.deepEqual(kept.map((i) => i.id), ['1', '3'])
  })
})

describe('diversity re-rankers', () => {
  it('mmr balances relevance and similarity', () => {
    const items = [
      { id: 'A', cat: 'x', score: 3 },
      { id: 'B', cat: 'x', score: 2.9 },
      { id: 'C', cat: 'y', score: 2 },
    ]
    const sameCat = (a: (typeof items)[number], b: (typeof items)[number]) =>
      a.cat === b.cat ? 1 : 0
    const diverse = mmrRerank(items, sameCat, 0.5)
    assert.deepEqual(diverse.map((i) => i.id), ['A', 'C', 'B'])
    const pure = mmrRerank(items, sameCat, 1)
    assert.deepEqual(pure.map((i) => i.id), ['A', 'B', 'C'])
  })

  it('category quota defers the overflow', () => {
    const items = ['x', 'x', 'x', 'y'].map((c, i) => ({ id: String(i), categoryId: c }))
    const out = categoryQuota(items, 2, 4)
    assert.deepEqual(out.map((i) => i.categoryId), ['x', 'x', 'y', 'x'])
  })

  it('author spacing separates back-to-back bylines', () => {
    const items = [
      { id: '1', authorIds: ['a'] },
      { id: '2', authorIds: ['a'] },
      { id: '3', authorIds: ['b'] },
    ]
    assert.deepEqual(authorSpacing(items, 2).map((i) => i.id), ['1', '3', '2'])
  })

  it('serendipity injection fills every Nth slot deterministically', () => {
    const main = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'].map((id) => ({ id }))
    const pool = ['e1', 'e2'].map((id) => ({ id }))
    const out = serendipityInject(main, pool, 3)
    assert.deepEqual(out.map((i) => i.id), ['m1', 'm2', 'e1', 'm4', 'm5', 'e2'])
    assert.deepEqual(serendipityInject(main, [], 3), main)
  })

  it('interleaving alternates and never repeats ids', () => {
    const a = [{ id: 'a1' }, { id: 'a2' }]
    const b = [{ id: 'a1' }, { id: 'b1' }]
    assert.deepEqual(interleaveLists(a, b).map((i) => i.id), ['a1', 'b1', 'a2'])
  })
})

describe('personalization', () => {
  const NOW = new Date('2026-02-01T00:00:00Z')
  const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000).toISOString()

  it('interest profile decays with half-life and normalizes', () => {
    const profile = decayedInterestProfile(
      [
        { categoryId: 'politics', at: daysAgo(0) },
        { categoryId: 'sports', at: daysAgo(14) },
      ],
      { halfLifeDays: 14, now: NOW },
    )
    approx(profile.get('politics') ?? 0, 2 / 3, 1e-9)
    approx(profile.get('sports') ?? 0, 1 / 3, 1e-9)
    approx(profileAffinity(profile, { categoryId: 'politics' }), 2 / 3, 1e-9)
    assert.equal(profileAffinity(profile, { categoryId: 'unknown' }), 0)
  })

  it('co-visitation counts sessions containing both stories', () => {
    const matrix = coVisitationCounts([
      ['s1', 's2'],
      ['s1', 's2'],
      ['s1', 's3'],
    ])
    assert.equal(matrix.get('s1')?.get('s2'), 2)
    assert.equal(matrix.get('s1')?.get('s3'), 1)
    assert.equal(matrix.get('s2')?.get('s1'), 2)
  })

  it('item-item CF damps runaway popularity', () => {
    const matrix = coVisitationCounts([
      ['s1', 's2'],
      ['s1', 's2'],
      ['s1', 's3'],
    ])
    const scores = itemItemScores('s1', matrix, new Map([['s2', 16], ['s3', 1]]))
    assert.equal(scores[0].id, 's3', 'niche co-read beats damped megahit')
    approx(scores[0].score, 1)
    approx(scores[1].score, 0.5)
  })

  it('markov next-read yields smoothed transition probabilities', () => {
    const next = markovNextRead([
      ['a', 'b'],
      ['a', 'b'],
      ['a', 'c'],
    ], 'a')
    assert.equal(next[0].id, 'b')
    approx(next[0].probability, 3 / 5)
    approx(next[1].probability, 2 / 5)
    assert.deepEqual(markovNextRead([], 'a'), [])
  })

  it('fatigue, frequency cap, cold-start blending', () => {
    assert.equal(impressionFatigue(0), 1)
    approx(impressionFatigue(5, 0.5), 1 / 3.5)
    const now = new Date('2026-02-01T12:00:00Z')
    const shown = ['2026-02-01T11:00:00Z', '2026-02-01T10:00:00Z']
    assert.equal(withinFrequencyCap(shown, 3, 24, now), true)
    assert.equal(withinFrequencyCap(shown, 2, 24, now), false)
    assert.equal(coldStartBlendWeight(0), 0)
    assert.equal(coldStartBlendWeight(10), 0.5)
    approx(coldStartBlendWeight(40, 10), 0.8)
    approx(blendScores(1, 0, 10), 0.5)
  })
})

describe('bandits and experiments', () => {
  it('epsilon-greedy: unpulled first, then exploit', () => {
    const arms = [
      { id: 'a', pulls: 10, rewards: 2 },
      { id: 'b', pulls: 0, rewards: 0 },
    ]
    assert.equal(epsilonGreedy(arms, 0.1, lcg(1)), 'b', 'unpulled arm is tried first')
    const seasoned = [
      { id: 'a', pulls: 10, rewards: 9 },
      { id: 'b', pulls: 10, rewards: 2 },
    ]
    assert.equal(epsilonGreedy(seasoned, 0, lcg(1)), 'a', 'epsilon 0 exploits')
  })

  it('ucb1 gives uncertain arms their optimism bonus', () => {
    const arms = [
      { id: 'a', pulls: 10, rewards: 9 },
      { id: 'b', pulls: 2, rewards: 1 },
    ]
    assert.equal(ucb1(arms), 'b', 'wide confidence beats high mean')
    assert.equal(ucb1([{ id: 'x', pulls: 0, rewards: 0 }, { id: 'y', pulls: 5, rewards: 5 }]), 'x')
  })

  it('beta sampling and thompson pick the truly better arm', () => {
    const rng = lcg(42)
    let sum = 0
    for (let i = 0; i < 300; i++) sum += betaSample(8, 2, rng)
    const meanDraw = sum / 300
    assert.ok(Math.abs(meanDraw - 0.8) < 0.05, `Beta(8,2) mean ~0.8, got ${meanDraw}`)

    const arms = [
      { id: 'good', pulls: 50, rewards: 40 },
      { id: 'bad', pulls: 50, rewards: 5 },
    ]
    const rng2 = lcg(7)
    let goodPicks = 0
    for (let i = 0; i < 100; i++) {
      if (thompsonSample(arms, rng2) === 'good') goodPicks += 1
    }
    assert.ok(goodPicks > 90, `thompson should exploit: ${goodPicks}/100`)
  })

  it('bucket assignment is deterministic and roughly balanced', () => {
    const variants = [
      { id: 'control', weight: 1 },
      { id: 'test', weight: 1 },
    ]
    const first = assignBucket('reader-123', 'exp-hero', variants)
    assert.equal(assignBucket('reader-123', 'exp-hero', variants), first)
    let control = 0
    for (let i = 0; i < 1000; i++) {
      if (assignBucket(`unit-${i}`, 'exp-hero', variants) === 'control') control += 1
    }
    assert.ok(control > 400 && control < 600, `split ~50/50, got ${control}/1000`)
    assert.equal(assignBucket('x', 'y', [{ id: 'only', weight: 1 }]), 'only')
  })

  it('sample ratio mismatch alarms only on real imbalance', () => {
    assert.equal(sampleRatioMismatch(5000, 5000).mismatch, false)
    assert.equal(sampleRatioMismatch(6000, 4000).mismatch, true)
    assert.equal(sampleRatioMismatch(0, 0).mismatch, false)
  })
})

describe('content quality', () => {
  it('read time is Devanagari-aware', () => {
    const neWords = Array(360).fill('शब्द').join(' ')
    assert.equal(estimateReadTimeMinutes(neWords), 2)
    const enWords = Array(240).fill('word').join(' ')
    assert.equal(estimateReadTimeMinutes(enWords), 1)
    assert.equal(estimateReadTimeMinutes(''), 1)
  })

  it('comment spam scoring catches links and shouting', () => {
    const linky = commentSpamScore('http://spam.example http://spam2.example')
    assert.ok(linky.score >= 0.6, `link-only spam must clear the drop gate: ${linky.score}`)
    assert.ok(linky.reasons.includes('link-only'))
    assert.ok(linky.reasons.some((r) => r.startsWith('links')))

    const clean = commentSpamScore('यो विश्लेषण निकै सन्तुलित लाग्यो, धन्यवाद।')
    assert.equal(clean.score, 0)

    const shouty = commentSpamScore('AAAAAA BBBBBB CCCCCC DDDDDD')
    assert.ok(shouty.reasons.includes('all-caps'))
    assert.ok(shouty.reasons.includes('char-repetition'))
    assert.equal(commentSpamScore('   ').score, 1)
  })

  it('duplicate comment detection', () => {
    const prev = ['यो समाचार निकै राम्रो लाग्यो धन्यवाद टिम']
    assert.equal(isDuplicateComment('यो समाचार निकै राम्रो लाग्यो धन्यवाद टिम', prev), true)
    assert.equal(isDuplicateComment('प्रदेश सरकारको बजेट कहिले आउँछ?', prev), false)
  })

  it('clickbait heuristics flag curiosity-gap patterns, spare straight news', () => {
    assert.ok(clickbaitScore('तपाईंलाई थाहा छ ?? यो हेर्नुहोस् भिडियो !!') >= 0.7)
    assert.equal(clickbaitScore('अर्थ मन्त्रालयद्वारा नयाँ बजेट सार्वजनिक'), 0)
    assert.ok(clickbaitScore('SHOCKING result in the final match') >= 0.45)
  })

  it('readability hint buckets by sentence length', () => {
    assert.equal(readabilityHint('छोटो वाक्य। अर्को छोटो वाक्य।').hint, 'easy')
    const dense = `${Array(30).fill('शब्द').join(' ')}।`
    assert.equal(readabilityHint(dense).hint, 'dense')
  })

  it('profanity matching respects Latin word boundaries', () => {
    assert.deepEqual(profanityMatch('this has badword inside', ['badword']), ['badword'])
    assert.deepEqual(profanityMatch('notbadwordish text', ['badword']), [])
    assert.deepEqual(profanityMatch('यहाँ गालीशब्द छ', ['गालीशब्द']), ['गालीशब्द'])
  })
})

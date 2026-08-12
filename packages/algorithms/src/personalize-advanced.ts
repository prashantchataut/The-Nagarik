import { mean } from './stats'

/**
 * Deep personalization: latent factors, higher-order sequences, affinities,
 * negative feedback, onboarding, locale transfer, time-slots, propensity.
 */

export type Interaction = { readerId: string; storyId: string; weight?: number }

export type FactorModel = {
  readerFactors: Map<string, number[]>
  storyFactors: Map<string, number[]>
  predict: (readerId: string, storyId: string) => number
  recommend: (readerId: string, excludeStoryIds?: Set<string>, k?: number) => Array<{ id: string; score: number }>
}

/** Deterministic pseudo-random from a string seed (for factor init). */
function seededValue(seed: string, index: number): number {
  let h = 2166136261
  const input = `${seed}:${index}`
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (((h >>> 0) % 1000) / 1000 - 0.5) * 0.2
}

/**
 * ALGO pers.mf_als - implicit-feedback matrix factorization (ALS-lite):
 * alternating ridge-regularized least squares on observed interactions,
 * deterministic seeded init, fixed iterations. Small-corpus scale (the
 * co-read graph of a news site), not a GPU job.
 */
export function trainFactorModel(
  interactions: Interaction[],
  opts: { factors?: number; iterations?: number; lambda?: number } = {},
): FactorModel {
  const k = opts.factors ?? 8
  const iterations = opts.iterations ?? 12
  const lambda = opts.lambda ?? 0.1

  const readers = [...new Set(interactions.map((i) => i.readerId))]
  const stories = [...new Set(interactions.map((i) => i.storyId))]
  const readerFactors = new Map<string, number[]>(
    readers.map((r) => [r, Array.from({ length: k }, (_, f) => seededValue(r, f))]),
  )
  const storyFactors = new Map<string, number[]>(
    stories.map((s) => [s, Array.from({ length: k }, (_, f) => seededValue(s, f))]),
  )

  const byReader = new Map<string, Array<{ storyId: string; weight: number }>>()
  const byStory = new Map<string, Array<{ readerId: string; weight: number }>>()
  for (const it of interactions) {
    const w = it.weight ?? 1
    byReader.set(it.readerId, [...(byReader.get(it.readerId) ?? []), { storyId: it.storyId, weight: w }])
    byStory.set(it.storyId, [...(byStory.get(it.storyId) ?? []), { readerId: it.readerId, weight: w }])
  }

  const dot = (a: number[], b: number[]) => a.reduce((sum, v, i) => sum + v * b[i], 0)

  // Coordinate-descent ridge update for one side.
  const updateSide = (
    ownFactors: Map<string, number[]>,
    otherFactors: Map<string, number[]>,
    links: Map<string, Array<{ otherId: string; weight: number }>>,
  ) => {
    for (const [ownId, vector] of ownFactors) {
      const observed = links.get(ownId) ?? []
      if (!observed.length) continue
      for (let f = 0; f < k; f++) {
        let num = 0
        let den = lambda
        for (const { otherId, weight } of observed) {
          const other = otherFactors.get(otherId)
          if (!other) continue
          const residual = weight - (dot(vector, other) - vector[f] * other[f])
          num += residual * other[f]
          den += other[f] * other[f]
        }
        vector[f] = num / den
      }
    }
  }

  const readerLinks = new Map(
    [...byReader.entries()].map(([r, list]) => [
      r,
      list.map((x) => ({ otherId: x.storyId, weight: x.weight })),
    ]),
  )
  const storyLinks = new Map(
    [...byStory.entries()].map(([s, list]) => [
      s,
      list.map((x) => ({ otherId: x.readerId, weight: x.weight })),
    ]),
  )

  for (let iter = 0; iter < iterations; iter++) {
    updateSide(readerFactors, storyFactors, readerLinks)
    updateSide(storyFactors, readerFactors, storyLinks)
  }

  const predict = (readerId: string, storyId: string): number => {
    const r = readerFactors.get(readerId)
    const s = storyFactors.get(storyId)
    if (!r || !s) return 0
    return dot(r, s)
  }

  const recommend = (readerId: string, excludeStoryIds = new Set<string>(), topK = 8) =>
    stories
      .filter((s) => !excludeStoryIds.has(s))
      .map((s) => ({ id: s, score: predict(readerId, s) }))
      .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
      .slice(0, topK)

  return { readerFactors, storyFactors, predict, recommend }
}

/**
 * ALGO pers.markov2 - order-2 Markov next-read: transitions keyed on the
 * last TWO stories, Laplace-smoothed, falling back to order-1 when the
 * bigram state was never seen.
 */
export function markov2NextRead(
  sessions: string[][],
  previousStoryId: string | null,
  currentStoryId: string,
): Array<{ id: string; probability: number }> {
  const bigram = new Map<string, number>()
  const unigram = new Map<string, number>()
  let bigramTotal = 0
  let unigramTotal = 0

  for (const session of sessions) {
    for (let i = 0; i + 1 < session.length; i++) {
      if (session[i] === currentStoryId && session[i + 1] !== currentStoryId) {
        unigram.set(session[i + 1], (unigram.get(session[i + 1]) ?? 0) + 1)
        unigramTotal += 1
        if (previousStoryId && i >= 1 && session[i - 1] === previousStoryId) {
          bigram.set(session[i + 1], (bigram.get(session[i + 1]) ?? 0) + 1)
          bigramTotal += 1
        }
      }
    }
  }

  const source = bigramTotal >= 2 ? bigram : unigram
  const total = bigramTotal >= 2 ? bigramTotal : unigramTotal
  if (total === 0) return []
  const kStates = source.size
  return [...source.entries()]
    .map(([id, count]) => ({ id, probability: (count + 1) / (total + kStates) }))
    .sort((a, b) => b.probability - a.probability || a.id.localeCompare(b.id))
}

/**
 * ALGO pers.author_affinity - decayed author-weight vector from reads,
 * same half-life mechanics as category interests.
 */
export function authorAffinityProfile(
  reads: Array<{ authorIds: string[]; at: string }>,
  opts: { halfLifeDays?: number; now?: Date } = {},
): Map<string, number> {
  const halfLife = opts.halfLifeDays ?? 30
  const now = opts.now ?? new Date()
  const raw = new Map<string, number>()
  for (const read of reads) {
    const ageDays = Math.max(0, (now.getTime() - new Date(read.at).getTime()) / 86_400_000)
    const weight = Math.pow(0.5, ageDays / halfLife)
    for (const author of read.authorIds) {
      raw.set(author, (raw.get(author) ?? 0) + weight)
    }
  }
  const total = [...raw.values()].reduce((a, b) => a + b, 0)
  if (total === 0) return raw
  const out = new Map<string, number>()
  for (const [author, weight] of raw) out.set(author, weight / total)
  return out
}

export type NegativeFeedback = {
  categoryIds?: string[]
  authorIds?: string[]
  storyIds?: string[]
}

/**
 * ALGO pers.negative_feedback - "less like this": hidden stories are
 * excluded outright; their categories/authors take a multiplicative
 * penalty (default 0.3) instead of a ban - taste can change.
 */
export function applyNegativeFeedback<T extends { id: string; categoryId?: string; authorIds?: string[]; score: number }>(
  items: T[],
  feedback: NegativeFeedback,
  penalty = 0.3,
): T[] {
  const hiddenStories = new Set(feedback.storyIds ?? [])
  const dampedCategories = new Set(feedback.categoryIds ?? [])
  const dampedAuthors = new Set(feedback.authorIds ?? [])
  return items
    .filter((item) => !hiddenStories.has(item.id))
    .map((item) => {
      let factor = 1
      if (item.categoryId && dampedCategories.has(item.categoryId)) factor *= penalty
      if ((item.authorIds ?? []).some((a) => dampedAuthors.has(a))) factor *= penalty
      return { ...item, score: item.score * factor }
    })
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
}

/**
 * ALGO pers.onboarding - pick-3 interest onboarding: greedy max-coverage
 * over popular categories, penalizing similarity to already-picked ones so
 * suggestions span the catalogue (politics + sports + tech, not three
 * flavours of politics).
 */
export function onboardingSuggestions(
  categories: Array<{ id: string; readShare: number; relatedIds?: string[] }>,
  pick = 3,
): string[] {
  const pool = [...categories]
  const picked: Array<{ id: string; relatedIds?: string[] }> = []
  while (picked.length < pick && pool.length) {
    let bestIdx = 0
    let bestValue = Number.NEGATIVE_INFINITY
    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[i]
      const related = picked.some(
        (p) => p.relatedIds?.includes(candidate.id) || candidate.relatedIds?.includes(p.id),
      )
      const value = candidate.readShare * (related ? 0.3 : 1)
      if (value > bestValue) {
        bestValue = value
        bestIdx = i
      }
    }
    picked.push(pool.splice(bestIdx, 1)[0])
  }
  return picked.map((p) => p.id)
}

/**
 * ALGO pers.locale_transfer - cross-locale preference transfer: interests
 * carry across ne<->en via shared category slugs at a confidence discount
 * (a Nepali politics reader probably wants English politics too - weight
 * 0.7, not 1.0).
 */
export function transferInterests(
  sourceProfile: Map<string, number>,
  discount = 0.7,
): Map<string, number> {
  const out = new Map<string, number>()
  for (const [category, weight] of sourceProfile) out.set(category, weight * discount)
  return out
}

export type SlotPreference = { slot: 'morning' | 'day' | 'evening' | 'night'; preferredLength: 'short' | 'long' }

/**
 * ALGO pers.time_slot - time-slot reading preference: dwell-weighted story
 * length per daypart. Morning commuters read short, evenings run long -
 * unless this reader's own history says otherwise.
 */
export function timeSlotPreference(
  reads: Array<{ at: string; readTimeMinutes: number }>,
  now = new Date(),
): SlotPreference {
  const slotOf = (hour: number): SlotPreference['slot'] =>
    hour < 6 ? 'night' : hour < 11 ? 'morning' : hour < 17 ? 'day' : hour < 22 ? 'evening' : 'night'

  const currentSlot = slotOf(now.getUTCHours())
  const inSlot = reads.filter((r) => slotOf(new Date(r.at).getUTCHours()) === currentSlot)
  if (inSlot.length < 3) {
    // Default editorial assumption per slot.
    return {
      slot: currentSlot,
      preferredLength: currentSlot === 'morning' || currentSlot === 'day' ? 'short' : 'long',
    }
  }
  const avg = mean(inSlot.map((r) => r.readTimeMinutes))
  return { slot: currentSlot, preferredLength: avg >= 5 ? 'long' : 'short' }
}

export type PushFeatures = {
  interestMatch: number // 0..1 profile affinity for the story
  hoursSinceLastVisit: number
  visitsLast7Days: number
  isQuietHours: boolean
  notificationsLast24h: number
}

/**
 * ALGO pers.push_propensity - send/skip score for a push notification:
 * logistic over interpretable features with fixed, documented weights.
 * Quiet hours and daily caps are hard gates, not weights.
 */
export function pushPropensity(features: PushFeatures): { score: number; send: boolean } {
  if (features.isQuietHours || features.notificationsLast24h >= 3) {
    return { score: 0, send: false }
  }
  const recency = Math.min(1, features.hoursSinceLastVisit / 48) // absence raises value
  const habit = Math.min(1, features.visitsLast7Days / 7)
  const linear =
    -1.2 + features.interestMatch * 2.4 + recency * 1.1 + habit * 0.8
  const score = 1 / (1 + Math.exp(-linear))
  return { score, send: score >= 0.55 }
}

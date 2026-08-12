/**
 * Personalization primitives: decayed interest profiles, co-visitation
 * collaborative filtering, session Markov chains, and fatigue handling.
 * All anonymous-friendly - keyed on category slugs and story ids only.
 */

export type TimedRead = {
  categoryId: string
  at: string
}

/**
 * ALGO pers.interest_decay - decayed interest profile: each read adds
 * weight 0.5^(ageDays / halfLifeDays) to its category. Fresh obsessions
 * outrank stale ones; the vector is L1-normalized.
 */
export function decayedInterestProfile(
  reads: TimedRead[],
  opts: { halfLifeDays?: number; now?: Date } = {},
): Map<string, number> {
  const halfLife = opts.halfLifeDays ?? 14
  const now = opts.now ?? new Date()
  const raw = new Map<string, number>()
  for (const read of reads) {
    const ageDays = Math.max(0, (now.getTime() - new Date(read.at).getTime()) / 86_400_000)
    const weight = Math.pow(0.5, ageDays / halfLife)
    raw.set(read.categoryId, (raw.get(read.categoryId) ?? 0) + weight)
  }
  const total = [...raw.values()].reduce((a, b) => a + b, 0)
  if (total === 0) return raw
  const normalized = new Map<string, number>()
  for (const [cat, weight] of raw) normalized.set(cat, weight / total)
  return normalized
}

/** ALGO pers.affinity - story-vs-profile affinity in [0,1]. */
export function profileAffinity(
  profile: Map<string, number>,
  story: { categoryId?: string },
): number {
  if (!story.categoryId) return 0
  return profile.get(story.categoryId) ?? 0
}

export type SessionReads = string[]

/**
 * ALGO pers.covisit - item-item co-visitation counts from sessions:
 * cooccurrence[a][b] = number of sessions containing both a and b.
 * The classic "readers of this also read" without any user identity.
 */
export function coVisitationCounts(sessions: SessionReads[]): Map<string, Map<string, number>> {
  const matrix = new Map<string, Map<string, number>>()
  for (const session of sessions) {
    const unique = [...new Set(session)]
    for (let i = 0; i < unique.length; i++) {
      for (let j = 0; j < unique.length; j++) {
        if (i === j) continue
        const row = matrix.get(unique[i]) ?? new Map<string, number>()
        row.set(unique[j], (row.get(unique[j]) ?? 0) + 1)
        matrix.set(unique[i], row)
      }
    }
  }
  return matrix
}

/**
 * ALGO pers.item_cf - item-item CF scores for a story with lift-style
 * normalization: score(b|a) = covisit(a,b) / sqrt(popularity(b)).
 * The sqrt damping stops mega-popular stories from dominating every list.
 */
export function itemItemScores(
  storyId: string,
  matrix: Map<string, Map<string, number>>,
  popularity: Map<string, number>,
): Array<{ id: string; score: number }> {
  const row = matrix.get(storyId)
  if (!row) return []
  return [...row.entries()]
    .map(([id, covisits]) => ({
      id,
      score: covisits / Math.sqrt(Math.max(1, popularity.get(id) ?? 1)),
    }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
}

/**
 * ALGO pers.markov_next - first-order Markov next-read: transition counts
 * from ordered sessions, returning P(next | current), Laplace-smoothed over
 * observed successors.
 */
export function markovNextRead(
  sessions: SessionReads[],
  currentStoryId: string,
): Array<{ id: string; probability: number }> {
  const transitions = new Map<string, number>()
  let total = 0
  for (const session of sessions) {
    for (let i = 0; i + 1 < session.length; i++) {
      if (session[i] === currentStoryId && session[i + 1] !== currentStoryId) {
        transitions.set(session[i + 1], (transitions.get(session[i + 1]) ?? 0) + 1)
        total += 1
      }
    }
  }
  if (total === 0) return []
  const k = transitions.size
  return [...transitions.entries()]
    .map(([id, count]) => ({ id, probability: (count + 1) / (total + k) }))
    .sort((a, b) => b.probability - a.probability || a.id.localeCompare(b.id))
}

/**
 * ALGO pers.fatigue - impression fatigue: multiplicative dampening
 * factor 1/(1+seenCount*strength) in (0,1]. Seen five times at default
 * strength => score multiplied by 0.29.
 */
export function impressionFatigue(seenCount: number, strength = 0.5): number {
  return 1 / (1 + Math.max(0, seenCount) * strength)
}

/** ALGO pers.freq_cap - hard frequency cap for promos/notifications. */
export function withinFrequencyCap(shownTimestamps: string[], maxPerWindow: number, windowHours: number, now = new Date()): boolean {
  const windowMs = windowHours * 3600_000
  const recent = shownTimestamps.filter(
    (t) => now.getTime() - new Date(t).getTime() <= windowMs,
  )
  return recent.length < maxPerWindow
}

/**
 * ALGO pers.cold_start_blend - blend weight for personal vs global ranking:
 * w = n / (n + k). With k=10: 0 signals => fully global, 10 => 50/50,
 * 40 => 80% personal.
 */
export function coldStartBlendWeight(signalCount: number, k = 10): number {
  const n = Math.max(0, signalCount)
  return n / (n + k)
}

/** Blend two scores using the cold-start weight. */
export function blendScores(personalScore: number, globalScore: number, signalCount: number, k = 10): number {
  const w = coldStartBlendWeight(signalCount, k)
  return w * personalScore + (1 - w) * globalScore
}

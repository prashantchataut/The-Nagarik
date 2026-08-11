import { buildTfIdf, cosineSimilaritySparse, extractKeywords, hammingDistance32, jaccardSimilarity, simhash32, tokenizeText } from './text'
import { mean } from './stats'
import { detectBurst } from './velocity'
import { thompsonSample, type Arm } from './bandit'

/**
 * Editorial intelligence: clustering wire copies, publish timing, headline
 * testing, coverage gaps, evergreen resurfacing, correction propagation,
 * tag suggestions, and related-story gating.
 */

export type StoryCluster<T> = { canonical: T; members: T[] }

/**
 * ALGO ed.wire_cluster - collapse near-duplicate wire copies. Headlines are
 * short, so a 32-bit simhash alone is noisy (each token flips many bits):
 * two detectors vote - simhash Hamming <= maxHamming OR token Jaccard >=
 * jaccardThreshold against the cluster's canonical title. The earliest
 * published member is canonical.
 */
export function clusterWireCopies<T extends { id: string; title: string; publishedAt?: string }>(
  stories: T[],
  opts: { maxHamming?: number; jaccardThreshold?: number } = {},
): Array<StoryCluster<T>> {
  const maxHamming = opts.maxHamming ?? 3
  const jaccardThreshold = opts.jaccardThreshold ?? 0.6
  const withHash = stories.map((story) => {
    const tokens = tokenizeText(story.title)
    return { story, hash: simhash32(tokens), tokens: new Set(tokens) }
  })
  const clusters: Array<{ hash: number; tokens: Set<string>; members: typeof withHash }> = []
  for (const item of withHash) {
    const host = clusters.find(
      (c) =>
        hammingDistance32(c.hash, item.hash) <= maxHamming ||
        jaccardSimilarity(c.tokens, item.tokens) >= jaccardThreshold,
    )
    if (host) host.members.push(item)
    else clusters.push({ hash: item.hash, tokens: item.tokens, members: [item] })
  }
  return clusters.map((c) => {
    const sorted = [...c.members].sort((a, b) =>
      (a.story.publishedAt ?? '9999').localeCompare(b.story.publishedAt ?? '9999'),
    )
    return { canonical: sorted[0].story, members: sorted.map((m) => m.story) }
  })
}

/**
 * ALGO ed.publish_time - optimal publish-hour suggestion per category:
 * engagement-weighted hour histogram from history, top-k hours. Thin data
 * (< minSamples) returns the newsroom default hours honestly.
 */
export function optimalPublishHours(
  history: Array<{ categoryId: string; publishedHour: number; engagement: number }>,
  categoryId: string,
  opts: { topK?: number; minSamples?: number; defaults?: number[] } = {},
): { hours: number[]; basis: 'history' | 'default' } {
  const topK = opts.topK ?? 3
  const minSamples = opts.minSamples ?? 12
  const defaults = opts.defaults ?? [7, 12, 18]
  const rows = history.filter((h) => h.categoryId === categoryId)
  if (rows.length < minSamples) return { hours: defaults.slice(0, topK), basis: 'default' }

  const byHour = new Map<number, number[]>()
  for (const row of rows) {
    const hour = ((Math.floor(row.publishedHour) % 24) + 24) % 24
    byHour.set(hour, [...(byHour.get(hour) ?? []), row.engagement])
  }
  const hours = [...byHour.entries()]
    .map(([hour, engagements]) => ({ hour, avg: mean(engagements) }))
    .sort((a, b) => b.avg - a.avg || a.hour - b.hour)
    .slice(0, topK)
    .map((x) => x.hour)
  return { hours, basis: 'history' }
}

export type HeadlineVariant = { id: string; impressions: number; clicks: number }

/**
 * ALGO ed.headline_ab - headline A/B via Thompson sampling: pick which
 * variant to show next; declare a winner only when one variant has both
 * enough exposure and >= 95% posterior preference across sampled draws.
 */
export function headlineTestStep(
  variants: HeadlineVariant[],
  rng: () => number,
  opts: { minImpressionsToDecide?: number; samples?: number } = {},
): { show: string; winner: string | null } {
  if (!variants.length) throw new RangeError('at least one variant required')
  const arms: Arm[] = variants.map((v) => ({ id: v.id, pulls: v.impressions, rewards: v.clicks }))
  const show = thompsonSample(arms, rng)

  const minImpressions = opts.minImpressionsToDecide ?? 300
  const samples = opts.samples ?? 200
  if (variants.some((v) => v.impressions < minImpressions) || variants.length < 2) {
    return { show, winner: null }
  }
  const wins = new Map<string, number>()
  for (let i = 0; i < samples; i++) {
    const pick = thompsonSample(arms, rng)
    wins.set(pick, (wins.get(pick) ?? 0) + 1)
  }
  const best = [...wins.entries()].sort((a, b) => b[1] - a[1])[0]
  return { show, winner: best && best[1] / samples >= 0.95 ? best[0] : null }
}

/**
 * ALGO ed.story_gap - coverage gap detection: terms bursting in reader
 * search queries that barely appear in the published corpus. The queue of
 * stories the audience is asking for and the desk has not written.
 */
export function detectStoryGaps(
  queryWindows: Map<string, number[]>,
  corpusTokens: string[][],
  opts: { maxCorpusMentions?: number; limit?: number } = {},
): Array<{ term: string; burstScore: number; corpusMentions: number }> {
  const maxMentions = opts.maxCorpusMentions ?? 1
  const limit = opts.limit ?? 8
  const corpusCounts = new Map<string, number>()
  for (const doc of corpusTokens) {
    for (const token of new Set(doc)) {
      corpusCounts.set(token, (corpusCounts.get(token) ?? 0) + 1)
    }
  }
  const gaps: Array<{ term: string; burstScore: number; corpusMentions: number }> = []
  for (const [term, windows] of queryWindows) {
    const verdict = detectBurst(windows)
    if (!verdict.bursting) continue
    const mentions = corpusCounts.get(term.toLowerCase()) ?? 0
    if (mentions <= maxMentions) {
      gaps.push({ term, burstScore: verdict.score, corpusMentions: mentions })
    }
  }
  return gaps.sort((a, b) => b.burstScore - a.burstScore || a.term.localeCompare(b.term)).slice(0, limit)
}

/**
 * ALGO ed.evergreen - resurface old stories with fresh velocity: age must
 * exceed minAgeDays AND the latest window must burst against the story's
 * own baseline. Old + suddenly-read = resurface candidate.
 */
export function evergreenCandidates<T extends { id: string; publishedAt?: string }>(
  stories: T[],
  windows: Map<string, number[]>,
  opts: { minAgeDays?: number; limit?: number; now?: Date } = {},
): Array<T & { burstScore: number }> {
  const minAgeDays = opts.minAgeDays ?? 30
  const limit = opts.limit ?? 5
  const now = opts.now ?? new Date()
  return stories
    .filter((s) => {
      if (!s.publishedAt) return false
      const ageDays = (now.getTime() - new Date(s.publishedAt).getTime()) / 86_400_000
      return ageDays >= minAgeDays
    })
    .map((story) => ({ story, verdict: detectBurst(windows.get(story.id) ?? []) }))
    .filter(({ verdict }) => verdict.bursting)
    .map(({ story, verdict }) => ({ ...story, burstScore: verdict.score }))
    .sort((a, b) => b.burstScore - a.burstScore)
    .slice(0, limit)
}

/**
 * ALGO ed.correction_propagation - BFS over the citation graph from
 * corrected stories: every story citing (directly or transitively) a
 * corrected story gets flagged for review, with its distance.
 */
export function propagateCorrections(
  citations: Map<string, string[]>, // storyId -> ids it cites
  correctedIds: string[],
): Array<{ id: string; distance: number }> {
  // Invert: cited -> citing.
  const citedBy = new Map<string, string[]>()
  for (const [story, cites] of citations) {
    for (const cited of cites) {
      citedBy.set(cited, [...(citedBy.get(cited) ?? []), story])
    }
  }
  const flagged = new Map<string, number>()
  const queue: Array<{ id: string; distance: number }> = correctedIds.map((id) => ({ id, distance: 0 }))
  const seen = new Set(correctedIds)
  while (queue.length) {
    const { id, distance } = queue.shift()!
    for (const citing of citedBy.get(id) ?? []) {
      if (seen.has(citing)) continue
      seen.add(citing)
      flagged.set(citing, distance + 1)
      queue.push({ id: citing, distance: distance + 1 })
    }
  }
  return [...flagged.entries()]
    .map(([id, distance]) => ({ id, distance }))
    .sort((a, b) => a.distance - b.distance || a.id.localeCompare(b.id))
}

/**
 * ALGO ed.tag_suggest - composer tag suggestions: TF-IDF keywords of the
 * draft against the recent corpus, mapped onto the existing tag vocabulary
 * first (exact/substring), leftover keywords proposed as new tags.
 */
export function suggestTags(
  draftText: string,
  corpusTexts: string[],
  existingTags: Array<{ slug: string; nameNe: string; nameEn: string }>,
  k = 6,
): { existing: string[]; proposed: string[] } {
  const keywords = extractKeywords(
    tokenizeText(draftText),
    corpusTexts.map((t) => tokenizeText(t)),
    k * 2,
  )
  const existing: string[] = []
  const proposed: string[] = []
  for (const { term } of keywords) {
    const match = existingTags.find(
      (tag) =>
        tag.slug === term ||
        tag.nameNe.toLowerCase().includes(term) ||
        tag.nameEn.toLowerCase().includes(term),
    )
    if (match) {
      if (!existing.includes(match.slug)) existing.push(match.slug)
    } else if (proposed.length < k) {
      proposed.push(term)
    }
    if (existing.length >= k) break
  }
  return { existing: existing.slice(0, k), proposed }
}

/**
 * ALGO ed.related_gate - related-story quality gate: cosine similarity of
 * TF-IDF vectors must clear a floor, otherwise the slot stays empty.
 * An empty related rail beats a misleading one.
 */
export function gateRelatedStories<T extends { id: string; text: string }>(
  source: { id: string; text: string },
  candidates: T[],
  minSimilarity = 0.12,
): Array<T & { similarity: number }> {
  const docs = [source.text, ...candidates.map((c) => c.text)].map((t) => tokenizeText(t))
  const model = buildTfIdf(docs)
  const sourceVec = model.vectors[0]
  return candidates
    .map((candidate, i) => ({
      ...candidate,
      similarity: cosineSimilaritySparse(sourceVec, model.vectors[i + 1]),
    }))
    .filter((c) => c.similarity >= minSimilarity && c.id !== source.id)
    .sort((a, b) => b.similarity - a.similarity)
}

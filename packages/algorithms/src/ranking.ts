export type RankingSignals = {
  impressions?: number
  clicks?: number
  dwellMs?: number
  completions?: number
  shares?: number
  velocity15m?: number
  baseline120m?: number
  topicSimilarity?: number
  fatiguePenalty?: number
  qualityTrustScore?: number
  ltvScore?: number
  sponsored?: boolean
  doNotRecommend?: boolean
}

export type RankableStory = {
  id: string
  publishedAt?: string
  editorialPriority?: number
  categoryId?: string
  isBreaking?: boolean
}

function timeDecayScore(publishedAt: string | undefined, now: Date): number {
  if (!publishedAt) return 0
  const ageHours = Math.max(0, (now.getTime() - new Date(publishedAt).getTime()) / 3600_000)
  return 24 / (24 + ageHours)
}

function bayesianCtr(clicks: number, impressions: number, prior = 0.02, strength = 50): number {
  return (clicks + prior * strength) / (impressions + strength)
}

export function weightedScore(story: RankableStory, signals: RankingSignals = {}, now = new Date()): number {
  if (signals.doNotRecommend) return Number.NEGATIVE_INFINITY

  const impressions = signals.impressions ?? 0
  const clicks = signals.clicks ?? 0
  const ctr = bayesianCtr(clicks, impressions)
  const velocity = signals.velocity15m ?? 0
  const baseline = Math.max(signals.baseline120m ?? 0, 0.01)
  const burst = Math.min(velocity / baseline, 10)
  const engagement =
    ctr * 40 +
    Math.min((signals.dwellMs ?? 0) / 60_000, 8) * 3 +
    (signals.completions ?? 0) * 4 +
    (signals.shares ?? 0) * 5 +
    burst * 6

  const score =
    (story.editorialPriority ?? 0) * 18 +
    timeDecayScore(story.publishedAt, now) * 20 +
    engagement +
    (signals.topicSimilarity ?? 0) * 12 +
    (signals.qualityTrustScore ?? 0) * 10 +
    (signals.ltvScore ?? 0) * 8 +
    (story.isBreaking ? 12 : 0) -
    (signals.fatiguePenalty ?? 0) * 16 -
    (signals.sponsored ? 20 : 0)

  return Number.isFinite(score) ? score : 0
}

export function rankStories<T extends RankableStory>(
  stories: T[],
  signalFor: (story: T) => RankingSignals = () => ({}),
  now = new Date(),
): Array<T & { score: number }> {
  return stories
    .map((story) => ({ ...story, score: weightedScore(story, signalFor(story), now) }))
    .sort((a, b) => b.score - a.score)
}

export function applyCategoryDiversity<T extends { categoryId?: string }>(items: T[], maxStreak = 2): T[] {
  const out: T[] = []
  let streak = 0
  let last: string | undefined
  const deferred: T[] = []

  for (const item of items) {
    const cat = item.categoryId
    if (cat && cat === last && streak >= maxStreak) {
      deferred.push(item)
      continue
    }
    out.push(item)
    if (cat === last) streak += 1
    else {
      last = cat
      streak = 1
    }
  }
  return [...out, ...deferred]
}

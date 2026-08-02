export type EngagementSample = {
  storyId: string
  impressions15m: number
  impressions120m: number
  clicks15m?: number
}

export type TrendingResult<T> = {
  items: T[]
  live: boolean
  reason: 'velocity' | 'fallback-recency'
}

export function trendingScore(sample: EngagementSample, publishedAt: string | undefined, now = new Date()): number {
  const velocity = sample.impressions15m
  const baseline = Math.max(sample.impressions120m / 8, 0.5)
  const burst = Math.min(velocity / baseline, 10)
  const ageHours = publishedAt
    ? Math.max(0, (now.getTime() - new Date(publishedAt).getTime()) / 3600_000)
    : 48
  const recency = Math.pow(0.5, ageHours / 6)
  return velocity * (1 + burst) * recency
}

export function detectTrending<T extends { id: string; publishedAt?: string }>(
  stories: T[],
  samples: EngagementSample[],
  opts: { minLive?: number; limit?: number } = {},
  now = new Date(),
): TrendingResult<T> {
  const minLive = opts.minLive ?? 2
  const limit = opts.limit ?? 10
  const byId = new Map(samples.map((s) => [s.storyId, s]))

  const scored = stories
    .map((story) => {
      const sample = byId.get(story.id)
      if (!sample) return { story, score: 0 }
      return { story, score: trendingScore(sample, story.publishedAt, now) }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)

  if (scored.length < minLive) {
    const fallback = [...stories]
      .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
      .slice(0, limit)
    return { items: fallback, live: false, reason: 'fallback-recency' }
  }

  return {
    items: scored.slice(0, limit).map((s) => s.story),
    live: true,
    reason: 'velocity',
  }
}

export type DwellStat = { storyId: string; dwellMs: number; views: number }

export function mostRead<T extends { id: string; publishedAt?: string }>(
  stories: T[],
  stats: DwellStat[],
  opts: { minLive?: number; limit?: number } = {},
): TrendingResult<T> {
  const minLive = opts.minLive ?? 3
  const limit = opts.limit ?? 10
  const byId = new Map(stats.map((s) => [s.storyId, s]))
  const scored = stories
    .map((story) => {
      const s = byId.get(story.id)
      if (!s || s.views < 1) return null
      return { story, score: s.dwellMs / s.views }
    })
    .filter(Boolean) as Array<{ story: T; score: number }>

  scored.sort((a, b) => b.score - a.score)

  if (scored.length < minLive) {
    const fallback = [...stories]
      .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
      .slice(0, limit)
    return { items: fallback, live: false, reason: 'fallback-recency' }
  }

  return {
    items: scored.slice(0, limit).map((s) => s.story),
    live: true,
    reason: 'velocity',
  }
}

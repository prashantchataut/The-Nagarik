import {
  acceleration,
  clusterTrendingTopics,
  detectBurst,
  kleinbergBursts,
  lifecyclePhase,
  poissonSurprise,
  tokenizeText,
  velocityRank,
  type LifecyclePhase,
} from '@thenagarik/algorithms'
import { getContent } from '@/lib/content'
import { getEngagementSnapshot } from '@/lib/engagement'

/**
 * Signals Desk data layer: the editorial trending dashboard.
 * Pure aggregation over the engagement snapshot + published stories;
 * every number traces to a registry algorithm (trend.*, vel.*).
 */

export type StorySignal = {
  id: string
  title: string
  categorySlug: string
  publishedAt: string | null
  windows: number[]
  velocityScore: number
  accelerationPerMin: number
  bursting: boolean
  burstScore: number
  kleinbergBursting: boolean
  surprise: number
  phase: LifecyclePhase
  /**
   * True when the story has fewer than MIN_SIGNAL_EVENTS impressions in the
   * analysis window. Burst/surprise diagnostics are statistically meaningless
   * at that volume (Poisson surprise on 3 events reads like a fire alarm), so
   * they are zeroed/suppressed and the UI shows a "thin data" chip instead.
   */
  lowVolume: boolean
}

/**
 * Minimum impressions (whole 2h window) before burst/surprise diagnostics
 * are trusted. Below this, velocity ordering still works - it degrades
 * gracefully - but alarm-style signals are suppressed.
 */
export const MIN_SIGNAL_EVENTS = 12


export type SignalsDesk = {
  windowMinutes: number
  sampleN: number
  lastEventAgeSec: number | null
  signals: StorySignal[]
  topics: Array<{ keywords: string[]; storyIds: string[] }>
  live: boolean
}

export async function getSignalsDesk(limit = 20): Promise<SignalsDesk> {
  const [snapshot, content] = await Promise.all([
    getEngagementSnapshot(),
    Promise.resolve(getContent()),
  ])
  const articles = await content.listPublishedArticles({ locale: 'ne' })
  const cards = await Promise.all(articles.map((a) => content.toStoryCard(a, 'ne')))
  const cardById = new Map(cards.map((c) => [c.id, c]))

  const windows = new Map(snapshot.windowSeries.map((w) => [w.storyId, w.windows]))
  const times = new Map(snapshot.impressionTimes.map((t) => [t.storyId, t.times]))

  // ALGO vel.velocity_rank drives the ordering; per-story diagnostics follow.
  const ranked = velocityRank(
    articles.map((a) => ({ id: a.id, publishedAt: a.publishedAt })),
    windows,
    { windowMinutes: snapshot.windowMinutes, limit },
  )

  const signals: StorySignal[] = ranked.map((story) => {
    const series = windows.get(story.id) ?? []
    const card = cardById.get(story.id)
    const burst = detectBurst(series)
    const baseline = series.slice(0, -1)
    const expected = baseline.length
      ? baseline.reduce((a, b) => a + b, 0) / baseline.length
      : 0
    const latest = series[series.length - 1] ?? 0
    // Min-volume gate: burst automata and Poisson surprise scream on thin
    // data (3 impressions can be "10x baseline"). Below MIN_SIGNAL_EVENTS
    // total impressions we zero the alarms and flag the row instead.
    const totalEvents = series.reduce((a, b) => a + b, 0)
    const lowVolume = totalEvents < MIN_SIGNAL_EVENTS
    return {
      id: story.id,
      title: card?.title ?? story.id,
      categorySlug: card?.categorySlug ?? '',
      publishedAt: story.publishedAt ?? null,
      windows: series,
      velocityScore: story.velocityScore,
      // ALGO vel.acceleration
      accelerationPerMin: acceleration(series, snapshot.windowMinutes),
      bursting: !lowVolume && story.bursting,
      burstScore: lowVolume ? 0 : burst.score,
      // ALGO trend.kleinberg - burst automaton over raw impression times.
      kleinbergBursting:
        !lowVolume && kleinbergBursts(times.get(story.id) ?? []).length > 0,
      // ALGO trend.poisson_surprise - how improbable is the latest window?
      surprise: lowVolume ? 0 : poissonSurprise(latest, Math.max(expected, 0.001)),
      // ALGO trend.lifecycle
      phase: lifecyclePhase(series, 5),
      lowVolume,
    }
  })

  // ALGO trend.topic_cluster - cluster bursting stories by title keywords.
  const burstingIds = new Set(signals.filter((s) => s.bursting || s.kleinbergBursting).map((s) => s.id))
  const keywordDocs = signals.map((s) => ({
    id: s.id,
    keywords: tokenizeText(s.title),
  }))
  const burstingKeywords = [
    ...new Set(
      keywordDocs.filter((d) => burstingIds.has(d.id)).flatMap((d) => d.keywords),
    ),
  ]
  const topics = clusterTrendingTopics(keywordDocs, burstingKeywords).filter(
    (t) => t.storyIds.length >= 2 || burstingIds.has(t.storyIds[0]),
  )

  return {
    windowMinutes: snapshot.windowMinutes,
    sampleN: snapshot.sampleN,
    lastEventAgeSec: snapshot.lastEventAgeSec,
    signals,
    topics: topics.slice(0, 6),
    live: signals.length > 0,
  }
}

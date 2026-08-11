import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '@payload-config'
import { payloadDeskAvailable } from '@/lib/admin/payload-desk'

export type EngagementEvent = {
  type: 'impression' | 'click' | 'dwell' | 'complete' | 'share' | 'search'
  storyId?: string
  query?: string
  dwellMs?: number
  at: string
  consent: true
}

type Store = {
  events: EngagementEvent[]
}

/**
 * Engagement store: Postgres via the `engagement-events` collection whenever
 * the CMS is configured (multi-instance safe, survives deploys), gitignored
 * JSON file only as the facade/dev fallback.
 */

const DATA_DIR = path.join(process.cwd(), '.data')
const FILE = path.join(DATA_DIR, 'engagement.json')

/** Rolling analysis window for trending/most-read aggregation. */
const SNAPSHOT_LIMIT = 5000

async function loadFile(): Promise<Store> {
  try {
    const raw = await readFile(FILE, 'utf8')
    return JSON.parse(raw) as Store
  } catch {
    return { events: [] }
  }
}

async function saveFile(store: Store) {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(FILE, JSON.stringify(store, null, 2), 'utf8')
}

export async function recordEvent(event: EngagementEvent) {
  if (payloadDeskAvailable()) {
    try {
      const p = await getPayload({ config })
      await p.create({
        collection: 'engagement-events',
        data: {
          type: event.type,
          storyId: event.storyId ?? '',
          query: event.query ?? '',
          dwellMs: event.dwellMs ?? undefined,
        },
        overrideAccess: true,
      })
      return event
    } catch {
      // Fall through to the local file so signals are never dropped in dev.
    }
  }

  const store = await loadFile()
  store.events.push(event)
  store.events = store.events.slice(-SNAPSHOT_LIMIT)
  await saveFile(store)
  return event
}

async function loadRecentEvents(): Promise<EngagementEvent[]> {
  if (payloadDeskAvailable()) {
    try {
      const p = await getPayload({ config })
      const result = await p.find({
        collection: 'engagement-events',
        limit: SNAPSHOT_LIMIT,
        sort: '-createdAt',
        depth: 0,
        overrideAccess: true,
      })
      return result.docs.map((doc) => {
        const d = doc as {
          type?: unknown
          storyId?: unknown
          query?: unknown
          dwellMs?: unknown
          createdAt?: unknown
        }
        return {
          type: (d.type as EngagementEvent['type']) ?? 'impression',
          storyId: typeof d.storyId === 'string' && d.storyId ? d.storyId : undefined,
          query: typeof d.query === 'string' && d.query ? d.query : undefined,
          dwellMs: typeof d.dwellMs === 'number' ? d.dwellMs : undefined,
          at: typeof d.createdAt === 'string' ? d.createdAt : new Date().toISOString(),
          consent: true,
        }
      })
    } catch {
      // fall through
    }
  }
  const store = await loadFile()
  return store.events
}

export async function getEngagementSnapshot() {
  const events = await loadRecentEvents()
  const now = Date.now()
  const last = events.length
    ? events.reduce((a, b) => (a.at > b.at ? a : b))
    : undefined
  const lastAge = last ? Math.round((now - new Date(last.at).getTime()) / 1000) : null

  const byStory = new Map<
    string,
    { impressions15m: number; impressions120m: number; clicks15m: number; dwellMs: number; views: number }
  >()

  for (const e of events) {
    if (!e.storyId) continue
    const ageMs = now - new Date(e.at).getTime()
    const row = byStory.get(e.storyId) ?? {
      impressions15m: 0,
      impressions120m: 0,
      clicks15m: 0,
      dwellMs: 0,
      views: 0,
    }
    if (e.type === 'impression') {
      if (ageMs <= 15 * 60_000) row.impressions15m += 1
      if (ageMs <= 120 * 60_000) row.impressions120m += 1
      row.views += 1
    }
    if (e.type === 'click' && ageMs <= 15 * 60_000) row.clicks15m += 1
    if (e.type === 'dwell') row.dwellMs += e.dwellMs ?? 0
    byStory.set(e.storyId, row)
  }

  return {
    sampleN: events.length,
    lastEventAgeSec: lastAge,
    trendingSamples: [...byStory.entries()].map(([storyId, v]) => ({
      storyId,
      impressions15m: v.impressions15m,
      impressions120m: v.impressions120m,
      clicks15m: v.clicks15m,
    })),
    dwellStats: [...byStory.entries()].map(([storyId, v]) => ({
      storyId,
      dwellMs: v.dwellMs,
      views: Math.max(v.views, 1),
    })),
    searchQueryN: events.filter((e) => e.type === 'search').length,
  }
}

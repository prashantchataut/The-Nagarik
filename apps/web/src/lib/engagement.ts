import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

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

const DATA_DIR = path.join(process.cwd(), '.data')
const FILE = path.join(DATA_DIR, 'engagement.json')

async function load(): Promise<Store> {
  try {
    const raw = await readFile(FILE, 'utf8')
    return JSON.parse(raw) as Store
  } catch {
    return { events: [] }
  }
}

async function save(store: Store) {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(FILE, JSON.stringify(store, null, 2), 'utf8')
}

export async function recordEvent(event: EngagementEvent) {
  const store = await load()
  store.events.push(event)
  // Keep last 5k events in local/dev file store (Postgres in Phase 3 ops migrate)
  store.events = store.events.slice(-5000)
  await save(store)
  return event
}

export async function getEngagementSnapshot() {
  const store = await load()
  const now = Date.now()
  const last = store.events.at(-1)
  const lastAge = last ? Math.round((now - new Date(last.at).getTime()) / 1000) : null

  const byStory = new Map<
    string,
    { impressions15m: number; impressions120m: number; clicks15m: number; dwellMs: number; views: number }
  >()

  for (const e of store.events) {
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
    sampleN: store.events.length,
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
    searchQueryN: store.events.filter((e) => e.type === 'search').length,
  }
}

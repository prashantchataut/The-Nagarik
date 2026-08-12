import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { z } from 'zod'
import { apiError, apiOk, clientIp } from '@/lib/api/http'
import { createRateLimiter } from '@/lib/api/rate-limit'
import { payloadDeskAvailable } from '@/lib/admin/payload-desk'
import { getReaderSession } from '@/lib/auth/reader-session'

export const dynamic = 'force-dynamic'

/**
 * Server-synced reader library: bookmarks + reading history across devices.
 *
 * - GET: current server copy.
 * - PUT: client sends its device-local copy; the server MERGES (union by
 *   storyId, newest timestamp wins) and returns the merged result, which the
 *   client writes back to localStorage. Merge lives server-side so N devices
 *   converge no matter the sync order.
 *
 * Anonymous readers never hit this route - their library stays device-local
 * (privacy-first default is unchanged).
 */

const SAVED_CAP = 100
const HISTORY_CAP = 60

const BookmarkSchema = z.object({
  storyId: z.string().min(1).max(128),
  title: z.string().max(300).default(''),
  categorySlug: z.string().max(60).default(''),
  slug: z.string().max(200).default(''),
  savedAt: z.string().datetime({ offset: true }).or(z.string().datetime()),
})

const HistorySchema = z.object({
  storyId: z.string().min(1).max(128),
  progress: z.number().min(0).max(1).default(0),
  updatedAt: z.string().datetime({ offset: true }).or(z.string().datetime()),
  categorySlug: z.string().max(60).default(''),
  slug: z.string().max(200).default(''),
  title: z.string().max(300).default(''),
})

const PutSchema = z.object({
  saved: z.array(BookmarkSchema).max(SAVED_CAP * 2).default([]),
  history: z.array(HistorySchema).max(HISTORY_CAP * 2).default([]),
})

/**
 * Deletions must be explicit: a union merge would resurrect anything a
 * device removed locally. scope 'all' without ids clears the whole list.
 */
const DeleteSchema = z.object({
  scope: z.enum(['saved', 'history', 'all']),
  storyIds: z.array(z.string().min(1).max(128)).max(SAVED_CAP).optional(),
})

const TombstoneSchema = z.object({
  storyId: z.string().min(1).max(128),
  deletedAt: z.string(),
})
const TombstonesSchema = z.object({
  saved: z.array(TombstoneSchema).default([]),
  history: z.array(TombstoneSchema).default([]),
})
type Tombstones = z.infer<typeof TombstonesSchema>
const TOMBSTONE_CAP = 300

function readTombstones(value: unknown): Tombstones {
  const parsed = TombstonesSchema.safeParse(value ?? {})
  return parsed.success ? parsed.data : { saved: [], history: [] }
}

type Bookmark = z.infer<typeof BookmarkSchema>
type HistoryEntry = z.infer<typeof HistorySchema>

/** 30 syncs per IP per 5 minutes - generous for humans, hostile to loops. */
const limiter = createRateLimiter({ windowMs: 5 * 60 * 1000, max: 30 })

function sanitizeList<S extends z.ZodTypeAny>(value: unknown, schema: S): Array<z.infer<S>> {
  if (!Array.isArray(value)) return []
  const out: Array<z.infer<S>> = []
  for (const item of value) {
    const parsed = schema.safeParse(item)
    if (parsed.success) out.push(parsed.data)
  }
  return out
}

/**
 * Union by storyId; the entry with the newest timestamp wins. Tombstoned
 * ids are dropped unless the incoming entry is NEWER than the deletion
 * (the reader genuinely re-saved after deleting on another device).
 */
function mergeByStory<T extends { storyId: string }>(
  server: T[],
  client: T[],
  timeOf: (item: T) => string,
  cap: number,
  tombstones: Array<{ storyId: string; deletedAt: string }>,
): { items: T[]; liveTombstones: Array<{ storyId: string; deletedAt: string }> } {
  const deletedAt = new Map(tombstones.map((t) => [t.storyId, t.deletedAt]))
  const byId = new Map<string, T>()
  for (const item of [...server, ...client]) {
    const tomb = deletedAt.get(item.storyId)
    if (tomb && timeOf(item) <= tomb) continue
    const existing = byId.get(item.storyId)
    if (!existing || timeOf(item) > timeOf(existing)) byId.set(item.storyId, item)
  }
  // A tombstone that lost to a newer re-save is dead; drop it.
  const liveTombstones = tombstones
    .filter((t) => !byId.has(t.storyId))
    .slice(-TOMBSTONE_CAP)
  return {
    items: [...byId.values()]
      .sort((a, b) => (timeOf(a) < timeOf(b) ? 1 : -1))
      .slice(0, cap),
    liveTombstones,
  }
}

export async function GET(): Promise<NextResponse> {
  if (!payloadDeskAvailable()) {
    return apiError('cms-offline', 'Account service is unavailable right now.')
  }
  const session = await getReaderSession()
  if (!session) {
    return apiError('unauthorized', 'Log in to sync your library.')
  }

  const payload = await getPayload({ config })
  const reader = await payload.findByID({
    collection: 'readers',
    id: session.id,
    depth: 0,
    overrideAccess: true,
  })
  return apiOk({
    saved: sanitizeList((reader as { savedStories?: unknown }).savedStories, BookmarkSchema),
    history: sanitizeList(
      (reader as { readingHistory?: unknown }).readingHistory,
      HistorySchema,
    ),
  })
}

export async function PUT(request: Request): Promise<NextResponse> {
  if (!payloadDeskAvailable()) {
    return apiError('cms-offline', 'Account service is unavailable right now.')
  }
  const session = await getReaderSession()
  if (!session) {
    return apiError('unauthorized', 'Log in to sync your library.')
  }

  const limit = limiter.check(`${clientIp(request)}:${session.id}`)
  if (limit.limited) {
    return apiError('rate-limit', 'Too many sync requests; please retry shortly.', {
      retryAfterSec: limit.retryAfterSec,
    })
  }

  const parsed = PutSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return apiError('invalid', 'Library payload failed validation.')
  }

  const payload = await getPayload({ config })
  const reader = await payload.findByID({
    collection: 'readers',
    id: session.id,
    depth: 0,
    overrideAccess: true,
  })

  const tombstones = readTombstones((reader as { libraryTombstones?: unknown }).libraryTombstones)

  const savedMerge = mergeByStory<Bookmark>(
    sanitizeList((reader as { savedStories?: unknown }).savedStories, BookmarkSchema),
    parsed.data.saved,
    (b) => b.savedAt,
    SAVED_CAP,
    tombstones.saved,
  )
  const historyMerge = mergeByStory<HistoryEntry>(
    sanitizeList((reader as { readingHistory?: unknown }).readingHistory, HistorySchema),
    parsed.data.history,
    (h) => h.updatedAt,
    HISTORY_CAP,
    tombstones.history,
  )

  await payload.update({
    collection: 'readers',
    id: session.id,
    data: {
      savedStories: savedMerge.items,
      readingHistory: historyMerge.items,
      libraryTombstones: {
        saved: savedMerge.liveTombstones,
        history: historyMerge.liveTombstones,
      },
    },
    overrideAccess: true,
  })

  return apiOk({ saved: savedMerge.items, history: historyMerge.items })
}

export async function DELETE(request: Request): Promise<NextResponse> {
  if (!payloadDeskAvailable()) {
    return apiError('cms-offline', 'Account service is unavailable right now.')
  }
  const session = await getReaderSession()
  if (!session) {
    return apiError('unauthorized', 'Log in to sync your library.')
  }

  const limit = limiter.check(`${clientIp(request)}:${session.id}`)
  if (limit.limited) {
    return apiError('rate-limit', 'Too many sync requests; please retry shortly.', {
      retryAfterSec: limit.retryAfterSec,
    })
  }

  const parsed = DeleteSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return apiError('invalid', 'scope (saved|history|all) is required.')
  }

  const payload = await getPayload({ config })
  const reader = await payload.findByID({
    collection: 'readers',
    id: session.id,
    depth: 0,
    overrideAccess: true,
  })

  const ids = new Set(parsed.data.storyIds ?? [])
  const dropAll = ids.size === 0
  const now = new Date().toISOString()

  let saved = sanitizeList(
    (reader as { savedStories?: unknown }).savedStories,
    BookmarkSchema,
  )
  let history = sanitizeList(
    (reader as { readingHistory?: unknown }).readingHistory,
    HistorySchema,
  )
  const tombstones = readTombstones((reader as { libraryTombstones?: unknown }).libraryTombstones)

  const applyScope = <T extends { storyId: string }>(
    list: T[],
    stones: Array<{ storyId: string; deletedAt: string }>,
  ): { list: T[]; stones: Array<{ storyId: string; deletedAt: string }> } => {
    const removed = dropAll ? list : list.filter((item) => ids.has(item.storyId))
    const kept = dropAll ? [] : list.filter((item) => !ids.has(item.storyId))
    const newStones = [
      ...stones.filter((t) => !removed.some((r) => r.storyId === t.storyId)),
      ...removed.map((r) => ({ storyId: r.storyId, deletedAt: now })),
      // Ids the server never had still get a tombstone: the deleting
      // device knew about them even if this server copy did not.
      ...(dropAll
        ? []
        : [...ids]
            .filter((sid) => !list.some((item) => item.storyId === sid))
            .map((sid) => ({ storyId: sid, deletedAt: now }))),
    ].slice(-TOMBSTONE_CAP)
    return { list: kept, stones: newStones }
  }

  if (parsed.data.scope === 'saved' || parsed.data.scope === 'all') {
    const r = applyScope(saved, tombstones.saved)
    saved = r.list
    tombstones.saved = r.stones
  }
  if (parsed.data.scope === 'history' || parsed.data.scope === 'all') {
    const r = applyScope(history, tombstones.history)
    history = r.list
    tombstones.history = r.stones
  }

  await payload.update({
    collection: 'readers',
    id: session.id,
    data: { savedStories: saved, readingHistory: history, libraryTombstones: tombstones },
    overrideAccess: true,
  })

  return apiOk({ saved, history })
}

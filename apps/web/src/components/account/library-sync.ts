'use client'

/**
 * Reader library sync: bridges the device-local store (reader-store.ts)
 * with the server copy at /api/reader/library for LOGGED-IN readers.
 *
 * Rules:
 * - Anonymous readers: no network calls, library stays device-local.
 * - Logged-in readers: push local state, server merges (union by storyId,
 *   newest wins), merged result is written back locally, panels re-render
 *   via LIBRARY_EVENT.
 * - All calls are best-effort: a failed sync NEVER breaks reading UX.
 */

import { readBookmarks, readHistory, writeBookmarks, writeHistory } from './reader-store'

export const LIBRARY_EVENT = 'tn:reader-library'

/** Session probe cache: 60s TTL so a fresh login is picked up quickly. */
let sessionState: { value: boolean; at: number } | null = null
const SESSION_TTL_MS = 60_000

async function hasReaderSession(): Promise<boolean> {
  if (sessionState && Date.now() - sessionState.at < SESSION_TTL_MS) {
    return sessionState.value
  }
  try {
    const res = await fetch('/api/reader/me', { cache: 'no-store' })
    const data = (await res.json()) as { reader?: unknown }
    sessionState = { value: Boolean(data?.reader), at: Date.now() }
  } catch {
    sessionState = { value: false, at: Date.now() }
  }
  return sessionState.value
}

/** Force the next sync to re-probe the session (call after login/logout). */
export function invalidateSessionProbe(): void {
  sessionState = null
}

let inFlight: Promise<boolean> | null = null

/**
 * Push local library, pull the merged result. Resolves true when a merge
 * was applied locally. Concurrent callers share one round trip.
 */
export function syncLibrary(): Promise<boolean> {
  if (inFlight) return inFlight
  inFlight = doSync().finally(() => {
    inFlight = null
  })
  return inFlight
}

async function doSync(): Promise<boolean> {
  try {
    if (!(await hasReaderSession())) return false
    const res = await fetch('/api/reader/library', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ saved: readBookmarks(), history: readHistory() }),
    })
    if (!res.ok) return false
    const data = (await res.json()) as {
      ok?: boolean
      saved?: Parameters<typeof writeBookmarks>[0]
      history?: Parameters<typeof writeHistory>[0]
    }
    if (!data.ok) return false
    writeBookmarks(Array.isArray(data.saved) ? data.saved : [])
    writeHistory(Array.isArray(data.history) ? data.history : [])
    window.dispatchEvent(new CustomEvent(LIBRARY_EVENT))
    return true
  } catch {
    return false
  }
}

let timer: ReturnType<typeof setTimeout> | null = null

/** Debounced sync for write paths (bookmark toggles, reading progress). */
export function queueLibrarySync(delayMs = 4000): void {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    void syncLibrary()
  }, delayMs)
}

/**
 * Explicit server-side deletion (union merges would otherwise resurrect
 * locally removed items on the next sync). Empty storyIds = clear the scope.
 */
export async function deleteFromLibrary(
  scope: 'saved' | 'history' | 'all',
  storyIds: string[] = [],
): Promise<void> {
  try {
    if (!(await hasReaderSession())) return
    await fetch('/api/reader/library', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(storyIds.length ? { scope, storyIds } : { scope }),
    })
  } catch {
    // Best effort; the local removal already happened.
  }
}

/**
 * Central rate limiter for public write endpoints.
 *
 * Sliding-window, per-key (usually per-IP), in-memory per server instance.
 * On serverless multi-instance deployments each instance keeps its own
 * window, so real limits are `max × instances` - acceptable as abuse
 * dampening; strict global limits belong at the edge (Cloudflare rules)
 * per docs/PRODUCTION_HARDENING.md.
 */

export type RateLimiter = {
  /** Returns limit state and, when allowed, records the hit. */
  check: (key: string) => { limited: boolean; remaining: number; retryAfterSec: number }
  /** Test/ops helper. */
  reset: (key?: string) => void
}

export function createRateLimiter(options: {
  windowMs: number
  max: number
  /** Cap tracked keys to bound memory (oldest evicted). Default 10_000. */
  maxKeys?: number
}): RateLimiter {
  const { windowMs, max } = options
  const maxKeys = options.maxKeys ?? 10_000
  const hits = new Map<string, number[]>()

  function prune(now: number, list: number[]): number[] {
    return list.filter((t) => now - t < windowMs)
  }

  return {
    check(key: string) {
      const now = Date.now()
      const list = prune(now, hits.get(key) ?? [])

      if (list.length >= max) {
        hits.set(key, list)
        const oldest = list[0]
        return {
          limited: true,
          remaining: 0,
          retryAfterSec: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
        }
      }

      list.push(now)
      hits.set(key, list)

      // Bound memory: evict oldest-inserted keys beyond the cap.
      if (hits.size > maxKeys) {
        const firstKey = hits.keys().next().value
        if (firstKey !== undefined) hits.delete(firstKey)
      }

      return { limited: false, remaining: max - list.length, retryAfterSec: 0 }
    },
    reset(key?: string) {
      if (key === undefined) hits.clear()
      else hits.delete(key)
    },
  }
}

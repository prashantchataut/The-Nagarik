import { expect, type APIRequestContext } from '@playwright/test'

/** Staff credentials created by the seed script (local/CI only). */
export const STAFF_EMAIL = 'admin@nagarik.local'
export const STAFF_PASSWORD = 'NagarikPitch2026!'

/** Unique-per-run suffix so reruns never trip "email taken" or dup filters. */
export const RUN_ID = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`

/**
 * Forge a unique client IP per call site AND per run. `clientIp()` trusts
 * x-forwarded-for (first hop), which lets specs both dodge cross-run rate
 * limits (limiter state lives in the server process) and deterministically
 * test the limiter itself.
 */
let ipCounter = 0
const IP_RUN_BASE = 1 + Math.floor(Math.random() * 250)
export function forgedIp(): string {
  ipCounter += 1
  return `10.${IP_RUN_BASE}.${(ipCounter >> 8) & 255}.${ipCounter & 255}`
}

export function ipHeaders(ip: string = forgedIp()): Record<string, string> {
  return { 'x-forwarded-for': ip }
}

/** Register a fresh reader; returns its credentials. Session cookie lands in the context jar. */
export async function registerReader(request: APIRequestContext, tag: string) {
  const email = `e2e-${tag}-${RUN_ID}@example.com`
  const password = `E2ePass-${RUN_ID}!`
  const res = await request.post('/api/reader/register', {
    headers: ipHeaders(),
    data: { name: `E2E Reader ${tag}`, email, password, locale: 'ne' },
  })
  expect(res.status(), await res.text()).toBe(201)
  return { email, password }
}

/** Log in as the seeded staff admin. Session cookie lands in the context jar. */
export async function loginStaff(request: APIRequestContext) {
  const res = await request.post('/api/staff/login', {
    headers: ipHeaders(),
    data: { email: STAFF_EMAIL, password: STAFF_PASSWORD },
  })
  expect(res.status(), await res.text()).toBe(200)
}

/** First published article id via the public payload REST read. */
export async function firstPublishedArticleId(request: APIRequestContext): Promise<string> {
  const res = await request.get('/api/articles', {
    params: { limit: '1', depth: '0', 'where[status][equals]': 'published' },
  })
  expect(res.status(), await res.text()).toBe(200)
  const body = (await res.json()) as { docs: Array<{ id: string | number }> }
  expect(body.docs.length).toBeGreaterThan(0)
  return String(body.docs[0].id)
}

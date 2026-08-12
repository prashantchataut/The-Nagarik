import { expect, test } from '@playwright/test'

/**
 * Cron endpoints are bearer-secured maintenance surfaces. The retention
 * job is what keeps the engagement_events table from growing unbounded
 * (ADR: trending reads only the last 2 hours; horizon defaults to 14 days).
 */

const SECRET = process.env.CRON_SECRET ?? ''

test('engagement retention rejects anonymous callers', async ({ request }) => {
  const res = await request.post('/api/cron/engagement-retention')
  expect(res.status()).toBe(401)
})

test('engagement retention rejects a wrong bearer token', async ({ request }) => {
  const res = await request.post('/api/cron/engagement-retention', {
    headers: { authorization: 'Bearer definitely-not-the-secret-value-32chars' },
  })
  expect(res.status()).toBe(401)
})

test('engagement retention runs with the cron secret', async ({ request }) => {
  test.skip(SECRET.length < 32, 'CRON_SECRET not provided to the test process')
  const res = await request.post('/api/cron/engagement-retention', {
    headers: { authorization: `Bearer ${SECRET}` },
  })
  expect(res.status(), await res.text()).toBe(200)
  const body = await res.json()
  expect(body.ok).toBe(true)
  expect(body.job).toBe('engagement-retention')
  expect(body.retentionDays).toBeGreaterThanOrEqual(1)
  expect(body.deleted).toBeGreaterThanOrEqual(0)
  expect(['payload', 'file']).toContain(body.store)
})

test('scheduled publish also honors cron auth', async ({ request }) => {
  const res = await request.post('/api/cron/scheduled-publish')
  expect(res.status()).toBe(401)
})

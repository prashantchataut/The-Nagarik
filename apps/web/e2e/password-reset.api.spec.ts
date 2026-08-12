import { expect, test } from '@playwright/test'
import { RUN_ID, forgedIp, ipHeaders, registerReader } from './helpers'

/**
 * Reader password reset endpoints. The full token round trip is covered by
 * scripts/verify-password-reset.ts (the token only ever exists in the email);
 * these specs pin the HTTP contract: anti-enumeration, token rejection,
 * rate limiting.
 */

test('forgot-password answers identically for unknown emails (no enumeration oracle)', async ({
  request,
}) => {
  const res = await request.post('/api/reader/forgot-password', {
    headers: ipHeaders(),
    data: { email: `definitely-not-a-user-${RUN_ID}@example.com` },
  })
  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body.ok).toBe(true)
  expect(body.status).toBe('sent')
})

test('forgot-password answers identically for existing emails', async ({ request }) => {
  const { email } = await registerReader(request, 'fp')
  const res = await request.post('/api/reader/forgot-password', {
    headers: ipHeaders(),
    data: { email },
  })
  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body.status).toBe('sent')
})

test('forgot-password rejects an invalid email shape', async ({ request }) => {
  const res = await request.post('/api/reader/forgot-password', {
    headers: ipHeaders(),
    data: { email: 'not-an-email' },
  })
  expect(res.status()).toBe(400)
})

test('reset-password rejects a forged token', async ({ request }) => {
  const res = await request.post('/api/reader/reset-password', {
    headers: ipHeaders(),
    data: { token: 'a'.repeat(64), password: `NewPass-${RUN_ID}!` },
  })
  expect(res.status()).toBe(400)
  const body = await res.json()
  expect(body.ok).toBe(false)
  expect(body.reason).toBe('bad-token')
})

test('forgot-password rate limiter fires on the fifth request from one IP', async ({
  request,
}) => {
  const headers = ipHeaders(forgedIp())
  for (let i = 1; i <= 5; i += 1) {
    const res = await request.post('/api/reader/forgot-password', {
      headers,
      data: { email: `probe-${RUN_ID}-${i}@example.com` },
    })
    if (i <= 4) expect(res.status(), `request ${i}`).toBe(200)
    else {
      expect(res.status(), 'fifth request must be limited').toBe(429)
      const body = await res.json()
      expect(body.code).toBe('rate-limit')
    }
  }
})

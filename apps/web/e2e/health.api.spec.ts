import { expect, test } from '@playwright/test'

test.describe('health probe', () => {
  test('reports ok with payload connected', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.service).toBe('web')
    // E2E always runs against a real database - facade would invalidate
    // every auth/moderation assertion that follows.
    expect(body.cmsConfigured).toBe(true)
  })
})

import { expect, test } from '@playwright/test'
import { ipHeaders, loginStaff, registerReader } from './helpers'

/**
 * Reader and journalist/staff accounts are HARD-SEPARATED - this is a
 * product invariant, not an implementation detail. A reader token must
 * never open staff surfaces and vice versa.
 */

test.describe('anonymous', () => {
  test('reader/me returns no session', async ({ request }) => {
    const res = await request.get('/api/reader/me')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.reader).toBeNull()
  })

  test('account hub is login-gated with ?next=', async ({ request }) => {
    const res = await request.get('/ne/account', { maxRedirects: 0 })
    if (res.status() >= 300 && res.status() < 400) {
      const location = res.headers()['location'] ?? ''
      expect(location).toContain('/ne/login')
      expect(location).toContain('next=')
    } else {
      // Next streams layout redirects as 200 + meta refresh; browsers
      // still navigate (covered by the chromium smoke spec).
      expect(res.status()).toBe(200)
      const html = await res.text()
      expect(html).toContain('http-equiv="refresh"')
      expect(html).toContain('login?next=%2Fne%2Faccount')
    }
  })

  test('admin moderation API rejects without a session', async ({ request }) => {
    const res = await request.get('/api/admin/comments')
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.ok).toBe(false)
    expect(body.code).toBe('unauthorized')
  })
})

test.describe('reader session', () => {
  test('register logs the reader in but grants zero staff access', async ({ request }) => {
    const { email } = await registerReader(request, 'sep')

    // Reader session works.
    const me = await request.get('/api/reader/me')
    expect(me.status()).toBe(200)
    const meBody = await me.json()
    expect(meBody.reader?.email).toBe(email)

    // The same cookie jar is NOT a staff session.
    const staffMe = await request.get('/api/staff/me')
    expect(staffMe.status()).toBe(200)
    const staffBody = await staffMe.json()
    expect(staffBody.user).toBeNull()

    // And staff-only APIs refuse it.
    const admin = await request.get('/api/admin/comments')
    expect(admin.status()).toBe(401)
  })

  test('reader login endpoint rejects bad credentials', async ({ request }) => {
    const res = await request.post('/api/reader/login', {
      headers: ipHeaders(),
      data: { email: 'nobody@example.com', password: 'definitely-wrong-1' },
    })
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.code).toBe('unauthorized')
  })
})

test.describe('staff session', () => {
  test('staff login opens moderation but is not a reader session', async ({ request }) => {
    await loginStaff(request)

    const staffMe = await request.get('/api/staff/me')
    expect(staffMe.status()).toBe(200)
    const staffBody = await staffMe.json()
    expect(staffBody.user).not.toBeNull()
    expect(Array.isArray(staffBody.user.roles)).toBe(true)

    const admin = await request.get('/api/admin/comments')
    expect(admin.status()).toBe(200)
    const adminBody = await admin.json()
    expect(adminBody.ok).toBe(true)

    // Separation holds in the other direction too.
    const readerMe = await request.get('/api/reader/me')
    expect(readerMe.status()).toBe(200)
    const readerBody = await readerMe.json()
    expect(readerBody.reader).toBeNull()
  })
})

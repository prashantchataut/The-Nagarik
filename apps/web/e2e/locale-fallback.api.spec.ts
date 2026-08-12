import { expect, test } from '@playwright/test'

/**
 * Locale-switcher resilience: an untranslated story under /en must land on
 * the Nepali original (redirect), never a 404. This was audit item 🟡
 * "locale-switcher 404s on EN-less articles".
 */

test('EN URL of an untranslated article redirects to the Nepali original', async ({
  request,
}) => {
  // Find a published article without a published English version.
  const res = await request.get('/api/articles', {
    params: {
      limit: '20',
      depth: '0',
      'where[status][equals]': 'published',
    },
  })
  expect(res.status()).toBe(200)
  const body = (await res.json()) as {
    docs: Array<{ slug: string; englishStatus?: string; category?: unknown }>
  }
  const untranslated = body.docs.find((d) => d.englishStatus !== 'published')
  test.skip(!untranslated, 'seed data has no untranslated article')

  // Resolve its public NE path via the sitemap-known category from the doc.
  // The article page itself proves the redirect: /en/... -> /ne/...
  const nePage = await request.get(`/ne/samachar/${untranslated!.slug}`, { maxRedirects: 0 })
  // Category may differ per seed; walk categories until the story resolves.
  let categorySlug = 'samachar'
  if (nePage.status() === 404) {
    for (const c of ['rajniti', 'arthatantra', 'samaj', 'prabidhi', 'bichar', 'khelkud', 'manoranjan']) {
      const probe = await request.get(`/ne/${c}/${untranslated!.slug}`, { maxRedirects: 0 })
      if (probe.status() === 200) {
        categorySlug = c
        break
      }
    }
  }

  const enRes = await request.get(`/en/${categorySlug}/${untranslated!.slug}`, {
    maxRedirects: 0,
  })
  expect([200, 302, 307, 308]).toContain(enRes.status())
  if (enRes.status() === 200) {
    // Streamed redirect: meta refresh into the NE path.
    const html = await enRes.text()
    expect(html).toContain(`/ne/${categorySlug}/${untranslated!.slug}`)
    expect(html).not.toContain('This page could not be found')
  } else {
    expect(enRes.headers()['location']).toContain(`/ne/${categorySlug}/${untranslated!.slug}`)
  }
})

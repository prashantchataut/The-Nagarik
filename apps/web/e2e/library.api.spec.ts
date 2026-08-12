import { expect, test, type APIRequestContext } from '@playwright/test'
import { RUN_ID, registerReader } from './helpers'

/**
 * Server-synced reader library: union merge (newest wins), explicit
 * deletions (no resurrection), session-gated.
 */

const T0 = '2026-08-12T06:00:00.000Z'
const T1 = '2026-08-12T07:00:00.000Z'
const T2 = '2026-08-12T08:00:00.000Z'

function bm(storyId: string, savedAt: string, title = `Story ${storyId}`) {
  return { storyId, title, categorySlug: 'samachar', slug: `slug-${storyId}`, savedAt }
}

test('anonymous library access is rejected', async ({ request }) => {
  const get = await request.get('/api/reader/library')
  expect(get.status()).toBe(401)
  const put = await request.put('/api/reader/library', { data: { saved: [], history: [] } })
  expect(put.status()).toBe(401)
})

test.describe.serial('logged-in library sync', () => {
  // One shared context = one session cookie jar across the serial steps
  // (the per-test `request` fixture starts empty every time).
  let ctx: APIRequestContext

  test.beforeAll(async ({ playwright, baseURL }) => {
    ctx = await playwright.request.newContext({
      baseURL: baseURL ?? undefined,
      extraHTTPHeaders: { 'sec-fetch-site': 'same-origin' },
    })
    await registerReader(ctx, 'lib')
  })

  test.afterAll(async () => {
    await ctx.dispose()
  })

  test('multi-device merge: union by storyId, newest timestamp wins', async () => {

    // Fresh account: empty library.
    const initial = await ctx.get('/api/reader/library')
    expect(initial.status()).toBe(200)
    const initialBody = await initial.json()
    expect(initialBody.saved).toEqual([])
    expect(initialBody.history).toEqual([])

    // Device A pushes two bookmarks + one history row.
    const a = await ctx.put('/api/reader/library', {
      data: {
        saved: [bm(`s1-${RUN_ID}`, T1), bm(`s2-${RUN_ID}`, T0)],
        history: [
          {
            storyId: `h1-${RUN_ID}`,
            progress: 0.4,
            updatedAt: T1,
            categorySlug: 'samachar',
            slug: `slug-h1`,
            title: 'History one',
          },
        ],
      },
    })
    expect(a.status(), await a.text()).toBe(200)
    const aBody = await a.json()
    expect(aBody.saved).toHaveLength(2)

    // Device B: one brand-new bookmark + a NEWER copy of s2.
    const b = await ctx.put('/api/reader/library', {
      data: {
        saved: [bm(`s3-${RUN_ID}`, T1), bm(`s2-${RUN_ID}`, T2, 'Updated title')],
        history: [],
      },
    })
    expect(b.status()).toBe(200)
    const bBody = await b.json()
    expect(bBody.saved).toHaveLength(3)
    const s2 = (bBody.saved as Array<{ storyId: string; title: string; savedAt: string }>).find(
      (x) => x.storyId === `s2-${RUN_ID}`,
    )
    expect(s2?.savedAt).toBe(T2)
    expect(s2?.title).toBe('Updated title')
    // Newest first.
    expect((bBody.saved as Array<{ storyId: string }>)[0].storyId).toBe(`s2-${RUN_ID}`)
    // History from device A survived device B's empty push (union, not overwrite).
    expect(bBody.history).toHaveLength(1)
  })

  test('explicit deletion does not resurrect on the next sync', async () => {
    const del = await ctx.delete('/api/reader/library', {
      data: { scope: 'saved', storyIds: [`s2-${RUN_ID}`] },
    })
    expect(del.status()).toBe(200)
    const delBody = await del.json()
    expect(delBody.saved).toHaveLength(2)

    // STRONG property (tombstones): a stale device that still has s2
    // locally pushes it back - it must stay deleted, because its savedAt
    // predates the deletion.
    const resync = await ctx.put('/api/reader/library', {
      data: {
        saved: [bm(`s1-${RUN_ID}`, T1), bm(`s2-${RUN_ID}`, T2, 'Stale copy')],
        history: [],
      },
    })
    const resyncBody = await resync.json()
    const ids = (resyncBody.saved as Array<{ storyId: string }>).map((x) => x.storyId)
    expect(ids).not.toContain(`s2-${RUN_ID}`)

    // But a genuine RE-SAVE (newer than the deletion) wins the tombstone.
    const futureSave = new Date(Date.now() + 1000).toISOString()
    const resave = await ctx.put('/api/reader/library', {
      data: { saved: [bm(`s2-${RUN_ID}`, futureSave, 'Saved again')], history: [] },
    })
    const resaveBody = await resave.json()
    const resaveIds = (resaveBody.saved as Array<{ storyId: string }>).map((x) => x.storyId)
    expect(resaveIds).toContain(`s2-${RUN_ID}`)
  })

  test('scope clear empties the list', async () => {
    const del = await ctx.delete('/api/reader/library', { data: { scope: 'all' } })
    expect(del.status()).toBe(200)
    const get = await ctx.get('/api/reader/library')
    const body = await get.json()
    expect(body.saved).toEqual([])
    expect(body.history).toEqual([])
  })
})

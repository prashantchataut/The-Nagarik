import { expect, test } from '@playwright/test'
import { RUN_ID, firstPublishedArticleId, ipHeaders, loginStaff } from './helpers'

/**
 * Full comment loop: public submit -> pending (invisible) -> editor approve
 * -> publicly visible. Also proves the per-IP rate limiter actually fires.
 */

test.describe.serial('comment moderation loop', () => {
  let articleId: string
  let commentBody: string

  test('a submitted comment stays invisible until approved', async ({ request }) => {
    articleId = await firstPublishedArticleId(request)
    commentBody = `परीक्षण टिप्पणी ${RUN_ID}: यो सामग्री स्वीकृतिपछि मात्र देखिनुपर्छ।`

    const post = await request.post('/api/comments', {
      headers: ipHeaders(),
      data: {
        articleId,
        name: 'E2E Tester',
        body: commentBody,
        locale: 'ne',
        consent: true,
      },
    })
    expect(post.status(), await post.text()).toBe(201)
    const posted = await post.json()
    expect(posted.ok).toBe(true)
    // 201 = actually persisted; the silent-drop paths (spam/dup) return 200.
    expect(posted.status).toBe('pending')
    expect(posted.id).toBeTruthy()

    const publicList = await request.get(`/api/comments?articleId=${articleId}`)
    expect(publicList.status()).toBe(200)
    const listBody = await publicList.json()
    const bodies = (listBody.comments as Array<{ body: string }>).map((c) => c.body)
    expect(bodies).not.toContain(commentBody)
  })

  test('an editor approves it from the prioritized queue', async ({ request }) => {
    await loginStaff(request)

    const queue = await request.get('/api/admin/comments')
    expect(queue.status()).toBe(200)
    const queueBody = await queue.json()
    const mine = (queueBody.comments as Array<{ id: string; body: string }>).find(
      (c) => c.body === commentBody,
    )
    expect(mine, 'submitted comment must be in the moderation queue').toBeTruthy()

    const action = await request.post('/api/admin/comments', {
      data: { id: mine!.id, action: 'approve' },
    })
    expect(action.status(), await action.text()).toBe(200)
  })

  test('the approved comment is now public', async ({ request }) => {
    const publicList = await request.get(`/api/comments?articleId=${articleId}`)
    expect(publicList.status()).toBe(200)
    const listBody = await publicList.json()
    const bodies = (listBody.comments as Array<{ body: string }>).map((c) => c.body)
    expect(bodies).toContain(commentBody)
  })
})

test('comment rate limiter fires on the fifth submit from one IP', async ({ request }) => {
  const articleId = await firstPublishedArticleId(request)
  const headers = ipHeaders()
  let limited = false
  for (let i = 1; i <= 5; i += 1) {
    const res = await request.post('/api/comments', {
      headers,
      data: {
        articleId,
        name: 'Rate Limit Probe',
        body: `दर सीमा जाँच ${RUN_ID} क्रम ${i}: फरक फरक पाठ राखिएको छ।`,
        locale: 'ne',
        consent: true,
      },
    })
    if (i <= 4) {
      // 201 = persisted, 200 = silently dropped (near-dup filter may kick
      // in on similar probe texts) - either way the limiter counted it.
      expect([200, 201], `submit ${i} should pass the limiter`).toContain(res.status())
    } else {
      expect(res.status(), 'fifth submit must be limited').toBe(429)
      const body = await res.json()
      expect(body.code).toBe('rate-limit')
      expect(body.retryAfterSec).toBeGreaterThan(0)
      limited = true
    }
  }
  expect(limited).toBe(true)
})

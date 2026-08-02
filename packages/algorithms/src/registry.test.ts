import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CAPABILITIES, runDesk } from './registry'
import { weightedScore } from './ranking'
import { detectTrending } from './trending'
import { moderateComment } from './moderation'
import { recommendForReader } from './recommend'

test('registry has full newsroom breadth', () => {
  assert.ok(CAPABILITIES.length >= 232)
  const production = CAPABILITIES.filter((c) => c.status === 'production')
  assert.ok(production.length >= 20)
  assert.ok(CAPABILITIES.every((c) => c.status !== ('live' as never)))
})

test('desk never marks planned as production health', () => {
  const desk = runDesk({
    algorithmsEnabled: true,
    killSwitches: {},
    engagementSampleN: 0,
    lastEventAgeSec: null,
    articleCount: 5,
    searchQueryN: 0,
  })
  assert.equal(desk.total, CAPABILITIES.length)
  assert.ok(desk.byStatus.planned > 0)
  assert.ok(desk.production.every((r) => r.status === 'production'))
})

test('weighted score respects do-not-recommend', () => {
  const s = weightedScore({ id: '1' }, { doNotRecommend: true })
  assert.equal(s, Number.NEGATIVE_INFINITY)
})

test('trending falls back honestly when cold', () => {
  const r = detectTrending(
    [
      { id: 'a', publishedAt: new Date().toISOString() },
      { id: 'b', publishedAt: new Date(Date.now() - 3600_000).toISOString() },
    ],
    [],
  )
  assert.equal(r.live, false)
  assert.equal(r.reason, 'fallback-recency')
})

test('moderation never suggests publish', () => {
  const v = moderateComment({ text: 'hello world' })
  assert.notEqual(v.suggested as string, 'publish')
})

test('recommend labels cold-start', () => {
  const r = recommendForReader([{ id: '1', publishedAt: new Date().toISOString() }], {
    readerId: 'x',
    recentCategoryIds: [],
    recentStoryIds: [],
  })
  assert.equal(r.strategy, 'cold-start')
})

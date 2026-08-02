import assert from 'node:assert/strict'
import { test } from 'node:test'
import { assertPublishable, publicEnglishAllowed } from './publish-gates'

test('publish gates require authors and media credit', () => {
  const errors = assertPublishable({
    status: 'published',
    englishStatus: 'none',
    authorIds: [],
    hero: { alt: '', credit: '' },
  })
  assert.ok(errors.some((e) => e.includes('author')))
  assert.ok(errors.some((e) => e.includes('alt')))
  assert.ok(errors.some((e) => e.includes('credit')))
})

test('public English only when published', () => {
  assert.equal(publicEnglishAllowed('published'), true)
  assert.equal(publicEnglishAllowed('draft'), false)
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { articleHasEnglish, isEnglishPublished } from './english'

test('english gate: only published status counts', () => {
  assert.equal(isEnglishPublished('published'), true)
  assert.equal(isEnglishPublished('draft'), false)
  assert.equal(isEnglishPublished('in_review'), false)
  assert.equal(isEnglishPublished('none'), false)
  assert.equal(articleHasEnglish({ englishStatus: 'draft' }), false)
})

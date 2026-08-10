import assert from 'node:assert/strict'
import test from 'node:test'
import { continueReading } from './continue-reading'

test('continueReading returns unfinished recent entries only', () => {
  const result = continueReading({
    entries: [
      {
        storyId: 'a',
        progress: 0.4,
        updatedAt: '2026-08-03T10:00:00.000Z',
      },
      {
        storyId: 'b',
        progress: 0.02,
        updatedAt: '2026-08-03T11:00:00.000Z',
      },
      {
        storyId: 'c',
        progress: 0.95,
        updatedAt: '2026-08-03T12:00:00.000Z',
      },
      {
        storyId: 'gone',
        progress: 0.5,
        updatedAt: '2026-08-03T13:00:00.000Z',
      },
    ],
    availableIds: ['a', 'b', 'c'],
    limit: 4,
  })

  assert.equal(result.live, true)
  assert.deepEqual(
    result.items.map((i) => i.storyId),
    ['a'],
  )
})

test('continueReading is empty without progress', () => {
  const result = continueReading({ entries: [], availableIds: ['a'] })
  assert.equal(result.live, false)
  assert.equal(result.items.length, 0)
})

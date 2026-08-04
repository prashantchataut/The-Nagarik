import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { adToBs, bsToAd, daysInBsMonth, formatBs } from '../lib/bs-calendar'
import {
  approximateTithi,
  festivalsForBsDay,
  festivalsInBsMonth,
  FESTIVALS,
} from '../lib/panchang'
import { convertPreetiToUnicode } from '../lib/preeti'

describe('bs-calendar', () => {
  it('converts a known AD date into BS range', () => {
    const bs = adToBs({ year: 2026, month: 8, day: 4 })
    assert.equal(bs.year, 2083)
    assert.ok(bs.month >= 1 && bs.month <= 12)
    assert.ok(bs.day >= 1 && bs.day <= daysInBsMonth(bs.year, bs.month))
    assert.ok(formatBs(bs, 'ne').includes(String(bs.year)))
  })

  it('round-trips BS to AD for mid-year dates', () => {
    const original = { year: 2080, month: 5, day: 15 }
    const ad = bsToAd(original)
    const back = adToBs(ad)
    assert.deepEqual(back, original)
  })
})

describe('preeti', () => {
  it('maps basic consonants', () => {
    const out = convertPreetiToUnicode('g]kfn')
    assert.ok(out.length > 0)
  })

  it('prefers multi-char tokens', () => {
    const out = convertPreetiToUnicode('k|f')
    assert.equal(out, 'क्ष')
  })
})

describe('panchang', () => {
  it('returns tithi in 1-30 with paksha labels', () => {
    const t = approximateTithi({ year: 2026, month: 8, day: 4 })
    assert.ok(t.index >= 1 && t.index <= 30)
    assert.ok(t.number >= 1 && t.number <= 15)
    assert.ok(t.paksha === 'shukla' || t.paksha === 'krishna')
    assert.ok(t.nameNe.length > 0)
  })

  it('lists Nepali New Year on BS 1/1', () => {
    const hits = festivalsForBsDay({ year: 2083, month: 1, day: 1 })
    assert.ok(hits.some((f) => f.id === 'naya-barsha'))
  })

  it('ships a non-trivial festival table', () => {
    assert.ok(FESTIVALS.length >= 25)
    const ashwin = festivalsInBsMonth(2083, 6)
    assert.ok(ashwin.some((f) => f.id === 'vijaya-dashami'))
  })
})

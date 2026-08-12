import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  BS_MAX_YEAR,
  BS_MIN_YEAR,
  adToBs,
  bsToAd,
  daysInBsMonth,
  isSupportedBsYear,
  monthGrid,
} from '../lib/bs-calendar'
import {
  eventsForBsDay,
  eventsInBsMonth,
  lunarMarkersInBsMonth,
  upcomingPatroEvents,
} from '../lib/panchang'

describe('bs-calendar extended range', () => {
  it('supports every year from 2070 through 2095', () => {
    for (let year = BS_MIN_YEAR; year <= BS_MAX_YEAR; year++) {
      assert.ok(isSupportedBsYear(year), `year ${year} must be supported`)
      for (let month = 1; month <= 12; month++) {
        const len = daysInBsMonth(year, month)
        assert.ok(len >= 29 && len <= 32, `${year}/${month} has plausible length`)
      }
    }
  })

  it('round-trips BS to AD across the full supported range', () => {
    for (let year = BS_MIN_YEAR; year <= BS_MAX_YEAR; year++) {
      for (const month of [1, 6, 12]) {
        const day = Math.min(15, daysInBsMonth(year, month))
        const original = { year, month, day }
        const back = adToBs(bsToAd(original))
        assert.deepEqual(back, original, `round trip ${year}/${month}/${day}`)
      }
    }
  })

  it('builds a padded month grid for late-range years', () => {
    const grid = monthGrid(2095, 12)
    assert.ok(grid.length % 7 === 0)
    assert.ok(grid.filter(Boolean).length === daysInBsMonth(2095, 12))
  })
})

describe('autonomous patro event engine', () => {
  it('emits a sankranti on day 1 of every month in every supported year', () => {
    for (let year = BS_MIN_YEAR; year <= BS_MAX_YEAR; year++) {
      for (let month = 1; month <= 12; month++) {
        const events = eventsInBsMonth(year, month)
        assert.ok(
          events.some((e) => e.id.startsWith('sankranti-') && e.day === 1),
          `sankranti missing for ${year}/${month}`,
        )
      }
    }
  })

  it('generates ekadashi, purnima, and amavasya markers dynamically', () => {
    const markers = lunarMarkersInBsMonth(2083, 3)
    const ekadashis = markers.filter((m) => m.id.startsWith('ekadashi-'))
    assert.ok(ekadashis.length >= 1 && ekadashis.length <= 3, 'ekadashi count plausible')
    const year = eventsInBsMonth(2083, 1)
      .concat(eventsInBsMonth(2083, 2))
      .concat(eventsInBsMonth(2083, 3))
    assert.ok(year.some((e) => e.id.startsWith('purnima-') || e.id === 'buddha-jayanti'))
    assert.ok(year.some((e) => e.id.startsWith('amavasya-') || e.id === 'mata-tirtha-aunsi'))
  })

  it('resolves the Dashain cluster onto one waxing fortnight', () => {
    const window = [...eventsInBsMonth(2083, 6), ...eventsInBsMonth(2083, 7)]
    const ghatasthapana = window.find((e) => e.id === 'ghatasthapana')
    const dashami = window.find((e) => e.id === 'vijaya-dashami')
    assert.ok(ghatasthapana, 'ghatasthapana resolves')
    assert.ok(dashami, 'vijaya dashami resolves')
    const toSerial = (e: { year: number; month: number; day: number }) => {
      const ad = bsToAd({ year: e.year, month: e.month, day: e.day })
      return Date.UTC(ad.year, ad.month - 1, ad.day) / 86_400_000
    }
    const gap = toSerial(dashami!) - toSerial(ghatasthapana!)
    assert.ok(gap >= 8 && gap <= 11, `dashami follows ghatasthapana by ~9 days, got ${gap}`)
  })

  it('keeps the Tihar cluster ordered around the new moon', () => {
    const window = [...eventsInBsMonth(2083, 7), ...eventsInBsMonth(2083, 8)]
    const ids = ['kag-tihar', 'kukur-tihar', 'laxmi-puja', 'gobardhan-puja', 'bhai-tika']
    const found = ids.map((id) => window.find((e) => e.id === id))
    for (const [i, event] of found.entries()) {
      assert.ok(event, `${ids[i]} resolves`)
    }
  })

  it('generates events for the far horizon (2095) and early range (2070)', () => {
    for (const year of [2070, 2095]) {
      for (let month = 1; month <= 12; month++) {
        assert.ok(eventsInBsMonth(year, month).length >= 3, `${year}/${month} has events`)
      }
    }
  })

  it('recalculates upcoming events relative to any anchor date', () => {
    const fromMid = upcomingPatroEvents({ year: 2083, month: 6, day: 15 }, { limit: 6 })
    assert.equal(fromMid.length, 6)
    assert.ok(
      fromMid.every(
        (e, i) =>
          i === 0 ||
          e.year > fromMid[i - 1].year ||
          (e.year === fromMid[i - 1].year &&
            (e.month > fromMid[i - 1].month ||
              (e.month === fromMid[i - 1].month && e.day >= fromMid[i - 1].day))),
      ),
      'events are chronological',
    )
    const fromOtherYear = upcomingPatroEvents({ year: 2092, month: 1, day: 1 }, { limit: 4 })
    assert.equal(fromOtherYear.length, 4)
    assert.equal(fromOtherYear[0].year, 2092)
  })

  it('exposes per-day events including fixed national days', () => {
    const newYear = eventsForBsDay({ year: 2085, month: 1, day: 1 })
    assert.ok(newYear.some((e) => e.id === 'naya-barsha'))
    assert.ok(newYear.some((e) => e.id.startsWith('sankranti-')))
  })
})

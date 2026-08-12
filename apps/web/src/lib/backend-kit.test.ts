import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createRateLimiter } from './api/rate-limit'
import { assertLaunchReady, defineSite } from './site-schema'

function makeValidSite() {
  return {
    id: 'testportal',
    domain: 'testportal.com',
    brand: {
      ne: 'परीक्षण',
      en: 'Test Portal',
      taglineNe: 'परीक्षण समाचार',
      taglineEn: 'Test news',
    },
    theme: { accent: '#0b6b63', background: '#e8ecf1' },
    layout: {},
    editorial: {
      categories: [
        { slug: 'samachar', ne: 'समाचार', en: 'News' },
        { slug: 'arth', ne: 'अर्थ', en: 'Economy' },
        { slug: 'khel', ne: 'खेलकुद', en: 'Sports' },
      ],
    },
  }
}

describe('site-schema', () => {
  it('accepts a minimal valid config and applies defaults', () => {
    const site = defineSite(makeValidSite())
    assert.equal(site.id, 'testportal')
    assert.equal(site.theme.preset, 'valley-mist')
    assert.equal(site.layout.header, 'two-tier')
    assert.equal(site.editorial.defaultLocale, 'ne')
    assert.deepEqual(site.editorial.locales, ['ne', 'en'])
  })

  it('rejects malformed ids, accents, and short category lists', () => {
    assert.throws(() => defineSite({ ...makeValidSite(), id: 'Bad ID!' }))
    assert.throws(() =>
      defineSite({
        ...makeValidSite(),
        theme: { accent: 'teal', background: '#ffffff' },
      }),
    )
    assert.throws(() =>
      defineSite({
        ...makeValidSite(),
        editorial: { categories: [{ slug: 'one', ne: 'एक', en: 'One' }] },
      }),
    )
  })

  it('rejects duplicate category slugs', () => {
    const bad = makeValidSite()
    const cats = [...bad.editorial.categories, { slug: 'samachar', ne: 'दोहोरो', en: 'Dupe' }]
    assert.throws(
      () => defineSite({ ...bad, editorial: { categories: cats } }),
      /duplicate category slug/,
    )
  })

  it('rejects a defaultLocale outside editorial.locales', () => {
    assert.throws(
      () =>
        defineSite({
          ...makeValidSite(),
          editorial: {
            locales: ['ne'],
            defaultLocale: 'en',
            categories: makeValidSite().editorial.categories,
          },
        }),
      /defaultLocale/,
    )
  })

  it('gates live launches on legal identity', () => {
    const site = defineSite(makeValidSite())
    assert.doesNotThrow(() => assertLaunchReady(site, 'dev'))
    assert.throws(() => assertLaunchReady(site, 'live'), /legal identity/)
    const ready = defineSite({
      ...makeValidSite(),
      legal: {
        publisherName: 'Test Media Pvt. Ltd.',
        registrationNo: 'DOI-123',
        editorName: 'Editor Name',
      },
    })
    assert.doesNotThrow(() => assertLaunchReady(ready, 'live'))
  })
})

describe('rate limiter', () => {
  it('allows up to max hits then blocks with retryAfter', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 3 })
    assert.equal(limiter.check('ip-a').limited, false)
    assert.equal(limiter.check('ip-a').limited, false)
    const third = limiter.check('ip-a')
    assert.equal(third.limited, false)
    assert.equal(third.remaining, 0)
    const fourth = limiter.check('ip-a')
    assert.equal(fourth.limited, true)
    assert.ok(fourth.retryAfterSec >= 1 && fourth.retryAfterSec <= 60)
  })

  it('tracks keys independently and supports reset', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 })
    assert.equal(limiter.check('a').limited, false)
    assert.equal(limiter.check('b').limited, false)
    assert.equal(limiter.check('a').limited, true)
    limiter.reset('a')
    assert.equal(limiter.check('a').limited, false)
    limiter.reset()
    assert.equal(limiter.check('b').limited, false)
  })

  it('expires hits outside the window', async () => {
    const limiter = createRateLimiter({ windowMs: 50, max: 1 })
    assert.equal(limiter.check('x').limited, false)
    assert.equal(limiter.check('x').limited, true)
    await new Promise((resolve) => setTimeout(resolve, 60))
    assert.equal(limiter.check('x').limited, false)
  })

  it('bounds tracked keys', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1, maxKeys: 2 })
    limiter.check('k1')
    limiter.check('k2')
    limiter.check('k3') // evicts k1
    assert.equal(limiter.check('k1').limited, false, 'evicted key starts fresh')
  })
})

/**
 * Seed taxonomy, demo staff users, and the full The Nagarik newsroom
 * (30 real bilingual stories with original editorial imagery) via the
 * Payload Local API.
 *
 * Prerequisites: DATABASE_URL + PAYLOAD_SECRET (≥32).
 * Run:
 *
 *   pnpm --filter @thenagarik/web seed
 *
 * Demo passwords are for local/pitch only — rotate before production.
 * Articles/authors/tags/media come from @thenagarik/content fixtures,
 * so facade mode and Payload mode serve the identical newsroom.
 */
import { existsSync } from 'node:fs'
import { getPayload } from 'payload'
import config from '../payload/payload.config'
import { SITE } from '../site.config'
import {
  fixtureArticles,
  fixtureAuthors,
  DEV_FIXTURE_MARK,
} from '@thenagarik/content'

const DEMO_PASSWORD = 'NagarikPitch2026!'

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 96)

/** Categories come from site.config: one factory, many portals. */
const categoriesSeed = SITE.editorial.categories.map((category) => ({
  slug: category.slug,
  nameNe: category.ne,
  nameEn: category.en,
}))

const demoUsers = [
  { email: 'admin@nagarik.local', name: 'Admin Desk', roles: ['admin'] as const },
  { email: 'publisher@nagarik.local', name: 'Publisher', roles: ['publisher'] as const },
  { email: 'editor@nagarik.local', name: 'Editor', roles: ['editor'] as const },
  { email: 'journalist@nagarik.local', name: 'Journalist', roles: ['journalist'] as const },
]

async function main() {
  const secret = process.env.PAYLOAD_SECRET?.trim()
  if (!secret || secret.length < 32) {
    throw new Error('PAYLOAD_SECRET (≥32) required')
  }
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      'DATABASE_URL required. Start local Postgres (`docker compose up -d`) or set a Neon pooled URL.',
    )
  }

  const payload = await getPayload({ config })
  const usingDevFixtures = DEV_FIXTURE_MARK === 'DEV_ONLY' && process.env.LAUNCH_STATUS !== 'live'
  if (!usingDevFixtures) {
    console.log('Skipping newsroom seed (live launch).')
  }

  const launchStatus = process.env.LAUNCH_STATUS ?? 'dev'
  if (launchStatus === 'live') {
    console.warn('LAUNCH_STATUS=live: skipping demo staff users (create real accounts in /cms).')
  }
  for (const user of launchStatus === 'live' ? [] : demoUsers) {
    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: user.email } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.totalDocs > 0) {
      console.log(`User exists: ${user.email}`)
      continue
    }
    await payload.create({
      collection: 'users',
      data: { email: user.email, password: DEMO_PASSWORD, name: user.name, roles: [...user.roles], isActive: true },
      overrideAccess: true,
    })
    console.log(`Created user: ${user.email} / ${DEMO_PASSWORD}`)
  }

  // Publish gates require an authenticated publisher/admin actor — the seed
  // acts as the demo admin (hooks stay strict; no anonymous publishing).
  const seedActor = (
    await payload.find({
      collection: 'users',
      where: { roles: { contains: 'admin' } },
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0]
  if (!seedActor) {
    console.warn('No admin user found; skipping article seeding.')
    return
  }

  // ---- Categories -------------------------------------------------------
  const existingCats = await payload.find({
    collection: 'categories',
    limit: 100,
    overrideAccess: true,
  })
  const catBySlug = new Map(existingCats.docs.map((c) => [c.slug as string, c]))

  for (const cat of categoriesSeed) {
    if (catBySlug.has(cat.slug)) continue
    const created = await payload.create({
      collection: 'categories',
      data: cat,
      overrideAccess: true,
    })
    catBySlug.set(cat.slug, created)
    console.log(`Category: ${cat.slug}`)
  }

  // ---- Authors ----------------------------------------------------------
  const authorIdByFixtureId = new Map<string, string>()
  for (const author of fixtureAuthors) {
    const existing = (
      await payload.find({
        collection: 'authors',
        where: { slug: { equals: author.slug } },
        limit: 1,
        overrideAccess: true,
      })
    ).docs[0]
    if (existing) {
      authorIdByFixtureId.set(author.id, String(existing.id))
      continue
    }
    const created = await payload.create({
      collection: 'authors',
      data: {
        slug: author.slug,
        nameNe: author.nameNe,
        nameEn: author.nameEn,
        bioNe: author.bioNe,
        bioEn: author.bioEn,
        beats: author.beats?.map((beat) => ({ beat })) ?? [],
      },
      overrideAccess: true,
    })
    authorIdByFixtureId.set(author.id, String(created.id))
    console.log(`Author: ${author.nameNe}`)
  }

  // ---- Tags -------------------------------------------------------------
  const tagIdBySlug = new Map<string, string>()
  for (const article of fixtureArticles) {
    for (const tagName of article.tagSlugs) {
      const slug = toSlug(tagName)
      if (!slug || tagIdBySlug.has(slug)) continue
      const existing = (
        await payload.find({ collection: 'tags', where: { slug: { equals: slug } }, limit: 1, overrideAccess: true })
      ).docs[0]
      if (existing) {
        tagIdBySlug.set(slug, String(existing.id))
        continue
      }
      const created = await payload.create({
        collection: 'tags',
        data: { slug, nameNe: tagName, nameEn: tagName },
        overrideAccess: true,
      })
      tagIdBySlug.set(slug, String(created.id))
    }
  }
  console.log(`Tags ready: ${tagIdBySlug.size}`)

  // ---- Media (hero artwork from the photo desk) --------------------------
  // Media is uploaded only when the file exists on disk; articles missing
  // artwork still seed and render without a hero.
  const mediaIdBySlug = new Map<string, string>()
  if (usingDevFixtures) {
    for (const article of fixtureArticles) {
      if (!article.hero) continue
      const fileName = article.hero.url.split('/').pop() ?? ''
      const filePath = `public${article.hero.url}`
      if (!fileName || !existsSync(filePath)) continue
      const existing = (
        await payload.find({ collection: 'media', where: { filename: { equals: fileName } }, limit: 1, overrideAccess: true })
      ).docs[0]
      if (existing) {
        mediaIdBySlug.set(article.slug, String(existing.id))
        continue
      }
      const created = await payload.create({
        collection: 'media',
        data: { alt: article.hero.alt, credit: article.hero.credit },
        filePath,
        overrideAccess: true,
      })
      mediaIdBySlug.set(article.slug, String(created.id))
    }
    console.log(`Media uploaded: ${mediaIdBySlug.size}`)
  }

  // ---- Articles -----------------------------------------------------------
  if (!usingDevFixtures) {
    console.log('Seed complete (no articles in live mode).')
    process.exit(0)
  }

  async function ensureArticle(data: Record<string, unknown>) {
    const slug = String(data.slug)
    const found = await payload.find({
      collection: 'articles',
      where: { slug: { equals: slug } },
      limit: 1,
      overrideAccess: true,
      draft: true,
    })
    const payloadData = {
      ...data,
      // Payload drafts field — required for public reads that filter `_status=published`.
      _status: 'published',
    }
    if (found.totalDocs > 0) {
      await payload.update({
        collection: 'articles',
        id: found.docs[0].id,
        data: payloadData as never,
        draft: false,
        overrideAccess: true,
        user: seedActor,
      })
      return 'updated'
    }
    await payload.create({
      collection: 'articles',
      data: payloadData as never,
      draft: false,
      overrideAccess: true,
      user: seedActor,
    })
    return 'created'
  }

  let seeded = 0
  let failed = 0
  for (const article of fixtureArticles) {
    // Fixture categoryId is 'cat-<slug>' by construction in fixtures.ts
    const catSlug = article.categoryId.startsWith('cat-')
      ? article.categoryId.slice(4)
      : article.categoryId
    const category = catBySlug.get(catSlug)
    if (!category) continue

    try {
      const result = await ensureArticle({
        titleNe: article.titleNe,
        titleEn: article.titleEn,
        slug: article.slug,
        deckNe: article.deckNe,
        deckEn: article.deckEn,
        status: 'published',
        englishStatus: article.englishStatus,
        category: category.id,
        authors: article.authorIds
          .map((id) => authorIdByFixtureId.get(id))
          .filter(Boolean),
        tags: article.tagSlugs.map((t) => tagIdBySlug.get(toSlug(t))).filter(Boolean),
        province: article.province,
        hero: mediaIdBySlug.get(article.slug),
        isBreaking: article.isBreaking,
        editorialPriority: article.editorialPriority,
        attribution: 'original',
        corrections: article.corrections.map((c) => ({ at: c.at, noteNe: c.noteNe, noteEn: c.noteEn })),
        publishedAt: article.publishedAt,
        updatedAt: article.updatedAt ?? article.publishedAt,
        packageId: article.packageId || undefined,
        bodyNe: article.bodyNe,
        bodyEn: article.bodyEn,
        seoTitleNe: article.seoTitleNe,
        seoTitleEn: article.seoTitleEn,
        seoDescriptionNe: article.seoDescriptionNe,
        seoDescriptionEn: article.seoDescriptionEn,
      })
      seeded += 1
      if (seeded % 10 === 0 || result === 'created') {
        console.log(`Article ${result}: ${article.slug}`)
      }
    } catch (error) {
      failed += 1
      console.error(`Article failed: ${article.slug}`, (error as Error).message)
    }
  }

  console.log(`\nSeed complete: ${seeded} articles (${failed} failed).`)
  console.log('Pitch logins (local only): *@nagarik.local /', DEMO_PASSWORD)
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

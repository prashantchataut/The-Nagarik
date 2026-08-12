/**
 * Seed taxonomy, demo staff users, and sample articles via Payload Local API.
 *
 * Prerequisites: DATABASE_URL + PAYLOAD_SECRET (≥32).
 * Prefer creating the first admin in /cms, then run:
 *
 *   pnpm --filter @thenagarik/web seed
 *
 * Demo passwords are for local/pitch only — rotate before production.
 */
import { getPayload } from 'payload'
import config from '../payload/payload.config'
import { SITE } from '../site.config'

const DEMO_PASSWORD = 'NagarikPitch2026!'

/** Categories come from site.config: one factory, many portals. */
const categoriesSeed = SITE.editorial.categories.map((category) => ({
  slug: category.slug,
  nameNe: category.ne,
  nameEn: category.en,
}))

const demoUsers = [
  {
    email: 'admin@nagarik.local',
    name: 'Admin Desk',
    roles: ['admin'] as const,
  },
  {
    email: 'publisher@nagarik.local',
    name: 'Publisher',
    roles: ['publisher'] as const,
  },
  {
    email: 'editor@nagarik.local',
    name: 'Editor',
    roles: ['editor'] as const,
  },
  {
    email: 'journalist@nagarik.local',
    name: 'Journalist',
    roles: ['journalist'] as const,
  },
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
      data: {
        email: user.email,
        password: DEMO_PASSWORD,
        name: user.name,
        roles: [...user.roles],
        isActive: true,
      },
      overrideAccess: true,
    })
    console.log(`Created user: ${user.email} / ${DEMO_PASSWORD}`)
  }

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

  let author = (
    await payload.find({
      collection: 'authors',
      where: { slug: { equals: 'nagarik-desk' } },
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0]

  if (!author) {
    author = await payload.create({
      collection: 'authors',
      data: {
        slug: 'nagarik-desk',
        nameNe: 'नागरिक डेस्क',
        nameEn: 'Nagarik Desk',
        bioNe: 'द नागरिकको सम्पादकीय डेस्क।',
        bioEn: 'Editorial desk of The Nagarik.',
      },
      overrideAccess: true,
    })
  }

  const newsCat = catBySlug.get('samachar')
  const politicsCat = catBySlug.get('rajniti')
  const opinionCat = catBySlug.get('bichar')
  if (!newsCat || !politicsCat || !opinionCat) {
    throw new Error('Required categories missing after seed.')
  }

  // Publish gates require an authenticated publisher/admin actor - the seed
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
    console.warn('No admin user found; skipping demo article seeding.')
    return
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
      console.log(`Article updated: ${slug}`)
      return
    }
    await payload.create({
      collection: 'articles',
      data: payloadData as never,
      draft: false,
      overrideAccess: true,
      user: seedActor,
    })
    console.log(`Article created: ${slug}`)
  }

  const now = new Date().toISOString()
  const packageId = 'federal-week-1'

  await ensureArticle({
    titleNe: 'द नागरिक सुरु',
    titleEn: 'The Nagarik launches',
    slug: 'nagarik-launch',
    deckNe: 'नेपाली-प्रथम द्विभाषी समाचार कक्षको सुरुवात।',
    deckEn: 'A Nepali-first bilingual newsroom begins.',
    status: 'published',
    englishStatus: 'published',
    category: newsCat.id,
    authors: [author.id],
    attribution: 'original',
    editorialPriority: 8,
    publishedAt: now,
    packageId,
    bodyNe: [
      {
        type: 'paragraph',
        text: 'द नागरिक मौलिक पत्रकारितामा आधारित नेपाली-प्रथम समाचार माध्यम हो।',
      },
      {
        type: 'paragraph',
        text: 'यो बीज लेख CMS कटओभर पुष्टि गर्नका लागि हो।',
      },
    ],
    bodyEn: [
      {
        type: 'paragraph',
        text: 'The Nagarik is a Nepali-first outlet built on original journalism.',
      },
      {
        type: 'paragraph',
        text: 'This seed article verifies the CMS cutover path.',
      },
    ],
  })

  await ensureArticle({
    titleNe: 'संसद्मा आज विशेष बैठक',
    titleEn: 'Special session in parliament today',
    slug: 'sansad-special-session',
    deckNe: 'ब्रेकिङ: संसद् सचिवालयले विशेष बैठक बोलाएको छ।',
    deckEn: 'Breaking: Parliament secretariat calls a special session.',
    status: 'published',
    englishStatus: 'published',
    category: politicsCat.id,
    authors: [author.id],
    attribution: 'original',
    editorialPriority: 9,
    isBreaking: true,
    publishedAt: now,
    packageId,
    bodyNe: [
      {
        type: 'paragraph',
        text: 'काठमाडौं — संसद् सचिवालयले आज विशेष बैठक बोलाएको जानकारी दिएको छ।',
      },
      {
        type: 'paragraph',
        text: 'विवरण आउने क्रममा छ। यो बीज ब्रेकिङ कथा हो।',
      },
    ],
    bodyEn: [
      {
        type: 'paragraph',
        text: 'Kathmandu — The parliament secretariat has called a special session today.',
      },
      {
        type: 'paragraph',
        text: 'Details are still emerging. This is a seed breaking story.',
      },
    ],
  })

  await ensureArticle({
    titleNe: 'नागरिक अधिकार र सञ्चार स्वतन्त्रता',
    slug: 'nagarik-rights-opinion',
    deckNe: 'विचार: लोकतन्त्रमा सूचनाको अधिकार किन आधारभूत हो।',
    status: 'published',
    englishStatus: 'none',
    category: opinionCat.id,
    authors: [author.id],
    attribution: 'original',
    editorialPriority: 6,
    publishedAt: now,
    bodyNe: [
      {
        type: 'paragraph',
        text: 'सूचना बिना नागरिक निगरानी सम्भव हुँदैन। पत्रकारिता त्यसैको औजार हो।',
      },
      {
        type: 'paragraph',
        text: 'अंग्रेजी संस्करण यस लेखमा अहिले सार्वजनिक गरिएको छैन — गेट परीक्षणका लागि।',
      },
    ],
  })

  console.log('Seed complete.')
  console.log('Pitch logins (local only): *@nagarik.local /', DEMO_PASSWORD)
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

/**
 * Seed taxonomy + one sample article via Payload Local API.
 * Requires DATABASE_URL + PAYLOAD_SECRET. Run after first /cms admin user exists:
 *
 *   pnpm --filter @thenagarik/web seed
 */
import { getPayload } from 'payload'
import config from '../payload/payload.config'

async function main() {
  const secret = process.env.PAYLOAD_SECRET?.trim()
  if (!secret || secret.length < 32) {
    throw new Error('PAYLOAD_SECRET (≥32) required')
  }
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error('DATABASE_URL required')
  }

  const payload = await getPayload({ config })

  const existingCats = await payload.find({ collection: 'categories', limit: 1, overrideAccess: true })
  if (existingCats.totalDocs > 0) {
    console.log('Seed skipped: categories already present.')
    process.exit(0)
  }

  const categories = [
    { slug: 'samachar', nameNe: 'समाचार', nameEn: 'News' },
    { slug: 'rajneeti', nameNe: 'राजनीति', nameEn: 'Politics' },
    { slug: 'arthatantra', nameNe: 'अर्थतन्त्र', nameEn: 'Economy' },
    { slug: 'pradesh', nameNe: 'प्रदेश', nameEn: 'Provinces' },
    { slug: 'vichar', nameNe: 'विचार', nameEn: 'Opinion' },
  ]

  const createdCategories = []
  for (const cat of categories) {
    createdCategories.push(
      await payload.create({
        collection: 'categories',
        data: cat,
        overrideAccess: true,
      }),
    )
  }

  const author = await payload.create({
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

  const category = createdCategories[0]
  await payload.create({
    collection: 'articles',
    data: {
      titleNe: 'द नागरिक सुरु',
      titleEn: 'The Nagarik launches',
      slug: 'nagarik-launch',
      deckNe: 'नेपाली-प्रथम द्विभाषी समाचार कक्षको सुरुवात।',
      deckEn: 'A Nepali-first bilingual newsroom begins.',
      status: 'published',
      englishStatus: 'published',
      category: category.id,
      authors: [author.id],
      attribution: 'original',
      editorialPriority: 8,
      publishedAt: new Date().toISOString(),
      bodyNe: [
        {
          type: 'paragraph',
          text: 'द नागरिक मौलिक पत्रकारितामा आधारित नेपाली-प्रथम समाचार माध्यम हो।',
        },
        {
          type: 'paragraph',
          text: 'यो बीज लेख CMS कटओभर पुष्टि गर्नका लागि मात्र हो।',
        },
      ],
      bodyEn: [
        {
          type: 'paragraph',
          text: 'The Nagarik is a Nepali-first outlet built on original journalism.',
        },
        {
          type: 'paragraph',
          text: 'This seed article exists only to verify the CMS cutover path.',
        },
      ],
    },
    draft: false,
    overrideAccess: true,
  })

  console.log('Seed complete: categories, desk author, launch article.')
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

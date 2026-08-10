import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload/payload.config'
import { assertCronAuth } from '@/lib/security'

/**
 * Flip due `scheduled` articles to `published`.
 * Secure with Authorization: Bearer $CRON_SECRET
 */
export async function POST(request: Request) {
  if (!assertCronAuth(request.headers.get('authorization'))) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const hasDb = Boolean(process.env.DATABASE_URL?.trim())
  const hasSecret = Boolean(process.env.PAYLOAD_SECRET && process.env.PAYLOAD_SECRET.length >= 32)
  if (!hasDb || !hasSecret) {
    return NextResponse.json(
      { ok: false, error: 'DATABASE_URL and PAYLOAD_SECRET required' },
      { status: 503 },
    )
  }

  const payload = await getPayload({ config })
  const now = new Date().toISOString()
  const due = await payload.find({
    collection: 'articles',
    where: {
      and: [
        { status: { equals: 'scheduled' } },
        { publishedAt: { less_than_equal: now } },
      ],
    },
    limit: 50,
    overrideAccess: true,
  })

  const published: string[] = []
  for (const doc of due.docs) {
    await payload.update({
      collection: 'articles',
      id: doc.id,
      data: {
        status: 'published',
        publishedAt: doc.publishedAt ?? now,
      },
      overrideAccess: true,
    })
    published.push(String(doc.slug ?? doc.id))
  }

  if (published.length > 0) {
    try {
      revalidatePath('/ne')
      revalidatePath('/en')
      revalidatePath('/ne/latest')
      revalidatePath('/en/latest')
    } catch {
      // Ignore cache revalidation errors during offline tests
    }
  }

  return NextResponse.json({
    ok: true,
    job: 'scheduled-publish',
    at: now,
    scanned: due.docs.length,
    published,
  })
}

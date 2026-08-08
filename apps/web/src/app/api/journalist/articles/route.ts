import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { contributorRoles, hasAnyRole } from '@/payload/access/rbac'
import { payloadDeskAvailable } from '@/lib/admin/payload-desk'
import { ArticleWriteSchema } from '@/lib/journalist/schema'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!payloadDeskAvailable()) {
    return NextResponse.json({ message: 'CMS offline', code: 'CMS_OFFLINE' }, { status: 503 })
  }

  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user || !hasAnyRole(user, contributorRoles)) {
    return NextResponse.json({ message: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid JSON', code: 'BAD_REQUEST' }, { status: 400 })
  }

  const parsed = ArticleWriteSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Validation failed', code: 'VALIDATION' },
      { status: 400 },
    )
  }

  const input = parsed.data
  try {
    const doc = await payload.create({
      collection: 'articles',
      data: {
        titleNe: input.titleNe,
        titleEn: input.titleEn || undefined,
        slug: input.slug,
        deckNe: input.deckNe,
        deckEn: input.deckEn || undefined,
        status: 'draft',
        englishStatus: 'none',
        category: input.categoryId,
        authors: input.authorIds,
        tags: input.tagIds?.length ? input.tagIds : undefined,
        province: input.province || undefined,
        hero: input.heroId || undefined,
        bodyNe: input.bodyNe,
        attribution: 'original',
        seoTitleNe: input.seoTitleNe || undefined,
        seoDescriptionNe: input.seoDescriptionNe || undefined,
        createdBy: user.id,
      } as never,
      draft: true,
      user,
      overrideAccess: false,
    })

    return NextResponse.json({ id: String(doc.id), slug: doc.slug, status: doc.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Create failed'
    return NextResponse.json({ message, code: 'CREATE_FAILED' }, { status: 400 })
  }
}

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  contributorRoles,
  editorRoles,
  hasAnyRole,
} from '@/payload/access/rbac'
import { payloadDeskAvailable } from '@/lib/admin/payload-desk'
import { ArticleWriteSchema } from '@/lib/journalist/schema'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

function ownerIdOf(doc: Record<string, unknown>): string {
  const created = doc.createdBy
  if (created && typeof created === 'object' && created !== null && 'id' in created) {
    return String((created as { id: string | number }).id)
  }
  return String(created ?? '')
}

export async function PATCH(request: Request, ctx: Ctx) {
  if (!payloadDeskAvailable()) {
    return NextResponse.json({ message: 'CMS offline', code: 'CMS_OFFLINE' }, { status: 503 })
  }

  const { id } = await ctx.params
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

  try {
    const existing = await payload.findByID({
      collection: 'articles',
      id,
      depth: 0,
      draft: true,
      overrideAccess: true,
    })
    const ownerId = ownerIdOf(existing as Record<string, unknown>)
    const canEditOthers = hasAnyRole(user, editorRoles)
    if (!canEditOthers && ownerId !== String(user.id)) {
      return NextResponse.json({ message: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
    }

    const input = parsed.data
    const doc = await payload.update({
      collection: 'articles',
      id,
      data: {
        titleNe: input.titleNe || null,
        titleEn: input.titleEn || undefined,
        slug: input.slug || null,
        deckNe: input.deckNe || null,
        deckEn: input.deckEn || undefined,
        category: input.categoryId || null,
        authors: input.authorIds.length ? input.authorIds : [],
        tags: input.tagIds?.length ? input.tagIds : [],
        province: input.province || null,
        hero: input.heroId || null,
        bodyNe: input.bodyNe,
        seoTitleNe: input.seoTitleNe || undefined,
        seoDescriptionNe: input.seoDescriptionNe || undefined,
      } as never,
      draft: true,
      user,
      overrideAccess: false,
    })

    return NextResponse.json({ id: String(doc.id), slug: doc.slug, status: doc.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update failed'
    return NextResponse.json({ message, code: 'UPDATE_FAILED' }, { status: 400 })
  }
}

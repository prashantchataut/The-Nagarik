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
import { validateBodyBlocks } from '@/payload/hooks/publish-validate'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

function ownerIdOf(doc: Record<string, unknown>): string {
  const created = doc.createdBy
  if (created && typeof created === 'object' && created !== null && 'id' in created) {
    return String((created as { id: string | number }).id)
  }
  return String(created ?? '')
}

export async function POST(_request: Request, ctx: Ctx) {
  if (!payloadDeskAvailable()) {
    return NextResponse.json({ message: 'CMS offline', code: 'CMS_OFFLINE' }, { status: 503 })
  }

  const { id } = await ctx.params
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user || !hasAnyRole(user, contributorRoles)) {
    return NextResponse.json({ message: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
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

    const bodyError = validateBodyBlocks(existing.bodyNe, 'bodyNe')
    if (bodyError) {
      return NextResponse.json({ message: bodyError, code: 'VALIDATION' }, { status: 400 })
    }
    if (!String(existing.titleNe ?? '').trim() || !String(existing.deckNe ?? '').trim()) {
      return NextResponse.json(
        { message: 'Title and deck are required before submit.', code: 'VALIDATION' },
        { status: 400 },
      )
    }

    const doc = await payload.update({
      collection: 'articles',
      id,
      data: {
        status: 'in_review',
        submittedAt: new Date().toISOString(),
      } as never,
      draft: true,
      user,
      overrideAccess: false,
    })

    return NextResponse.json({ id: String(doc.id), status: doc.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Submit failed'
    return NextResponse.json({ message, code: 'SUBMIT_FAILED' }, { status: 400 })
  }
}

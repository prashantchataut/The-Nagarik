import { getPayload } from 'payload'
import config from '@payload-config'
import { payloadDeskAvailable } from '@/lib/admin/payload-desk'
import type { StaffSession } from '@/lib/auth/staff-session'
import { journalistSeesAllStories } from '@/lib/journalist/session'

export type JournalistStory = {
  id: string
  titleNe: string
  slug: string
  status: string
  englishStatus: string
  categorySlug: string
  updatedAt: string | null
  publishedAt: string | null
  submittedAt: string | null
  isBreaking: boolean
}

export type JournalistStatusCounts = {
  draft: number
  in_review: number
  scheduled: number
  published: number
  retracted: number
}

async function payloadClient() {
  return getPayload({ config })
}

function ownerWhere(session: StaffSession) {
  if (journalistSeesAllStories(session)) return undefined
  return { createdBy: { equals: session.id } }
}

export async function listJournalistStories(
  session: StaffSession,
  opts?: { status?: string; limit?: number },
): Promise<JournalistStory[]> {
  if (!payloadDeskAvailable()) return []
  const p = await payloadClient()
  const owner = ownerWhere(session)
  const statusClause = opts?.status ? { status: { equals: opts.status } } : undefined
  const where =
    owner && statusClause
      ? { and: [owner, statusClause] }
      : owner || statusClause || undefined

  const result = await p.find({
    collection: 'articles',
    where,
    limit: opts?.limit ?? 80,
    depth: 1,
    draft: true,
    sort: '-updatedAt',
    overrideAccess: true,
  })

  return result.docs.map((doc) => {
    const category = doc.category
    let categorySlug = '—'
    if (category && typeof category === 'object' && 'slug' in category) {
      categorySlug = String((category as { slug?: string }).slug ?? '—')
    }
    return {
      id: String(doc.id),
      titleNe: String(doc.titleNe ?? '(untitled)'),
      slug: String(doc.slug ?? ''),
      status: String(doc.status ?? 'draft'),
      englishStatus: String(doc.englishStatus ?? 'none'),
      categorySlug,
      updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : null,
      publishedAt: typeof doc.publishedAt === 'string' ? doc.publishedAt : null,
      submittedAt:
        typeof (doc as unknown as { submittedAt?: unknown }).submittedAt === 'string'
          ? (doc as unknown as { submittedAt: string }).submittedAt
          : null,
      isBreaking: Boolean(doc.isBreaking),
    }
  })
}

export async function getJournalistStatusCounts(
  session: StaffSession,
): Promise<JournalistStatusCounts | null> {
  if (!payloadDeskAvailable()) return null
  const p = await payloadClient()
  const owner = ownerWhere(session)
  const statuses = ['draft', 'in_review', 'scheduled', 'published', 'retracted'] as const
  const counts = await Promise.all(
    statuses.map(async (status) => {
      const where = owner
        ? ({ and: [owner, { status: { equals: status } }] } as const)
        : ({ status: { equals: status } } as const)
      const result = await p.count({
        collection: 'articles',
        where: where as never,
        overrideAccess: true,
      })
      return [status, result.totalDocs] as const
    }),
  )
  return Object.fromEntries(counts) as JournalistStatusCounts
}

export async function getJournalistArticle(session: StaffSession, id: string) {
  if (!payloadDeskAvailable()) return null
  const p = await payloadClient()
  try {
    const doc = await p.findByID({
      collection: 'articles',
      id,
      depth: 2,
      draft: true,
      overrideAccess: true,
    })
    if (!journalistSeesAllStories(session)) {
      const created = doc.createdBy
      const ownerId =
        created && typeof created === 'object' && 'id' in created
          ? String((created as { id: string | number }).id)
          : String(created ?? '')
      if (ownerId && ownerId !== session.id) return null
      if (!ownerId) return null
    }
    return doc
  } catch {
    return null
  }
}

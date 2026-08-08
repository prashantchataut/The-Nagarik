import { getPayload } from 'payload'
import config from '@payload-config'

export function payloadDeskAvailable(): boolean {
  return Boolean(
    process.env.DATABASE_URL?.trim() &&
      process.env.PAYLOAD_SECRET &&
      process.env.PAYLOAD_SECRET.length >= 32,
  )
}

export type DeskStatusCounts = {
  draft: number
  in_review: number
  scheduled: number
  published: number
  retracted: number
}

export type DeskQueueItem = {
  id: string
  titleNe: string
  slug: string
  status: string
  englishStatus: string
  isBreaking: boolean
  updatedAt: string | null
  publishedAt: string | null
  categoryLabel: string
}

export type DeskUserRow = {
  id: string
  name: string
  email: string
  roles: string[]
  isActive: boolean
}

async function payload() {
  return getPayload({ config })
}

export async function getDeskStatusCounts(): Promise<DeskStatusCounts | null> {
  if (!payloadDeskAvailable()) return null
  const p = await payload()
  const statuses = ['draft', 'in_review', 'scheduled', 'published', 'retracted'] as const
  const counts = await Promise.all(
    statuses.map(async (status) => {
      const result = await p.count({
        collection: 'articles',
        where: { status: { equals: status } },
        overrideAccess: true,
      })
      return [status, result.totalDocs] as const
    }),
  )
  return Object.fromEntries(counts) as DeskStatusCounts
}

export async function getDeskEditorialQueue(limit = 40): Promise<DeskQueueItem[]> {
  if (!payloadDeskAvailable()) return []
  const p = await payload()
  const result = await p.find({
    collection: 'articles',
    where: {
      or: [
        { status: { equals: 'draft' } },
        { status: { equals: 'in_review' } },
        { status: { equals: 'scheduled' } },
      ],
    },
    limit,
    depth: 1,
    overrideAccess: true,
    sort: '-updatedAt',
    draft: true,
  })

  return result.docs.map((doc) => {
    const category = doc.category
    let categoryLabel = '—'
    if (category && typeof category === 'object' && 'nameNe' in category) {
      categoryLabel = String((category as { nameNe?: string }).nameNe ?? '—')
    }
    return {
      id: String(doc.id),
      titleNe: String(doc.titleNe ?? '(untitled)'),
      slug: String(doc.slug ?? ''),
      status: String(doc.status ?? 'draft'),
      englishStatus: String(doc.englishStatus ?? 'none'),
      isBreaking: Boolean(doc.isBreaking),
      updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : null,
      publishedAt: typeof doc.publishedAt === 'string' ? doc.publishedAt : null,
      categoryLabel,
    }
  })
}

export async function listDeskUsers(): Promise<DeskUserRow[]> {
  if (!payloadDeskAvailable()) return []
  const p = await payload()
  const result = await p.find({
    collection: 'users',
    limit: 100,
    depth: 0,
    overrideAccess: true,
    sort: 'email',
  })
  return result.docs.map((doc) => ({
    id: String(doc.id),
    name: String(doc.name ?? ''),
    email: String(doc.email ?? ''),
    roles: Array.isArray(doc.roles) ? doc.roles.map(String) : [],
    isActive: doc.isActive !== false,
  }))
}

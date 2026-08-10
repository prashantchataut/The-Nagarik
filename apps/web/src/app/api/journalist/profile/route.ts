import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { z } from 'zod'
import { contributorRoles, hasAnyRole } from '@/payload/access/rbac'
import { payloadDeskAvailable } from '@/lib/admin/payload-desk'

export const dynamic = 'force-dynamic'

const ProfileSchema = z.object({
  nameNe: z.string().trim().min(2).max(80),
  nameEn: z.string().trim().max(80).optional().default(''),
  bioNe: z.string().trim().max(1200).optional().default(''),
  bioEn: z.string().trim().max(1200).optional().default(''),
  beats: z.array(z.string().trim().min(1).max(40)).max(6).optional().default([]),
  avatarId: z.union([z.string(), z.number()]).nullish(),
})

type AuthorDoc = {
  id: string | number
  slug?: unknown
  nameNe?: unknown
  nameEn?: unknown
  bioNe?: unknown
  bioEn?: unknown
  avatar?: { id?: string | number; url?: unknown } | string | number | null
  beats?: Array<{ beat?: unknown }> | null
  user?: { id?: string | number } | string | number | null
}

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40)
  return base || `author-${Date.now().toString(36)}`
}

function serializeAuthor(doc: AuthorDoc) {
  const avatar = doc.avatar
  let avatarId: string | null = null
  let avatarUrl: string | null = null
  if (avatar && typeof avatar === 'object') {
    avatarId = avatar.id != null ? String(avatar.id) : null
    avatarUrl = typeof avatar.url === 'string' ? avatar.url : null
  } else if (avatar != null) {
    avatarId = String(avatar)
  }
  return {
    id: String(doc.id),
    slug: String(doc.slug ?? ''),
    nameNe: String(doc.nameNe ?? ''),
    nameEn: String(doc.nameEn ?? ''),
    bioNe: String(doc.bioNe ?? ''),
    bioEn: String(doc.bioEn ?? ''),
    beats: Array.isArray(doc.beats)
      ? doc.beats.map((row) => String(row?.beat ?? '')).filter(Boolean)
      : [],
    avatarId,
    avatarUrl,
  }
}

async function authedUser() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user || !hasAnyRole(user, contributorRoles)) return { payload, user: null }
  return { payload, user }
}

async function findOwnAuthor(payload: Awaited<ReturnType<typeof getPayload>>, userId: string | number) {
  const result = await payload.find({
    collection: 'authors',
    where: { user: { equals: userId } },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })
  return (result.docs[0] as AuthorDoc | undefined) ?? null
}

async function portfolioFor(
  payload: Awaited<ReturnType<typeof getPayload>>,
  authorId: string | number,
) {
  const result = await payload.find({
    collection: 'articles',
    where: {
      and: [{ authors: { contains: authorId } }, { status: { equals: 'published' } }],
    },
    limit: 12,
    depth: 1,
    sort: '-publishedAt',
    overrideAccess: true,
  })
  return result.docs.map((doc) => {
    const category = (doc as { category?: { slug?: unknown } | null }).category
    return {
      id: String(doc.id),
      titleNe: String((doc as { titleNe?: unknown }).titleNe ?? ''),
      slug: String((doc as { slug?: unknown }).slug ?? ''),
      categorySlug:
        category && typeof category === 'object' ? String(category.slug ?? '') : '',
      publishedAt:
        typeof (doc as { publishedAt?: unknown }).publishedAt === 'string'
          ? String((doc as { publishedAt?: unknown }).publishedAt)
          : null,
    }
  })
}

export async function GET() {
  if (!payloadDeskAvailable()) {
    return NextResponse.json({ message: 'CMS offline', code: 'CMS_OFFLINE' }, { status: 503 })
  }
  const { payload, user } = await authedUser()
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const author = await findOwnAuthor(payload, user.id)
  const portfolio = author ? await portfolioFor(payload, author.id) : []
  return NextResponse.json({
    ok: true,
    account: { name: String(user.name ?? ''), email: String(user.email ?? '') },
    author: author ? serializeAuthor(author) : null,
    portfolio,
  })
}

export async function PUT(request: Request) {
  if (!payloadDeskAvailable()) {
    return NextResponse.json({ message: 'CMS offline', code: 'CMS_OFFLINE' }, { status: 503 })
  }
  const { payload, user } = await authedUser()
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const parsed = ProfileSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Validation failed', code: 'VALIDATION', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const data = {
    nameNe: parsed.data.nameNe,
    nameEn: parsed.data.nameEn,
    bioNe: parsed.data.bioNe,
    bioEn: parsed.data.bioEn,
    beats: parsed.data.beats.map((beat) => ({ beat })),
    avatar: parsed.data.avatarId ?? null,
    user: user.id,
  }

  const existing = await findOwnAuthor(payload, user.id)
  let doc: AuthorDoc
  if (existing) {
    doc = (await payload.update({
      collection: 'authors',
      id: existing.id,
      data,
      depth: 1,
      overrideAccess: true,
    })) as unknown as AuthorDoc
  } else {
    const emailLocal = String(user.email ?? '').split('@')[0] ?? ''
    const slugBase = slugify(parsed.data.nameEn || emailLocal || parsed.data.nameNe)
    // Keep slugs unique without clobbering an unrelated byline.
    const clash = await payload.find({
      collection: 'authors',
      where: { slug: { equals: slugBase } },
      limit: 1,
      overrideAccess: true,
    })
    const slug = clash.totalDocs
      ? `${slugBase}-${Date.now().toString(36).slice(-4)}`
      : slugBase
    doc = (await payload.create({
      collection: 'authors',
      data: { ...data, slug },
      depth: 1,
      overrideAccess: true,
    })) as unknown as AuthorDoc
  }

  const portfolio = await portfolioFor(payload, doc.id)
  return NextResponse.json({ ok: true, author: serializeAuthor(doc), portfolio })
}

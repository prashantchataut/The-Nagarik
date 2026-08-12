import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '@payload-config'
import { payloadDeskAvailable } from '@/lib/admin/payload-desk'

export type CommentStatus = 'pending' | 'approved' | 'rejected'

export type CommentRecord = {
  id: string
  articleId: string
  parentId: string | null
  name: string
  email: string
  body: string
  status: CommentStatus
  locale: string
  ipHash: string
  createdAt: string
}

export type CommentInput = {
  articleId: string
  parentId?: string | null
  name: string
  email?: string
  body: string
  locale?: string
  ipHash: string
}

/** Public projection: never leak reader emails or IP hashes. */
export type PublicComment = {
  id: string
  articleId: string
  parentId: string | null
  name: string
  body: string
  createdAt: string
}

export function toPublicComment(record: CommentRecord): PublicComment {
  return {
    id: record.id,
    articleId: record.articleId,
    parentId: record.parentId,
    name: record.name,
    body: record.body,
    createdAt: record.createdAt,
  }
}

/* ----------------------------- file backend ------------------------------ */
/* Facade / local development storage so the reader flow works without Neon. */

const DATA_DIR = path.join(process.cwd(), '.data')
const FILE = path.join(DATA_DIR, 'comments.json')

type FileStore = { comments: CommentRecord[] }

async function loadFile(): Promise<FileStore> {
  try {
    const store = JSON.parse(await readFile(FILE, 'utf8')) as FileStore
    if (!Array.isArray(store.comments)) return { comments: [] }
    return store
  } catch {
    return { comments: [] }
  }
}

async function saveFile(store: FileStore) {
  await mkdir(DATA_DIR, { recursive: true })
  store.comments = store.comments.slice(-10_000)
  await writeFile(FILE, JSON.stringify(store, null, 2), 'utf8')
}

/* ---------------------------- payload backend ---------------------------- */

function commentsOnPayload(): boolean {
  return payloadDeskAvailable()
}

type PayloadCommentDoc = {
  id: string | number
  article?: string | number | { id: string | number } | null
  parent?: string | number | { id: string | number } | null
  name?: unknown
  email?: unknown
  body?: unknown
  status?: unknown
  locale?: unknown
  ipHash?: unknown
  createdAt?: unknown
}

function relationId(value: PayloadCommentDoc['article']): string | null {
  if (value == null) return null
  if (typeof value === 'object') return String(value.id)
  return String(value)
}

function fromPayloadDoc(doc: PayloadCommentDoc): CommentRecord {
  return {
    id: String(doc.id),
    articleId: relationId(doc.article) ?? '',
    parentId: relationId(doc.parent ?? null),
    name: String(doc.name ?? ''),
    email: String(doc.email ?? ''),
    body: String(doc.body ?? ''),
    status: (doc.status as CommentStatus) ?? 'pending',
    locale: String(doc.locale ?? 'ne'),
    ipHash: String(doc.ipHash ?? ''),
    createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : new Date().toISOString(),
  }
}

/* ------------------------------- public API ------------------------------ */

export async function createComment(input: CommentInput): Promise<CommentRecord> {
  const record: CommentRecord = {
    id: randomUUID(),
    articleId: input.articleId,
    parentId: input.parentId ?? null,
    name: input.name,
    email: input.email ?? '',
    body: input.body,
    status: 'pending',
    locale: input.locale ?? 'ne',
    ipHash: input.ipHash,
    createdAt: new Date().toISOString(),
  }

  if (commentsOnPayload()) {
    try {
      const p = await getPayload({ config })
      const doc = await p.create({
        collection: 'comments',
        data: {
          article: Number.isNaN(Number(input.articleId)) ? input.articleId : Number(input.articleId),
          parent: input.parentId
            ? Number.isNaN(Number(input.parentId))
              ? input.parentId
              : Number(input.parentId)
            : undefined,
          name: input.name,
          email: input.email ?? '',
          body: input.body,
          status: 'pending',
          locale: input.locale ?? 'ne',
          ipHash: input.ipHash,
        },
        overrideAccess: true,
      })
      return fromPayloadDoc(doc as unknown as PayloadCommentDoc)
    } catch {
      // Fall back to the local store so the reader is never dropped.
    }
  }

  const store = await loadFile()
  store.comments.push(record)
  await saveFile(store)
  return record
}

export async function listApprovedComments(articleId: string): Promise<CommentRecord[]> {
  if (commentsOnPayload()) {
    try {
      const p = await getPayload({ config })
      const result = await p.find({
        collection: 'comments',
        where: {
          and: [{ article: { equals: articleId } }, { status: { equals: 'approved' } }],
        },
        limit: 300,
        sort: 'createdAt',
        depth: 0,
        overrideAccess: true,
      })
      return result.docs.map((doc) => fromPayloadDoc(doc as unknown as PayloadCommentDoc))
    } catch {
      // fall through to file store
    }
  }
  const store = await loadFile()
  return store.comments
    .filter((c) => c.articleId === articleId && c.status === 'approved')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function listPendingComments(limit = 100): Promise<CommentRecord[]> {
  if (commentsOnPayload()) {
    try {
      const p = await getPayload({ config })
      const result = await p.find({
        collection: 'comments',
        where: { status: { equals: 'pending' } },
        limit,
        sort: '-createdAt',
        depth: 0,
        overrideAccess: true,
      })
      return result.docs.map((doc) => fromPayloadDoc(doc as unknown as PayloadCommentDoc))
    } catch {
      // fall through to file store
    }
  }
  const store = await loadFile()
  return store.comments
    .filter((c) => c.status === 'pending')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}

/** Recent comments regardless of status - abuse analysis only (staff surface). */
export async function listRecentComments(limit = 300): Promise<CommentRecord[]> {
  if (commentsOnPayload()) {
    try {
      const p = await getPayload({ config })
      const result = await p.find({
        collection: 'comments',
        limit,
        sort: '-createdAt',
        depth: 0,
        overrideAccess: true,
      })
      return result.docs.map((doc) => fromPayloadDoc(doc as unknown as PayloadCommentDoc))
    } catch {
      // fall through to file store
    }
  }
  const store = await loadFile()
  return [...store.comments]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}

export async function moderateComment(
  id: string,
  action: 'approve' | 'reject',
): Promise<CommentRecord | null> {
  const status: CommentStatus = action === 'approve' ? 'approved' : 'rejected'
  if (commentsOnPayload()) {
    try {
      const p = await getPayload({ config })
      const doc = await p.update({
        collection: 'comments',
        id: Number.isNaN(Number(id)) ? id : Number(id),
        data: { status },
        overrideAccess: true,
      })
      return fromPayloadDoc(doc as unknown as PayloadCommentDoc)
    } catch {
      // fall through to file store
    }
  }
  const store = await loadFile()
  const record = store.comments.find((c) => c.id === id)
  if (!record) return null
  record.status = status
  await saveFile(store)
  return record
}

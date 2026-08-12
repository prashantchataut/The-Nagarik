import { NextResponse } from 'next/server'
import { detectBrigading, prioritizeModerationQueue } from '@thenagarik/algorithms'
import { z } from 'zod'
import { apiError, apiOk } from '@/lib/api/http'
import { getStaffSession, staffAuthReady } from '@/lib/auth/staff-session'
import { editorRoles } from '@/payload/access/rbac'
import { listPendingComments, listRecentComments, moderateComment } from '@/lib/comments'
import { getEngagementSnapshot } from '@/lib/engagement'

export const dynamic = 'force-dynamic'

const ActionSchema = z.object({
  id: z.string().min(1).max(128),
  action: z.enum(['approve', 'reject']),
})

/**
 * Moderation access:
 * - When staff auth is available (Payload connected), require an editor+ session.
 * - In facade/dev mode (no DB), allow only outside live launches so the local
 *   moderation demo works without opening a production hole.
 */
async function canModerate(): Promise<boolean> {
  if (staffAuthReady()) {
    const session = await getStaffSession()
    if (!session) return false
    return session.roles.some((role) => (editorRoles as readonly string[]).includes(role))
  }
  return (process.env.LAUNCH_STATUS ?? 'dev') !== 'live'
}

export async function GET(): Promise<NextResponse> {
  if (!(await canModerate())) {
    return apiError('unauthorized', 'Editor session required for moderation.')
  }
  const comments = await listPendingComments(100)

  // ALGO com.queue_priority - review order: hot articles and borderline
  // content first, stale items float up before they rot in the queue.
  const snapshot = await getEngagementSnapshot().catch(() => null)
  const viewsByStory = new Map(
    (snapshot?.trendingSamples ?? []).map((s) => [s.storyId, s.impressions15m]),
  )
  const prioritized = prioritizeModerationQueue(
    comments.map((comment) => ({
      ...comment,
      body: comment.body,
      articleViews15m: viewsByStory.get(comment.articleId) ?? 0,
      createdAt: comment.createdAt,
    })),
  )

  // ALGO com.brigading - per-article raid detection: comment volume in the
  // last 30 minutes x source concentration x never-seen-before sources.
  const recent = await listRecentComments(300)
  const windowMs = 30 * 60_000
  const now = Date.now()
  const knownIpHashes = new Set(
    recent
      .filter((c) => now - new Date(c.createdAt).getTime() > windowMs)
      .map((c) => c.ipHash)
      .filter(Boolean),
  )
  const byArticle = new Map<string, typeof recent>()
  for (const comment of recent) {
    byArticle.set(comment.articleId, [...(byArticle.get(comment.articleId) ?? []), comment])
  }
  const brigades = [...byArticle.entries()]
    .map(([articleId, articleComments]) => ({
      articleId,
      ...detectBrigading(
        articleComments.map((c) => ({ ipHash: c.ipHash, at: c.createdAt })),
        knownIpHashes,
      ),
    }))
    .filter((b) => b.brigading)

  return apiOk({ comments: prioritized, brigades })
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!(await canModerate())) {
    return apiError('unauthorized', 'Editor session required for moderation.')
  }
  const parsed = ActionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return apiError('invalid', 'id and action (approve|reject) are required.')
  }
  const record = await moderateComment(parsed.data.id, parsed.data.action)
  if (!record) {
    return apiError('not-found', 'Comment not found.')
  }
  return apiOk({ comment: record })
}

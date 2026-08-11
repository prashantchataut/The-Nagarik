import { NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError, apiOk } from '@/lib/api/http'
import { getStaffSession, staffAuthReady } from '@/lib/auth/staff-session'
import { editorRoles } from '@/payload/access/rbac'
import { listPendingComments, moderateComment } from '@/lib/comments'

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
  return apiOk({ comments })
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

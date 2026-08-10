import { NextResponse } from 'next/server'
import { z } from 'zod'
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

export async function GET() {
  if (!(await canModerate())) {
    return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 })
  }
  const comments = await listPendingComments(100)
  return NextResponse.json({ ok: true, comments })
}

export async function POST(request: Request) {
  if (!(await canModerate())) {
    return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 })
  }
  const parsed = ActionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: 'invalid' }, { status: 400 })
  }
  const record = await moderateComment(parsed.data.id, parsed.data.action)
  if (!record) {
    return NextResponse.json({ ok: false, reason: 'not-found' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, comment: record })
}

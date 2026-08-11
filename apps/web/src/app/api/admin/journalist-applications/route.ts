import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { z } from 'zod'
import { apiError, apiOk } from '@/lib/api/http'
import { getStaffSession, staffAuthReady } from '@/lib/auth/staff-session'
import { editorRoles } from '@/payload/access/rbac'

export const dynamic = 'force-dynamic'

const ActionSchema = z.object({
  id: z.string().min(1).max(128),
  action: z.enum(['approve', 'reject']),
})

async function requireEditor() {
  if (!staffAuthReady()) return null
  const session = await getStaffSession()
  if (!session) return null
  if (!session.roles.some((role) => (editorRoles as readonly string[]).includes(role))) return null
  return session
}

type ApplicationDoc = {
  id: string | number
  name?: unknown
  email?: unknown
  phone?: unknown
  organization?: unknown
  portfolioUrl?: unknown
  message?: unknown
  status?: unknown
  locale?: unknown
  createdAt?: unknown
}

function serialize(doc: ApplicationDoc) {
  return {
    id: String(doc.id),
    name: String(doc.name ?? ''),
    email: String(doc.email ?? ''),
    phone: String(doc.phone ?? ''),
    organization: String(doc.organization ?? ''),
    portfolioUrl: String(doc.portfolioUrl ?? ''),
    message: String(doc.message ?? ''),
    status: String(doc.status ?? 'pending'),
    locale: String(doc.locale ?? 'ne'),
    createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : '',
  }
}

export async function GET(): Promise<NextResponse> {
  const session = await requireEditor()
  if (!session) return apiError('unauthorized', 'Editor session required.')

  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'journalist-applications',
    where: { status: { equals: 'pending' } },
    limit: 100,
    sort: '-createdAt',
    depth: 0,
    overrideAccess: true,
  })
  return apiOk({ applications: result.docs.map((doc) => serialize(doc as ApplicationDoc)) })
}

/**
 * Approve: verifies the application and creates the newsroom `users` account
 * with the `journalist` role and a ONE-TIME password returned once to the
 * approving editor for manual handover. Reject: closes the application.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const session = await requireEditor()
  if (!session) return apiError('unauthorized', 'Editor session required.')

  const parsed = ActionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return apiError('invalid', 'id and action (approve|reject) are required.')
  }

  const payload = await getPayload({ config })
  const id = Number.isNaN(Number(parsed.data.id)) ? parsed.data.id : Number(parsed.data.id)
  const application = (await payload
    .findByID({ collection: 'journalist-applications', id, overrideAccess: true, depth: 0 })
    .catch(() => null)) as ApplicationDoc | null
  if (!application) return apiError('not-found', 'Application not found.')
  if (application.status !== 'pending') {
    return apiError('invalid', 'Application has already been reviewed.')
  }

  if (parsed.data.action === 'reject') {
    await payload.update({
      collection: 'journalist-applications',
      id,
      data: { status: 'rejected', reviewedBy: Number(session.id) || session.id },
      overrideAccess: true,
    })
    return apiOk({ status: 'rejected' })
  }

  const email = String(application.email ?? '').toLowerCase()

  // Existing staff account with this email: approve without creating another.
  const existingUser = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })
  if (existingUser.totalDocs > 0) {
    await payload.update({
      collection: 'journalist-applications',
      id,
      data: {
        status: 'approved',
        reviewedBy: Number(session.id) || session.id,
        createdUser: existingUser.docs[0].id,
      },
      overrideAccess: true,
    })
    return apiOk({ status: 'approved', userExisted: true })
  }

  // Verified: create the journalist staff account with a one-time password.
  const tempPassword = `Ng-${randomBytes(9).toString('base64url')}`
  try {
    const user = await payload.create({
      collection: 'users',
      data: {
        email,
        name: String(application.name ?? ''),
        password: tempPassword,
        roles: ['journalist'],
        isActive: true,
      },
      overrideAccess: true,
    })
    await payload.update({
      collection: 'journalist-applications',
      id,
      data: {
        status: 'approved',
        reviewedBy: Number(session.id) || session.id,
        createdUser: user.id,
      },
      overrideAccess: true,
    })
    // Returned exactly once; the editor hands it over and the journalist
    // changes it at first login in /cms.
    return apiOk({ status: 'approved', tempPassword, email })
  } catch {
    return apiError('server-error', 'Staff account could not be created.')
  }
}

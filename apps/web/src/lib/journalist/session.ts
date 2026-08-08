import { redirect } from 'next/navigation'
import {
  contributorRoles,
  editorRoles,
  hasAnyRole,
  publisherRoles,
} from '@/payload/access/rbac'
import { getStaffSession, requireStaffSession, type StaffSession } from '@/lib/auth/staff-session'
import { primaryRole } from '@/lib/auth/staff-roles'

export async function requireContributorSession(
  nextPath = '/journalist',
): Promise<StaffSession> {
  const session = await requireStaffSession(nextPath)
  const userLike = { roles: session.roles, isActive: true }
  if (!hasAnyRole(userLike, contributorRoles)) {
    redirect('/admin/login?next=/journalist')
  }
  return session
}

export async function getContributorSession(): Promise<StaffSession | null> {
  const session = await getStaffSession()
  if (!session) return null
  if (!hasAnyRole({ roles: session.roles, isActive: true }, contributorRoles)) return null
  return session
}

/** Journalists see own stories; editors+ see the newsroom inbox. */
export function journalistSeesAllStories(session: StaffSession): boolean {
  return hasAnyRole({ roles: session.roles, isActive: true }, editorRoles)
}

export function canPublishStories(session: StaffSession): boolean {
  return hasAnyRole({ roles: session.roles, isActive: true }, publisherRoles)
}

export function sessionPrimaryRole(session: StaffSession) {
  return primaryRole(session.roles)
}

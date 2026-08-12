import { cache } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  hasAnyRole,
  rolesFromUser,
  STAFF_ROLES,
  type StaffRole,
} from '@/payload/access/rbac'
import { payloadDeskAvailable } from '@/lib/admin/payload-desk'

export type { StaffRole }

/**
 * Staff session via Payload auth only.
 * Deliberately not Better Auth (Watch dual-auth trap).
 */
export type StaffSession = {
  id: string
  email: string
  name: string
  roles: StaffRole[]
}

export function staffAuthReady(): boolean {
  return payloadDeskAvailable()
}

export const getStaffSession = cache(async (): Promise<StaffSession | null> => {
  if (!staffAuthReady()) return null
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: await headers() })
    // Hard separation: only the `users` collection is newsroom staff.
    // A reader token must never resolve to a staff session.
    if (!user || user.collection !== 'users') return null
    if (!hasAnyRole(user, STAFF_ROLES)) return null
    return {
      id: String(user.id),
      email: typeof user.email === 'string' ? user.email : '',
      name: typeof user.name === 'string' ? user.name : '',
      roles: [...rolesFromUser(user)],
    }
  } catch {
    return null
  }
})

export async function requireStaffSession(nextPath = '/admin'): Promise<StaffSession> {
  const session = await getStaffSession()
  if (!session) {
    const login = new URL('/admin/login', 'http://local')
    login.searchParams.set('next', nextPath)
    redirect(`${login.pathname}${login.search}`)
  }
  return session
}

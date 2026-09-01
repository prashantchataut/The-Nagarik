import type { StaffRole } from '@/lib/auth/staff-roles'

/** Login portals for newsroom Users (not reader accounts). */
export type StaffLoginPortal = 'journalist' | 'admin'

const EDITOR_DESK_ROLES: readonly StaffRole[] = ['editor', 'publisher', 'admin']

export function staffLoginPathFor(nextPath = '/admin'): string {
  if (nextPath.startsWith('/journalist')) return '/journalist/login'
  return '/admin/login'
}

export function canAccessAdminDesk(roles: readonly StaffRole[]): boolean {
  return EDITOR_DESK_ROLES.some((role) => roles.includes(role))
}

export function resolveStaffRedirect(opts: {
  portal: StaffLoginPortal
  nextPath?: string
  roles: readonly StaffRole[]
}): string {
  const { portal, roles } = opts
  const requested = typeof opts.nextPath === 'string' ? opts.nextPath.trim() : ''

  if (portal === 'journalist') {
    if (requested.startsWith('/journalist')) return requested
    return '/journalist'
  }

  if (!canAccessAdminDesk(roles)) {
    return '/journalist'
  }
  if (requested.startsWith('/admin')) return requested
  if (requested.startsWith('/journalist')) return requested
  return '/admin'
}

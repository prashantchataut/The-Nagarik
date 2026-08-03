import type { Access, Where } from 'payload'

/** Compact newsroom roles — keep small (PRODUCT / PAYLOAD_CUTOVER). */
export type StaffRole = 'journalist' | 'editor' | 'publisher' | 'admin'

export const STAFF_ROLES = ['journalist', 'editor', 'publisher', 'admin'] as const satisfies readonly StaffRole[]

export const contributorRoles = ['journalist', 'editor', 'publisher', 'admin'] as const satisfies readonly StaffRole[]

export const editorRoles = ['editor', 'publisher', 'admin'] as const satisfies readonly StaffRole[]

export const publisherRoles = ['publisher', 'admin'] as const satisfies readonly StaffRole[]

export const adminRoles = ['admin'] as const satisfies readonly StaffRole[]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isActiveUser(user: unknown): user is Record<string, unknown> {
  return isRecord(user) && user.isActive !== false
}

export function rolesFromUser(user: unknown): Set<StaffRole> {
  if (!isActiveUser(user)) return new Set()
  const raw = user.roles
  if (!Array.isArray(raw)) return new Set()
  const roles = new Set<StaffRole>()
  for (const role of raw) {
    if (typeof role === 'string' && (STAFF_ROLES as readonly string[]).includes(role)) {
      roles.add(role as StaffRole)
    }
  }
  return roles
}

export function hasAnyRole(user: unknown, allowed: readonly StaffRole[]): boolean {
  const roles = rolesFromUser(user)
  return allowed.some((role) => roles.has(role))
}

export const anyone: Access = () => true

export const signedIn: Access = ({ req }) => isActiveUser(req.user)

export function withRoles(allowed: readonly StaffRole[]): Access {
  return ({ req }) => hasAnyRole(req.user, allowed)
}

/** Published docs are public; drafts only for signed-in staff. */
export const publishedOrStaff: Access = ({ req }): boolean | Where => {
  if (hasAnyRole(req.user, STAFF_ROLES)) return true
  return {
    and: [{ status: { equals: 'published' } }, { _status: { equals: 'published' } }],
  }
}

export const ownUserOrAdmin: Access = ({ req }): boolean | Where => {
  if (hasAnyRole(req.user, adminRoles)) return true
  if (!isActiveUser(req.user)) return false
  return { id: { equals: req.user.id } }
}

export const createUserOrBootstrap: Access = async ({ req }) => {
  if (hasAnyRole(req.user, adminRoles)) return true
  const existing = await req.payload.count({ collection: 'users', overrideAccess: true })
  return existing.totalDocs === 0
}

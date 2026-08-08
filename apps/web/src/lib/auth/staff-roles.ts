export type StaffRole = 'journalist' | 'editor' | 'publisher' | 'admin'

/** Highest-privilege role for desk chrome (safe for client components). */
export function primaryRole(roles: readonly StaffRole[]): StaffRole | null {
  const order: StaffRole[] = ['admin', 'publisher', 'editor', 'journalist']
  return order.find((role) => roles.includes(role)) ?? roles[0] ?? null
}

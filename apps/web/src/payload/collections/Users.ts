import type { CollectionConfig } from 'payload'
import {
  adminRoles,
  createUserOrBootstrap,
  hasAnyRole,
  ownUserOrAdmin,
  STAFF_ROLES,
  withRoles,
} from '../access/rbac'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    useAPIKey: true,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'roles', 'isActive'],
    group: 'People',
  },
  access: {
    read: ownUserOrAdmin,
    create: createUserOrBootstrap,
    update: ownUserOrAdmin,
    delete: withRoles(adminRoles),
    admin: ({ req }) => hasAnyRole(req.user, STAFF_ROLES),
    unlock: ({ req }) => hasAnyRole(req.user, adminRoles),
  },
  hooks: {
    beforeLogin: [
      ({ user }) => {
        if (user.isActive === false) {
          throw new Error('This newsroom account has been disabled. Contact an administrator.')
        }
        return user
      },
    ],
    beforeChange: [
      async ({ data, operation, req }) => {
        if (!data) return data
        if (operation === 'create') {
          const existing = await req.payload.count({
            collection: 'users',
            overrideAccess: true,
          })
          if (existing.totalDocs === 0) {
            return {
              ...data,
              roles: ['admin'],
              isActive: true,
            }
          }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Display name (Devanagari or Latin).',
      },
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['journalist'],
      options: STAFF_ROLES.map((role) => ({ label: role, value: role })),
      access: {
        update: ({ req }) => hasAnyRole(req.user, adminRoles),
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      access: {
        update: ({ req }) => hasAnyRole(req.user, adminRoles),
      },
    },
  ],
}

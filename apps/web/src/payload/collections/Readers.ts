import type { CollectionConfig } from 'payload'
import { adminRoles, hasAnyRole } from '../access/rbac'

/**
 * READER accounts - completely separate from newsroom staff (`users`).
 *
 * - Readers personalise their news experience (name, interests, avatar color).
 * - Readers NEVER gain newsroom capabilities: no roles field exists here, and
 *   every staff gate checks `collection === 'users'` + roles.
 * - Public signup happens only through the validated `/api/reader/register`
 *   route (rate limited); direct REST creation is admin-only.
 * - One auth cookie serves one session: logging in as a reader replaces any
 *   staff session and vice versa, so accounts can never be "switched" into
 *   each other.
 */
export const Readers: CollectionConfig = {
  slug: 'readers',
  auth: {
    tokenExpiration: 60 * 60 * 24 * 30,
    maxLoginAttempts: 8,
    lockTime: 10 * 60 * 1000,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'isActive', 'createdAt'],
    listSearchableFields: ['name', 'email'],
    group: 'People',
    description: 'Reader accounts. Not newsroom staff - no editorial capabilities.',
  },
  access: {
    read: ({ req }) => {
      if (hasAnyRole(req.user, adminRoles)) return true
      if (req.user?.collection === 'readers') return { id: { equals: req.user.id } }
      return false
    },
    create: ({ req }) => hasAnyRole(req.user, adminRoles),
    update: ({ req }) => {
      if (hasAnyRole(req.user, adminRoles)) return true
      if (req.user?.collection === 'readers') return { id: { equals: req.user.id } }
      return false
    },
    delete: ({ req }) => {
      if (hasAnyRole(req.user, adminRoles)) return true
      if (req.user?.collection === 'readers') return { id: { equals: req.user.id } }
      return false
    },
    // Readers never see the CMS admin panel.
    admin: () => false,
    unlock: ({ req }) => hasAnyRole(req.user, adminRoles),
  },
  hooks: {
    beforeLogin: [
      ({ user }) => {
        if (user.isActive === false) {
          throw new Error('This reader account has been disabled.')
        }
        return user
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      maxLength: 60,
    },
    {
      name: 'avatarColor',
      type: 'select',
      defaultValue: 'teal',
      options: ['teal', 'blue', 'maroon', 'violet', 'forest', 'slate'].map((value) => ({
        label: value,
        value,
      })),
    },
    {
      name: 'interests',
      type: 'array',
      maxRows: 8,
      fields: [{ name: 'slug', type: 'text', required: true, maxLength: 40 }],
      admin: { description: 'Followed category slugs, powers recommendations.' },
    },
    {
      name: 'locale',
      type: 'select',
      defaultValue: 'ne',
      options: [
        { label: 'नेपाली', value: 'ne' },
        { label: 'English', value: 'en' },
      ],
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
  timestamps: true,
}

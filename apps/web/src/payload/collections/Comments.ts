import type { CollectionConfig } from 'payload'
import { editorRoles, withRoles } from '../access/rbac'

/**
 * Reader comments with editorial moderation.
 * Created only through the public API route (server-side, validated and
 * rate limited); readers never write to this collection directly.
 * Approved comments are public; pending/rejected stay staff-only.
 */
export const Comments: CollectionConfig = {
  slug: 'comments',
  admin: {
    useAsTitle: 'body',
    defaultColumns: ['body', 'name', 'status', 'article', 'createdAt'],
    group: 'Engagement',
    description: 'Reader comments. Approve or reject from the moderation queue.',
  },
  access: {
    read: ({ req }) => {
      if (req.user) return true
      return { status: { equals: 'approved' } }
    },
    // Server routes insert with overrideAccess after validation + rate limits.
    create: withRoles(editorRoles),
    update: withRoles(editorRoles),
    delete: withRoles(editorRoles),
  },
  fields: [
    {
      name: 'article',
      type: 'relationship',
      relationTo: 'articles',
      required: true,
      index: true,
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'comments',
      admin: { description: 'Parent comment for threaded replies.' },
    },
    { name: 'name', type: 'text', required: true, maxLength: 60 },
    {
      name: 'email',
      type: 'text',
      admin: { description: 'Optional. Never displayed publicly.' },
    },
    { name: 'body', type: 'textarea', required: true, maxLength: 2000 },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: [
        { label: 'Pending review', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
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
      name: 'ipHash',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Salted hash for abuse control. Raw IPs are never stored.',
      },
    },
  ],
  timestamps: true,
}

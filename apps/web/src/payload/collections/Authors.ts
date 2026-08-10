import type { CollectionConfig } from 'payload'
import { adminRoles, anyone, editorRoles, withRoles } from '../access/rbac'

export const Authors: CollectionConfig = {
  slug: 'authors',
  admin: {
    useAsTitle: 'nameNe',
    defaultColumns: ['nameNe', 'nameEn', 'slug'],
    group: 'People',
  },
  access: {
    read: anyone,
    create: withRoles(editorRoles),
    update: withRoles(editorRoles),
    delete: withRoles(adminRoles),
  },
  fields: [
    { name: 'nameNe', type: 'text', required: true, label: 'Name (Nepali)' },
    { name: 'nameEn', type: 'text', label: 'Name (English)' },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    { name: 'bioNe', type: 'textarea', label: 'Bio (Nepali)' },
    { name: 'bioEn', type: 'textarea', label: 'Bio (English)' },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      label: 'Profile photo',
      admin: { description: 'Portrait shown on bylines and the author page.' },
    },
    {
      name: 'beats',
      type: 'array',
      label: 'Beat specializations',
      maxRows: 6,
      fields: [{ name: 'beat', type: 'text', required: true, maxLength: 40 }],
      admin: { description: 'Coverage areas, e.g. राजनीति, अर्थतन्त्र, प्रदेश १.' },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      label: 'Linked staff account',
      admin: {
        position: 'sidebar',
        description: 'Staff user who owns this byline (enables self-serve profile editing).',
      },
    },
  ],
}

import type { CollectionConfig } from 'payload'
import { adminRoles, anyone, editorRoles, withRoles } from '../access/rbac'

export const Tags: CollectionConfig = {
  slug: 'tags',
  admin: {
    useAsTitle: 'nameNe',
    defaultColumns: ['nameNe', 'nameEn', 'slug'],
    group: 'Content',
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
  ],
}

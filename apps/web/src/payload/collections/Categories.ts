import type { CollectionConfig } from 'payload'
import { adminRoles, anyone, editorRoles, withRoles } from '../access/rbac'

export const Categories: CollectionConfig = {
  slug: 'categories',
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
    { name: 'nameEn', type: 'text', required: true, label: 'Name (English)' },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    { name: 'descriptionNe', type: 'textarea', label: 'Description (Nepali)' },
    { name: 'descriptionEn', type: 'textarea', label: 'Description (English)' },
  ],
}

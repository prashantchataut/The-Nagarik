import type { CollectionConfig } from 'payload'
import { adminRoles, anyone, contributorRoles, withRoles } from '../access/rbac'
import { enforceMediaCredit } from '../hooks/publish-validate'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Content',
    defaultColumns: ['filename', 'alt', 'credit', 'updatedAt'],
  },
  access: {
    read: anyone,
    create: withRoles(contributorRoles),
    update: withRoles(contributorRoles),
    delete: withRoles(adminRoles),
  },
  upload: {
    mimeTypes: ['image/*'],
  },
  hooks: {
    beforeValidate: [enforceMediaCredit],
  },
  fields: [
    {
      name: 'alt',
      type: 'textarea',
      required: true,
      label: 'Alt text',
      admin: {
        description: 'Required. Describe the image for accessibility and SEO.',
      },
    },
    {
      name: 'credit',
      type: 'text',
      required: true,
      label: 'Credit',
      admin: {
        description: 'Required. Photographer, agency, or source credit.',
      },
    },
    {
      name: 'caption',
      type: 'textarea',
    },
  ],
}

import type { CollectionConfig } from 'payload'
import { editorRoles, withRoles } from '../access/rbac'

/**
 * First-party engagement events (consented only).
 * Written exclusively by the server route after cookie-consent verification;
 * powers trending / most-read windows. No PII: no IPs, no user ids.
 */
export const EngagementEvents: CollectionConfig = {
  slug: 'engagement-events',
  admin: {
    useAsTitle: 'type',
    defaultColumns: ['type', 'storyId', 'dwellMs', 'createdAt'],
    group: 'Engagement',
    description: 'Consented first-party reader events. Retention-pruned by the ops cron.',
  },
  access: {
    read: withRoles(editorRoles),
    create: withRoles(editorRoles),
    update: () => false,
    delete: withRoles(editorRoles),
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      index: true,
      options: ['impression', 'click', 'dwell', 'complete', 'share', 'search'].map((value) => ({
        label: value,
        value,
      })),
    },
    { name: 'storyId', type: 'text', index: true, maxLength: 128 },
    { name: 'query', type: 'text', maxLength: 256 },
    { name: 'dwellMs', type: 'number', min: 0 },
  ],
  timestamps: true,
}

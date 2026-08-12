import type { CollectionConfig } from 'payload'
import { editorRoles, withRoles } from '../access/rbac'

/**
 * Newsletter subscribers.
 * Created only through the public API route (validated + rate limited).
 * Emails are PII: readable by editors+ only, never exposed publicly.
 */
export const NewsletterSubscribers: CollectionConfig = {
  slug: 'newsletter-subscribers',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'locale', 'status', 'createdAt'],
    group: 'Engagement',
    description: 'Reader newsletter list. Export via API or CMS; never share raw.',
  },
  access: {
    read: withRoles(editorRoles),
    create: withRoles(editorRoles),
    update: withRoles(editorRoles),
    delete: withRoles(editorRoles),
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
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
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'subscribed',
      index: true,
      options: [
        { label: 'Subscribed', value: 'subscribed' },
        { label: 'Unsubscribed', value: 'unsubscribed' },
      ],
    },
    {
      name: 'source',
      type: 'text',
      admin: { description: 'Signup surface: footer, sidebar, campaign tag.' },
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

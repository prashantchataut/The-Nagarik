import type { CollectionConfig } from 'payload'
import { adminRoles, hasAnyRole } from '../access/rbac'
import { transactionalHtml } from '../../lib/email'
import { SITE } from '../../site.config'

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
    forgotPassword: {
      // 1 hour; the email links to the reader-facing reset page (never /cms).
      expiration: 60 * 60 * 1000,
      generateEmailSubject: (args) => {
        const user = args?.user as { locale?: string } | undefined
        const ne = user?.locale !== 'en'
        return ne
          ? `${SITE.brand.ne} - पासवर्ड रिसेट`
          : `${SITE.brand.en} - password reset`
      },
      generateEmailHTML: (args) => {
        const token = args?.token ?? ''
        const user = args?.user as { locale?: string; name?: string } | undefined
        const ne = user?.locale !== 'en'
        const base = process.env.NEXT_PUBLIC_SITE_URL?.trim() || `https://${SITE.domain}`
        const localePath = ne ? 'ne' : 'en'
        const url = `${base}/${localePath}/reset-password?token=${encodeURIComponent(token)}`
        return transactionalHtml({
          siteName: ne ? SITE.brand.ne : SITE.brand.en,
          heading: ne ? 'पासवर्ड रिसेट गर्नुहोस्' : 'Reset your password',
          bodyHtml: ne
            ? `नमस्ते${user?.name ? ` ${user.name}` : ''}, तपाईंको खाताको पासवर्ड रिसेट गर्न तलको बटन थिच्नुहोस्। यो लिङ्क १ घण्टासम्म मात्र मान्य रहन्छ।`
            : `Hello${user?.name ? ` ${user.name}` : ''}, press the button below to reset your account password. This link is valid for 1 hour only.`,
          ctaLabel: ne ? 'नयाँ पासवर्ड राख्नुहोस्' : 'Set a new password',
          ctaUrl: url,
          footerNote: ne
            ? 'यो अनुरोध तपाईंले गर्नुभएको होइन भने यो इमेल बेवास्ता गर्नुहोस् - खातामा कुनै परिवर्तन हुँदैन।'
            : 'If you did not request this, ignore this email - nothing changes on your account.',
        })
      },
    },
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
    /**
     * Server-synced reader library (multi-device bookmarks + reading
     * history). Written only through /api/reader/library which validates
     * shape and enforces caps; hidden from the CMS UI - it is reader data,
     * not editorial data.
     */
    {
      name: 'savedStories',
      type: 'json',
      admin: { hidden: true },
    },
    {
      name: 'readingHistory',
      type: 'json',
      admin: { hidden: true },
    },
    {
      /**
       * Deletion tombstones ({ saved: [{storyId, deletedAt}], history: [...] }).
       * Stop stale devices from resurrecting removed items during merge:
       * an incoming item only wins if its timestamp is NEWER than the
       * tombstone (i.e. the reader really re-saved it afterwards).
       */
      name: 'libraryTombstones',
      type: 'json',
      admin: { hidden: true },
    },
  ],
  timestamps: true,
}

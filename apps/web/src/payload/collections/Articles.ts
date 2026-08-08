import type { CollectionConfig } from 'payload'
import {
  adminRoles,
  contributorRoles,
  hasAnyRole,
  publisherRoles,
  publishedOrStaff,
  withRoles,
} from '../access/rbac'
import { enforceArticlePublish } from '../hooks/publish-validate'
import { revalidatePublishedArticle } from '../hooks/revalidate'

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 96)
}

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'titleNe',
    defaultColumns: ['titleNe', 'status', 'englishStatus', 'isBreaking', 'publishedAt', 'category'],
    listSearchableFields: ['titleNe', 'titleEn', 'slug', 'deckNe'],
    group: 'Content',
    description:
      'Publish checklist: Nepali title + deck, category, ≥1 author, hero alt+credit if media attached. English public pages need englishStatus=published.',
  },
  versions: {
    drafts: {
      autosave: false,
    },
  },
  access: {
    read: publishedOrStaff,
    create: withRoles(contributorRoles),
    update: withRoles(contributorRoles),
    delete: withRoles(adminRoles),
    readVersions: withRoles(contributorRoles),
  },
  hooks: {
    beforeChange: [enforceArticlePublish],
    afterChange: [revalidatePublishedArticle],
  },
  fields: [
    {
      name: 'titleNe',
      type: 'text',
      required: true,
      maxLength: 120,
      label: 'Title (Nepali)',
    },
    {
      name: 'titleEn',
      type: 'text',
      maxLength: 120,
      label: 'Title (English)',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      hooks: {
        beforeValidate: [
          ({ value, siblingData }) => {
            const source = String(value ?? siblingData?.titleEn ?? '')
            const next = toSlug(source)
            if (!next) throw new Error('Slug is required.')
            return next
          },
        ],
      },
      validate: (value: unknown) => {
        const slug = String(value ?? '')
        return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || 'Slug must be lowercase with hyphens only.'
      },
      admin: { position: 'sidebar' },
    },
    {
      name: 'deckNe',
      type: 'textarea',
      required: true,
      label: 'Deck (Nepali)',
    },
    {
      name: 'deckEn',
      type: 'textarea',
      label: 'Deck (English)',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'In review', value: 'in_review' },
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Published', value: 'published' },
        { label: 'Retracted', value: 'retracted' },
      ],
      access: {
        update: ({ req }) => hasAnyRole(req.user, contributorRoles),
      },
      admin: {
        position: 'sidebar',
        description:
          'Journalists: draft / in_review. Publisher/admin: scheduled / published / retracted (enforced in hooks).',
      },
      index: true,
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Set automatically on create. Journalist desk filters by this.',
      },
      access: {
        update: () => false,
      },
    },
    {
      name: 'submittedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Set when status first moves to in_review.',
        date: { pickerAppearance: 'dayAndTime' },
      },
      access: {
        update: ({ req }) => hasAnyRole(req.user, publisherRoles),
      },
    },
    {
      name: 'englishStatus',
      type: 'select',
      required: true,
      defaultValue: 'none',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Draft', value: 'draft' },
        { label: 'In review', value: 'in_review' },
        { label: 'Published', value: 'published' },
      ],
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Public /en pages require englishStatus = published.',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      admin: { position: 'sidebar' },
      index: true,
    },
    {
      name: 'authors',
      type: 'relationship',
      relationTo: 'authors',
      hasMany: true,
      required: true,
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
    },
    {
      name: 'province',
      type: 'select',
      options: [
        { label: 'Bagmati', value: 'bagmati' },
        { label: 'Madhesh', value: 'madhesh' },
        { label: 'Koshi', value: 'koshi' },
        { label: 'Gandaki', value: 'gandaki' },
        { label: 'Lumbini', value: 'lumbini' },
        { label: 'Karnali', value: 'karnali' },
        { label: 'Sudurpashchim', value: 'sudurpashchim' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'hero',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'isBreaking',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'editorialPriority',
      type: 'number',
      min: 0,
      max: 10,
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
    {
      name: 'attribution',
      type: 'select',
      required: true,
      defaultValue: 'original',
      options: [{ label: 'Original', value: 'original' }],
      admin: {
        position: 'sidebar',
        description: 'Original journalism only. No wire/aggregator paths.',
      },
    },
    {
      name: 'bodyNe',
      type: 'json',
      required: true,
      label: 'Body (Nepali blocks)',
      admin: {
        description:
          'JSON array of blocks: paragraph | heading2 | heading3 | pullQuote | list | image.',
      },
    },
    {
      name: 'bodyEn',
      type: 'json',
      label: 'Body (English blocks)',
    },
    {
      name: 'corrections',
      type: 'array',
      labels: { singular: 'Correction', plural: 'Corrections' },
      admin: {
        description: 'Visible, dated corrections shown on the article (reader-facing).',
      },
      fields: [
        { name: 'at', type: 'date', required: true },
        { name: 'noteNe', type: 'textarea', required: true, label: 'Note (Nepali)' },
        { name: 'noteEn', type: 'textarea', label: 'Note (English)' },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'seoTitleNe',
      type: 'text',
      label: 'SEO title (Nepali)',
      admin: { description: 'Overrides headline in <title>/OG when set.' },
    },
    {
      name: 'seoTitleEn',
      type: 'text',
      label: 'SEO title (English)',
    },
    {
      name: 'seoDescriptionNe',
      type: 'textarea',
      label: 'SEO description (Nepali)',
    },
    {
      name: 'seoDescriptionEn',
      type: 'textarea',
      label: 'SEO description (English)',
    },
    {
      name: 'packageId',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Optional package/series id for related stories.',
      },
      index: true,
    },
  ],
}

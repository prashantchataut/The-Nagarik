/**
 * Payload CollectionConfig shapes (TypeScript).
 * Drop into a live `buildConfig` when Payload packages + Neon are connected.
 * Field names align with `@thenagarik/content` Article schema.
 */

export const ArticlesCollection = {
  slug: 'articles',
  admin: { useAsTitle: 'titleNe', defaultColumns: ['titleNe', 'status', 'englishStatus', 'publishedAt'] },
  versions: { drafts: true },
  fields: [
    { name: 'titleNe', type: 'text', required: true },
    { name: 'titleEn', type: 'text' },
    { name: 'deckNe', type: 'textarea', required: true },
    { name: 'deckEn', type: 'textarea' },
    { name: 'slug', type: 'text', required: true, unique: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: ['draft', 'in_review', 'scheduled', 'published', 'retracted'],
    },
    {
      name: 'englishStatus',
      type: 'select',
      required: true,
      defaultValue: 'none',
      options: ['none', 'draft', 'in_review', 'published'],
    },
    { name: 'category', type: 'relationship', relationTo: 'categories', required: true },
    { name: 'authors', type: 'relationship', relationTo: 'authors', hasMany: true, required: true },
    { name: 'tags', type: 'relationship', relationTo: 'tags', hasMany: true },
    { name: 'province', type: 'text' },
    { name: 'hero', type: 'upload', relationTo: 'media' },
    { name: 'isBreaking', type: 'checkbox', defaultValue: false },
    { name: 'editorialPriority', type: 'number', min: 0, max: 10, defaultValue: 0 },
    { name: 'attribution', type: 'select', options: ['original'], defaultValue: 'original', required: true },
    { name: 'bodyNe', type: 'json', required: true },
    { name: 'bodyEn', type: 'json' },
    { name: 'corrections', type: 'array', fields: [
      { name: 'at', type: 'date', required: true },
      { name: 'noteNe', type: 'textarea', required: true },
      { name: 'noteEn', type: 'textarea' },
    ]},
    { name: 'publishedAt', type: 'date' },
    { name: 'seoTitleNe', type: 'text' },
    { name: 'seoTitleEn', type: 'text' },
    { name: 'packageId', type: 'text' },
  ],
  hooks: {
    beforeChange: ['enforceEnglishGate', 'requireAuthors'],
    afterChange: ['revalidateReader'],
  },
} as const

export const MediaCollection = {
  slug: 'media',
  upload: true,
  fields: [
    { name: 'alt', type: 'text', required: true },
    { name: 'credit', type: 'text', required: true },
  ],
  hooks: {
    beforeValidate: ['rejectEmptyAlt', 'requireCredit'],
  },
} as const

export const CategoriesCollection = {
  slug: 'categories',
  admin: { useAsTitle: 'nameNe' },
  fields: [
    { name: 'nameNe', type: 'text', required: true },
    { name: 'nameEn', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'descriptionNe', type: 'textarea' },
    { name: 'descriptionEn', type: 'textarea' },
  ],
} as const

export const AuthorsCollection = {
  slug: 'authors',
  admin: { useAsTitle: 'nameNe' },
  fields: [
    { name: 'nameNe', type: 'text', required: true },
    { name: 'nameEn', type: 'text' },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'bioNe', type: 'textarea' },
    { name: 'bioEn', type: 'textarea' },
  ],
} as const

export const TagsCollection = {
  slug: 'tags',
  admin: { useAsTitle: 'nameNe' },
  fields: [
    { name: 'nameNe', type: 'text', required: true },
    { name: 'nameEn', type: 'text' },
    { name: 'slug', type: 'text', required: true, unique: true },
  ],
} as const

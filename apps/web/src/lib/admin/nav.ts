/**
 * Ops desk ↔ Payload CMS deep links.
 * Content edits happen in /cms; /admin is the newsroom dashboard (Watch pattern).
 */

export const CMS_BASE = '/cms'

export function cmsCollectionUrl(collection: string, suffix = ''): string {
  const base = `${CMS_BASE}/collections/${collection}`
  return suffix ? `${base}${suffix.startsWith('/') ? suffix : `/${suffix}`}` : base
}

export function cmsArticleCreateUrl(): string {
  return cmsCollectionUrl('articles', 'create')
}

export function cmsArticleEditUrl(id: string | number): string {
  return cmsCollectionUrl('articles', String(id))
}

export type AdminNavItem = {
  label: string
  href: string
  /** When set, primary action opens Payload instead of a shadow editor. */
  cmsHref?: string
  external?: boolean
}

export type AdminNavGroup = {
  heading: string
  items: AdminNavItem[]
}

export const ADMIN_PRIMARY_NAV: AdminNavItem[] = [
  { label: 'ड्यासबोर्ड', href: '/admin' },
  { label: 'समाचार', href: '/admin/articles', cmsHref: cmsCollectionUrl('articles') },
  { label: 'सम्पादकीय कतार', href: '/admin/queue' },
  { label: 'नयाँ लेख', href: cmsArticleCreateUrl(), cmsHref: cmsArticleCreateUrl(), external: true },
]

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    heading: 'सम्पादन',
    items: [
      { label: 'मिडिया', href: '/admin/media', cmsHref: cmsCollectionUrl('media') },
      { label: 'लेखक', href: '/admin/authors', cmsHref: cmsCollectionUrl('authors') },
      { label: 'प्रयोगकर्ता', href: '/admin/users', cmsHref: cmsCollectionUrl('users') },
    ],
  },
  {
    heading: 'वर्गीकरण',
    items: [
      { label: 'विभाग', href: '/admin/categories', cmsHref: cmsCollectionUrl('categories') },
      { label: 'ट्याग', href: '/admin/tags', cmsHref: cmsCollectionUrl('tags') },
    ],
  },
  {
    heading: 'सञ्चालन',
    items: [
      { label: 'एल्गोरिदम डेस्क', href: '/admin/algorithms' },
      { label: 'लन्च चेक', href: '/admin/launch' },
      { label: 'Payload CMS', href: CMS_BASE, external: true },
    ],
  },
]

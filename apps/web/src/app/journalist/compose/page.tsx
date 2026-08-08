import {
  listDeskAuthors,
  listDeskCategories,
  listDeskMedia,
  listDeskTags,
} from '@/lib/admin/payload-desk'
import { ComposeClientPrefs } from '@/components/journalist/ComposeClientPrefs'
import type { ComposerInitial } from '@/components/journalist/ArticleComposer'
import { AdminCard } from '@/components/admin/primitives'

export const metadata = {
  title: 'New story · Journalist desk',
  robots: { index: false, follow: false },
}

export default async function JournalistComposeNewPage() {
  const [categories, authors, tags, media] = await Promise.all([
    listDeskCategories(),
    listDeskAuthors(),
    listDeskTags(),
    listDeskMedia(60),
  ])

  if (!categories.length || !authors.length) {
    return (
      <AdminCard>
        <p className="text-sm text-holiday">
          Seed categories and authors in Payload before composing (
          <code>pnpm --filter @thenagarik/web seed</code>).
        </p>
      </AdminCard>
    )
  }

  const initial: ComposerInitial = {
    titleNe: '',
    titleEn: '',
    slug: '',
    deckNe: '',
    deckEn: '',
    categoryId: categories[0].id,
    authorIds: [authors[0].id],
    tagIds: [],
    province: '',
    heroId: '',
    bodyNe: [{ type: 'paragraph', text: '' }],
    seoTitleNe: '',
    seoDescriptionNe: '',
    status: 'draft',
  }

  return (
    <div>
      <p className="text-sm font-semibold text-accent">नयाँ लेख</p>
      <h1 className="mt-1 text-3xl font-bold">Compose draft</h1>
      <p className="mt-2 max-w-[54ch] text-sm text-stone">
        Block editor matches Payload body JSON. Submit sends the story to editorial review.
      </p>
      <div className="mt-8">
        <ComposeClientPrefs
          initial={initial}
          categories={categories.map((c) => ({ id: c.id, label: c.nameNe, slug: c.slug }))}
          authors={authors.map((a) => ({ id: a.id, label: a.nameNe }))}
          tags={tags.map((t) => ({ id: t.id, label: t.nameNe }))}
          media={media.map((m) => ({
            id: m.id,
            label: m.alt || m.filename,
            url: m.url,
            alt: m.alt,
          }))}
        />
      </div>
    </div>
  )
}

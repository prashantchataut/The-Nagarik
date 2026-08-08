import { notFound } from 'next/navigation'
import {
  listDeskAuthors,
  listDeskCategories,
  listDeskMedia,
  listDeskTags,
} from '@/lib/admin/payload-desk'
import { getJournalistArticle } from '@/lib/journalist/desk'
import { requireContributorSession } from '@/lib/journalist/session'
import { ComposeClientPrefs } from '@/components/journalist/ComposeClientPrefs'
import type { ComposerInitial } from '@/components/journalist/ArticleComposer'
import type { EditorBlock } from '@/lib/journalist/schema'
import { AdminCard } from '@/components/admin/primitives'

export const metadata = {
  title: 'Edit story · Journalist desk',
  robots: { index: false, follow: false },
}

function mapBody(raw: unknown): EditorBlock[] {
  if (!Array.isArray(raw) || !raw.length) return [{ type: 'paragraph', text: '' }]
  const out: EditorBlock[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const b = item as Record<string, unknown>
    switch (b.type) {
      case 'paragraph':
      case 'heading2':
      case 'heading3':
        if (typeof b.text === 'string') out.push({ type: b.type, text: b.text })
        break
      case 'pullQuote':
        if (typeof b.text === 'string') {
          out.push({
            type: 'pullQuote',
            text: b.text,
            attribution: typeof b.attribution === 'string' ? b.attribution : undefined,
          })
        }
        break
      case 'list':
        if (Array.isArray(b.items)) {
          out.push({
            type: 'list',
            ordered: Boolean(b.ordered),
            items: b.items.filter((x): x is string => typeof x === 'string'),
          })
        }
        break
      case 'image': {
        const media = b.media
        if (media && typeof media === 'object') {
          const m = media as Record<string, unknown>
          out.push({
            type: 'image',
            media: {
              id: String(m.id ?? ''),
              url: String(m.url ?? ''),
              alt: String(m.alt ?? ''),
              credit: String(m.credit ?? ''),
              width: typeof m.width === 'number' ? m.width : undefined,
              height: typeof m.height === 'number' ? m.height : undefined,
            },
            caption: typeof b.caption === 'string' ? b.caption : undefined,
          })
        }
        break
      }
      default:
        break
    }
  }
  return out.length ? out : [{ type: 'paragraph', text: '' }]
}

function relId(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'object' && 'id' in value) {
    return String((value as { id: string | number }).id)
  }
  return ''
}

function relIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(relId).filter(Boolean)
}

export default async function JournalistComposeEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await requireContributorSession(`/journalist/compose/${id}`)
  const doc = await getJournalistArticle(session, id)
  if (!doc) notFound()

  const [categories, authors, tags, media] = await Promise.all([
    listDeskCategories(),
    listDeskAuthors(),
    listDeskTags(),
    listDeskMedia(60),
  ])

  if (!categories.length || !authors.length) {
    return (
      <AdminCard>
        <p className="text-sm text-holiday">Missing categories or authors in Payload.</p>
      </AdminCard>
    )
  }

  const initial: ComposerInitial = {
    id: String(doc.id),
    titleNe: String(doc.titleNe ?? ''),
    titleEn: typeof doc.titleEn === 'string' ? doc.titleEn : '',
    slug: String(doc.slug ?? ''),
    deckNe: String(doc.deckNe ?? ''),
    deckEn: typeof doc.deckEn === 'string' ? doc.deckEn : '',
    categoryId: relId(doc.category) || categories[0].id,
    authorIds: relIds(doc.authors).length ? relIds(doc.authors) : [authors[0].id],
    tagIds: relIds(doc.tags),
    province: typeof doc.province === 'string' ? doc.province : '',
    heroId: relId(doc.hero),
    bodyNe: mapBody(doc.bodyNe),
    seoTitleNe: typeof doc.seoTitleNe === 'string' ? doc.seoTitleNe : '',
    seoDescriptionNe: typeof doc.seoDescriptionNe === 'string' ? doc.seoDescriptionNe : '',
    status: String(doc.status ?? 'draft'),
  }

  return (
    <div>
      <p className="text-sm font-semibold text-accent">सम्पादन</p>
      <h1 className="mt-1 text-3xl font-bold">{initial.titleNe || 'Edit story'}</h1>
      <p className="mt-2 text-sm text-stone">
        Status: <strong>{initial.status}</strong>
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

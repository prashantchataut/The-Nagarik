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

export const metadata = {
  title: 'समाचार सम्पादन · पत्रकार डेस्क',
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

  const initial: ComposerInitial = {
    id: String(doc.id),
    titleNe: String(doc.titleNe ?? ''),
    titleEn: typeof doc.titleEn === 'string' ? doc.titleEn : '',
    slug: String(doc.slug ?? ''),
    deckNe: String(doc.deckNe ?? ''),
    deckEn: typeof doc.deckEn === 'string' ? doc.deckEn : '',
    categoryId: relId(doc.category) || categories[0]?.id || '',
    authorIds: relIds(doc.authors).length ? relIds(doc.authors) : authors[0] ? [authors[0].id] : [],
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
      <header className="mx-auto mb-5 max-w-[1220px]">
        <nav aria-label="Breadcrumb" className="text-xs font-semibold text-stone">पत्रकार डेस्क / सम्पादन</nav>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">Story editor</p>
            <h1 className="mt-1 max-w-[28ch] truncate text-2xl font-bold tracking-[-0.025em] sm:text-3xl">
              {initial.titleNe || 'शीर्षक नभएको ड्राफ्ट'}
            </h1>
          </div>
          <p className="text-sm font-semibold text-stone">स्थिति: {initial.status}</p>
        </div>
      </header>
      <ComposeClientPrefs
        initial={initial}
        categories={categories.map((item) => ({ id: item.id, label: item.nameNe, slug: item.slug }))}
        authors={authors.map((item) => ({ id: item.id, label: item.nameNe }))}
        tags={tags.map((item) => ({ id: item.id, label: item.nameNe }))}
        media={media.map((item) => ({
          id: item.id,
          label: item.alt || item.filename,
          url: item.url,
          alt: item.alt,
          credit: item.credit,
        }))}
      />
    </div>
  )
}

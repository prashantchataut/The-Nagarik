import {
  listDeskAuthors,
  listDeskCategories,
  listDeskMedia,
  listDeskTags,
} from '@/lib/admin/payload-desk'
import { requireContributorSession } from '@/lib/journalist/session'
import { ComposeClientPrefs } from '@/components/journalist/ComposeClientPrefs'
import type { ComposerInitial } from '@/components/journalist/ArticleComposer'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'नयाँ समाचार मस्यौदा · पत्रकार डेस्क',
  robots: { index: false, follow: false },
}

export default async function JournalistCreateStoryPage() {
  const session = await requireContributorSession('/journalist/compose')

  const [categories, authors, tags, media] = await Promise.all([
    listDeskCategories(),
    listDeskAuthors(),
    listDeskTags(),
    listDeskMedia(60),
  ])

  // Find author corresponding to logged-in user if exists, or default to first author
  const matchingAuthor = authors.find(
    (a) => a.slug === session.id || a.nameNe.toLowerCase() === (session.name ?? '').toLowerCase(),
  )
  const defaultAuthorId = matchingAuthor ? matchingAuthor.id : authors[0]?.id || ''

  const initial: ComposerInitial = {
    id: '',
    titleNe: '',
    titleEn: '',
    slug: '',
    deckNe: '',
    deckEn: '',
    categoryId: categories[0]?.id || '',
    authorIds: defaultAuthorId ? [defaultAuthorId] : [],
    tagIds: [],
    province: '',
    heroId: '',
    bodyNe: [{ type: 'paragraph', text: '' }],
    seoTitleNe: '',
    seoDescriptionNe: '',
    status: 'draft',
  }

  return (
    <div className="max-w-[1240px]">
      <header className="mb-6">
        <nav aria-label="Breadcrumb" className="text-xs font-semibold text-stone">
          पत्रकार डेस्क / नयाँ समाचार मस्यौदा
        </nav>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-accent">
              नयाँ समाचार सिर्जना
            </p>
            <h1 className="mt-1 text-2xl font-black text-ink sm:text-3xl">
              Create New Article Draft
            </h1>
          </div>
          <span className="rounded-full bg-paper-elevated border border-line px-3 py-1 text-xs font-bold text-stone">
            मस्यौदा (New Draft)
          </span>
        </div>
      </header>

      <ComposeClientPrefs
        initial={initial}
        categories={categories.map((item) => ({
          id: item.id,
          label: item.nameNe,
          slug: item.slug,
        }))}
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

import { buildSearchIndex } from '@thenagarik/algorithms'
import { localizeBody, localizeDeck, localizeTitle } from '@thenagarik/content'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getContent } from '@/lib/content'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'
import { recordEvent } from '@/lib/engagement'

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { locale: raw } = await params
  const { q = '' } = await searchParams
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)
  const content = getContent()
  const articles = await content.listPublishedArticles({ locale })
  const categories = await content.listCategories()
  const authors = await content.listAuthors()

  const docs = await Promise.all(
    articles.map(async (a) => {
      const cat = categories.find((c) => c.id === a.categoryId)
      const author = authors.find((x) => x.id === a.authorIds[0])
      const body = localizeBody(a, locale)
        .map((b) => ('text' in b ? b.text : ''))
        .join(' ')
      return {
        id: a.id,
        title: localizeTitle(a, locale),
        deck: localizeDeck(a, locale),
        category: locale === 'en' ? cat?.nameEn ?? '' : cat?.nameNe ?? '',
        author: author ? (locale === 'en' && author.nameEn ? author.nameEn : author.nameNe) : '',
        body,
      }
    }),
  )

  const index = buildSearchIndex(docs)
  const results = q.trim() ? index.search(q.trim(), 20) : []

  if (q.trim()) {
    // Fire-and-forget search event only when analytics cookie present is checked client-side ideally;
    // server records only if explicitly consented via query flag in future. Skip inventing.
    void recordEvent
  }

  const byId = new Map(articles.map((a) => [a.id, a]))

  return (
    <div className="mx-auto max-w-[720px] px-4 py-12 md:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">{dict.search}</h1>
      <form className="mt-6">
        <label className="block text-sm text-stone" htmlFor="q">
          {dict.searchPlaceholder}
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          className="mt-2 w-full rounded-[var(--radius-control)] border border-line bg-paper-elevated px-3 py-3 text-ink outline-none focus:border-accent"
          placeholder={dict.searchPlaceholder}
        />
      </form>
      <div className="mt-10 space-y-6">
        {q && !results.length ? <p className="text-stone">{dict.empty}</p> : null}
        {results.map((r) => {
          const article = byId.get(r.id)
          if (!article) return null
          const cat = categories.find((c) => c.id === article.categoryId)
          return (
            <div key={r.id} className="border-t border-line pt-4">
              <Link
                href={`/${locale}/${cat?.slug}/${article.slug}`}
                className="font-[family-name:var(--font-display)] text-2xl"
              >
                {r.doc.title}
              </Link>
              <p className="mt-2 text-sm text-stone">{r.doc.deck}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

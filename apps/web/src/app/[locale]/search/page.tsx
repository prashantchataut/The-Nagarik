import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { buildSearchIndex } from '@thenagarik/algorithms'
import { localizeBody, localizeDeck, localizeTitle } from '@thenagarik/content'
import { getContent } from '@/lib/content'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

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
  const byId = new Map(articles.map((a) => [a.id, a]))
  const cards = await Promise.all(articles.map((a) => content.toStoryCard(a, locale)))
  const cardById = new Map(cards.map((c) => [c.id, c]))
  const topCats = categories.slice(0, 5)

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 md:px-6 md:py-10">
      <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl">{dict.search}</h1>
      <form className="mt-5" role="search">
        <label className="block text-sm text-stone" htmlFor="q">
          {dict.searchPlaceholder}
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          autoFocus
          className="mt-2 w-full rounded-[var(--radius-control)] border border-line bg-paper-elevated px-3 py-3 text-ink outline-none focus:border-accent"
          placeholder={dict.searchPlaceholder}
        />
      </form>
      {!q ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {topCats.map((cat) => (
            <Link
              key={cat.id}
              href={`/${locale}/${cat.slug}`}
              className="rounded-[var(--radius-control)] border border-line px-2.5 py-1 text-xs text-stone hover:border-accent hover:text-ink"
            >
              {locale === 'en' ? cat.nameEn : cat.nameNe}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-8">
        {q.trim() ? (
          <p className="mb-4 text-sm text-stone">
            {dict.searchResults}: {results.length}
          </p>
        ) : null}
        {q && !results.length ? <p className="text-stone">{dict.empty}</p> : null}
        {!q ? (
          <p className="text-sm text-stone">
            {dict.searchPlaceholder}
          </p>
        ) : null}
        <ul>
          {results.map((r) => {
            const article = byId.get(r.id)
            const card = cardById.get(r.id)
            if (!article || !card) return null
            const cat = categories.find((c) => c.id === article.categoryId)
            const href = `/${locale}/${cat?.slug}/${article.slug}`
            return (
              <li key={r.id} className="border-t border-line">
                <Link href={href} className="grid gap-3 py-4 sm:grid-cols-[7rem_1fr] sm:gap-5">
                  <span className="relative aspect-[4/3] overflow-hidden bg-line">
                    {card.hero ? (
                      <Image src={card.hero.url} alt={card.hero.alt} fill sizes="112px" className="object-cover" />
                    ) : null}
                  </span>
                  <span>
                    <span className="text-xs uppercase tracking-[0.08em] text-stone">
                      {r.doc.category}
                    </span>
                    <span className="mt-1 block font-[family-name:var(--font-display)] text-xl leading-snug tracking-[-0.02em]">
                      {r.doc.title}
                    </span>
                    <span className="mt-2 block line-clamp-2 text-sm text-stone">{r.doc.deck}</span>
                    <span className="mt-2 block text-xs text-stone">
                      {r.doc.author}
                      <span className="mx-2 text-line">/</span>
                      {card.readTimeMinutes} {dict.minutesRead}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

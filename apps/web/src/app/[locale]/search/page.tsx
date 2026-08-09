import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr'
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
  const [articles, categories, authors] = await Promise.all([
    content.listPublishedArticles({ locale }),
    content.listCategories(),
    content.listAuthors(),
  ])

  const docs = articles.map((article) => {
    const category = categories.find((item) => item.id === article.categoryId)
    const author = authors.find((item) => item.id === article.authorIds[0])
    return {
      id: article.id,
      title: localizeTitle(article, locale),
      deck: localizeDeck(article, locale),
      category: locale === 'en' ? category?.nameEn ?? '' : category?.nameNe ?? '',
      author: author ? (locale === 'en' && author.nameEn ? author.nameEn : author.nameNe) : '',
      body: localizeBody(article, locale)
        .map((block) => ('text' in block ? block.text : ''))
        .join(' '),
    }
  })

  const query = q.trim()
  const index = buildSearchIndex(docs)
  const results = query ? index.search(query, 30) : []
  const byId = new Map(articles.map((article) => [article.id, article]))
  const cards = await Promise.all(articles.map((article) => content.toStoryCard(article, locale)))
  const cardById = new Map(cards.map((card) => [card.id, card]))
  const currentStories = cards.slice(0, 8)
  const sectionLinks = categories.slice(0, 8)

  const copy =
    locale === 'ne'
      ? {
          kicker: 'समाचार अभिलेख',
          title: 'खोज',
          helper: 'शीर्षक, विषय, लेखक वा समाचारभित्रको शब्दबाट खोज्नुहोस्।',
          button: 'खोज्नुहोस्',
          browse: 'समाचार खण्डहरू',
          recent: 'अहिलेका समाचार',
          noResults: 'यो खोजसँग मिल्ने समाचार भेटिएन।',
          noResultsHelp: 'हिज्जे छोट्याएर वा फरक शब्द प्रयोग गरेर फेरि खोज्नुहोस्।',
          resultFor: 'खोज नतिजा',
        }
      : {
          kicker: 'News archive',
          title: 'Search',
          helper: 'Search by headline, topic, author, or words inside a story.',
          button: 'Search',
          browse: 'Browse sections',
          recent: 'Current stories',
          noResults: 'No stories matched this search.',
          noResultsHelp: 'Try a shorter phrase, different spelling, or another topic.',
          resultFor: 'Search results',
        }

  return (
    <main className="mx-auto max-w-[1240px] px-4 py-8 md:px-6 md:py-12">
      <header className="max-w-[760px]">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">{copy.kicker}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-0.035em] text-ink md:text-5xl">{copy.title}</h1>
        <p className="mt-3 max-w-[58ch] text-base leading-relaxed text-stone">{copy.helper}</p>
      </header>

      <form className="mt-7 max-w-[820px]" role="search">
        <label className="sr-only" htmlFor="q">
          {dict.searchPlaceholder}
        </label>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <div className="relative">
            <MagnifyingGlass
              aria-hidden="true"
              size={20}
              weight="bold"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone"
            />
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={q}
              autoFocus
              className="h-12 w-full rounded-[var(--radius-control)] border border-line bg-field pl-11 pr-4 text-base text-ink outline-none placeholder:text-stone focus:border-accent"
              placeholder={dict.searchPlaceholder}
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center rounded-[var(--radius-control)] bg-accent px-5 text-sm font-bold text-accent-fg hover:opacity-90"
          >
            {copy.button}
          </button>
        </div>
      </form>

      {!query ? (
        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-14">
          <section>
            <div className="flex items-end justify-between border-b border-line pb-3">
              <h2 className="text-2xl font-bold tracking-[-0.025em] text-ink">{copy.recent}</h2>
              <Link href={`/${locale}/latest`} className="text-sm font-semibold text-accent hover:underline">
                {dict.seeAll}
              </Link>
            </div>
            <div className="mt-5 grid gap-x-5 gap-y-7 sm:grid-cols-2">
              {currentStories.map((story) => (
                <Link
                  key={story.id}
                  href={`/${locale}/${story.categorySlug}/${story.slug}`}
                  className="group border-b border-line pb-5"
                >
                  {story.hero ? (
                    <span className="editorial-image relative block aspect-[16/9] overflow-hidden bg-paper-elevated">
                      <Image src={story.hero.url} alt={story.hero.alt} fill sizes="(min-width:640px) 360px, 100vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.018]" />
                    </span>
                  ) : null}
                  <span className="mt-3 block text-xs font-semibold text-stone">
                    {story.authorNames.join(', ')}
                    {story.publishedAt ? ` · ${new Intl.DateTimeFormat(locale === 'ne' ? 'ne-NP' : 'en-NP', { dateStyle: 'medium' }).format(new Date(story.publishedAt))}` : ''}
                  </span>
                  <span className="mt-1.5 block text-xl font-bold leading-[1.42] tracking-[-0.018em] text-ink group-hover:text-accent">
                    {story.title}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <aside className="lg:border-l lg:border-line lg:pl-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-stone">{copy.browse}</h2>
            <nav className="mt-3 divide-y divide-line" aria-label={dict.categories}>
              {sectionLinks.map((category) => (
                <Link
                  key={category.id}
                  href={`/${locale}/${category.slug}`}
                  className="flex min-h-11 items-center justify-between py-2 text-base font-semibold text-ink hover:text-accent"
                >
                  <span>{locale === 'en' ? category.nameEn : category.nameNe}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      ) : (
        <section className="mt-10 max-w-[900px]">
          <div className="border-b border-line pb-3">
            <p className="text-sm font-semibold text-stone">{copy.resultFor}</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-2xl font-bold tracking-[-0.025em] text-ink">“{query}”</h2>
              <span className="text-sm text-stone">
                {results.length} {dict.searchResults.toLowerCase()}
              </span>
            </div>
          </div>

          {!results.length ? (
            <div className="py-10">
              <h3 className="text-xl font-bold text-ink">{copy.noResults}</h3>
              <p className="mt-2 max-w-[52ch] leading-relaxed text-stone">{copy.noResultsHelp}</p>
              <div className="mt-7 border-t border-line pt-6">
                <h3 className="text-base font-bold text-ink">{copy.browse}</h3>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                  {sectionLinks.map((category) => (
                    <Link key={category.id} href={`/${locale}/${category.slug}`} className="font-semibold text-accent hover:underline">
                      {locale === 'en' ? category.nameEn : category.nameNe}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {results.map((result) => {
                const article = byId.get(result.id)
                const card = cardById.get(result.id)
                if (!article || !card) return null
                const category = categories.find((item) => item.id === article.categoryId)
                if (!category) return null

                return (
                  <li key={result.id}>
                    <Link
                      href={`/${locale}/${category.slug}/${article.slug}`}
                      className={`grid gap-4 py-5 hover:text-accent ${card.hero ? 'sm:grid-cols-[9rem_1fr] sm:gap-5' : ''}`}
                    >
                      {card.hero ? (
                        <span className="relative aspect-[4/3] overflow-hidden bg-paper-elevated">
                          <Image src={card.hero.url} alt={card.hero.alt} fill sizes="144px" className="object-cover" />
                        </span>
                      ) : null}
                      <span className="min-w-0">
                        <span className="text-xs font-bold text-accent">{result.doc.category}</span>
                        <span className="mt-1 block text-xl font-bold leading-[1.42] tracking-[-0.02em] text-ink md:text-2xl">
                          {result.doc.title}
                        </span>
                        {result.doc.deck ? (
                          <span className="mt-2 block line-clamp-2 text-sm leading-relaxed text-stone">{result.doc.deck}</span>
                        ) : null}
                        <span className="mt-3 block text-xs font-medium text-stone">
                          {result.doc.author}
                          {result.doc.author ? ' · ' : ''}
                          {card.readTimeMinutes} {dict.minutesRead}
                        </span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}
    </main>
  )
}

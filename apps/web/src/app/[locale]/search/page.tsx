import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MagnifyingGlass, Clock, CaretRight } from '@phosphor-icons/react/dist/ssr'
import { buildSearchIndex } from '@thenagarik/algorithms'
import { localizeBody, localizeDeck, localizeTitle } from '@thenagarik/content'
import { getContent, siteUrl } from '@/lib/content'
import { dbSearchAvailable, searchArticlesDb, type SearchHit } from '@/lib/search-db'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'
import { CategoryIcon } from '@/components/CategoryIcon'
import { SearchAutocomplete } from '@/components/search/SearchAutocomplete'
import { RelativeTime } from '@/components/RelativeTime'

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string }>
}): Promise<Metadata> {
  const { locale: raw } = await params
  const { q = '' } = await searchParams
  if (!isLocale(raw)) return {}
  const locale = raw as AppLocale
  const title = q.trim()
    ? `${q.trim()} - खोज | The Nagarik`
    : `${locale === 'ne' ? 'समाचार खोज' : 'Search News'} | The Nagarik`

  return {
    title,
    alternates: {
      canonical: siteUrl(`/${locale}/search`),
    },
  }
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string; category?: string }>
}) {
  const { locale: raw } = await params
  const { q = '', category: selectedCat = '' } = await searchParams
  if (!isLocale(raw)) notFound()

  const locale = raw as AppLocale
  const dict = getDictionary(locale)
  const content = getContent()
  const [articles, categories, authors] = await Promise.all([
    content.listPublishedArticles({ locale }),
    content.listCategories(),
    content.listAuthors(),
  ])

  const query = q.trim()

  /**
   * Search strategy:
   * - Payload connected: DB-side ILIKE search (bounded, no body hydration).
   * - Facade/dev: in-memory index over fixtures (small by definition).
   */
  let hits: SearchHit[] = []
  if (query) {
    if (dbSearchAvailable()) {
      hits = await searchArticlesDb(query, locale, {
        categorySlug: selectedCat || undefined,
      })
    } else {
      const docs = articles.map((article) => {
        const category = categories.find((item) => item.id === article.categoryId)
        const author = authors.find((item) => item.id === article.authorIds[0])
        return {
          id: article.id,
          title: localizeTitle(article, locale),
          deck: localizeDeck(article, locale),
          category: locale === 'en' ? category?.nameEn ?? '' : category?.nameNe ?? '',
          categorySlug: category?.slug ?? '',
          author: author ? (locale === 'en' && author.nameEn ? author.nameEn : author.nameNe) : '',
          body: localizeBody(article, locale)
            .map((block) => ('text' in block ? block.text : ''))
            .join(' '),
        }
      })
      const index = buildSearchIndex(docs)
      let results = index.search(query, 40)
      const byIdLocal = new Map(articles.map((article) => [article.id, article]))
      const targetCategory = selectedCat
        ? categories.find((c) => c.slug === selectedCat)
        : undefined
      if (targetCategory) {
        results = results.filter((r) => byIdLocal.get(r.id)?.categoryId === targetCategory.id)
      }
      const hitCards = await Promise.all(
        results.map(async (r) => {
          const article = byIdLocal.get(r.id)
          return article ? content.toStoryCard(article, locale) : null
        }),
      )
      hits = results.map((r, i) => {
        const article = byIdLocal.get(r.id)
        const card = hitCards[i]
        const category = categories.find((c) => c.id === article?.categoryId)
        return {
          id: r.id,
          slug: article?.slug ?? '',
          title: r.doc.title,
          deck: r.doc.deck,
          categorySlug: category?.slug ?? '',
          categoryLabel: r.doc.category,
          authorName: r.doc.author,
          publishedAt: article?.publishedAt ?? null,
          heroUrl: card?.hero?.url ?? null,
          heroAlt: card?.hero?.alt ?? '',
        }
      })
    }
  }

  // Empty-query state: only hydrate the six featured cards, never the archive.
  const currentStories = await Promise.all(
    articles.slice(0, 6).map((article) => content.toStoryCard(article, locale)),
  )

  const isNe = locale === 'ne'
  const copy = isNe
    ? {
        kicker: 'समाचार खोज तथा अभिलेख',
        title: 'समाचार खोज्नुहोस्',
        helper: 'शीर्षक, मुख्य घटना, विषय, लेखक वा समाचारभित्रका शब्दबाट छिटो खोज्नुहोस्।',
        button: 'खोज्नुहोस्',
        browse: 'प्रमुख समाचार विभागहरू',
        recent: 'ताजा मुख्य समाचार',
        noResults: 'यो खोजसँग मिल्ने कुनै समाचार फेला परेन।',
        noResultsHelp: 'हिज्जे छोट्याएर वा फरक शब्द प्रयोग गरी पुनः खोज्नुहोस्।',
        resultFor: 'खोज नतिजा',
        allCategories: 'सबै विभाग',
      }
    : {
        kicker: 'News search & archive',
        title: 'Search the News',
        helper: 'Search quickly by headline, topic, reporter byline, or words inside stories.',
        button: 'Search',
        browse: 'Browse Sections',
        recent: 'Current top stories',
        noResults: 'No stories matched this search query.',
        noResultsHelp: 'Try a broader keyword, different spelling, or another topic.',
        resultFor: 'Search results for',
        allCategories: 'All Sections',
      }

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-8 md:px-6 md:py-12">
      {/* Masthead */}
      <header className="max-w-[760px]">
        <p className="text-xs font-bold uppercase tracking-wider text-accent">
          {copy.kicker}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-ink md:text-5xl">
          {copy.title}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-stone md:text-lg">
          {copy.helper}
        </p>
      </header>

      {/* Search Bar with algorithm-backed suggestions */}
      <div className="mt-8 max-w-[840px]" role="search">
        <label className="sr-only" htmlFor="q">
          {dict.searchPlaceholder}
        </label>
        <SearchAutocomplete
          locale={locale}
          inputId="q"
          size="lg"
          defaultValue={q}
          placeholder={dict.searchPlaceholder}
          submitLabel={copy.button}
        />

        {/* Quick Category Filter Pills */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <Link
            href={`/${locale}/search?q=${encodeURIComponent(query)}`}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
              !selectedCat
                ? 'accent-solid'
                : 'bg-paper-elevated border border-line text-stone hover:border-accent hover:text-accent'
            }`}
          >
            {copy.allCategories}
          </Link>
          {categories.map((cat) => {
            const isCatActive = selectedCat === cat.slug
            return (
              <Link
                key={cat.id}
                href={`/${locale}/search?q=${encodeURIComponent(query)}&category=${cat.slug}`}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                  isCatActive
                    ? 'accent-solid'
                    : 'bg-paper-elevated border border-line text-stone hover:border-accent hover:text-accent'
                }`}
              >
                <CategoryIcon slug={cat.slug} size={12} weight="bold" />
                <span>{isNe ? cat.nameNe : cat.nameEn}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Results View */}
      {query ? (
        <section className="mt-10" aria-label={copy.resultFor}>
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-accent pb-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-xl font-black text-ink md:text-2xl">
                {copy.resultFor} &ldquo;{query}&rdquo;
              </h2>
              {selectedCat ? (
                <span className="text-xs font-bold text-accent capitalize">
                  ({selectedCat})
                </span>
              ) : null}
            </div>
            <span className="rounded-full bg-paper-elevated border border-line px-3 py-0.5 text-xs font-bold text-stone">
              {hits.length} {dict.searchResults}
            </span>
          </div>

          {hits.length ? (
            <div className="mt-6 divide-y divide-line">
              {hits.map((hit) => (
                <article key={hit.id} className="py-5 first:pt-2 group">
                  <Link
                    href={`/${locale}/${hit.categorySlug}/${hit.slug}`}
                    className={`grid gap-4 ${hit.heroUrl ? 'sm:grid-cols-[10rem_1fr] sm:items-center sm:gap-6' : ''}`}
                  >
                    {hit.heroUrl ? (
                      <div className="editorial-image relative aspect-[16/10] rounded-[var(--radius-control)] overflow-hidden shadow-sm">
                        <Image
                          src={hit.heroUrl}
                          alt={hit.heroAlt || hit.title}
                          fill
                          sizes="160px"
                          className="object-cover"
                        />
                      </div>
                    ) : null}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs font-bold text-accent">
                        <CategoryIcon slug={hit.categorySlug} size={13} weight="bold" />
                        <span>{hit.categoryLabel}</span>
                      </div>

                      <h3 className="mt-1.5 text-xl font-bold leading-snug tracking-[-0.018em] text-ink group-hover:text-accent transition-colors md:text-2xl">
                        {hit.title}
                      </h3>

                      {hit.deck ? (
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone">
                          {hit.deck}
                        </p>
                      ) : null}

                      <div className="mt-3 flex items-center gap-3 text-xs font-medium text-stone">
                        {hit.authorName ? (
                          <span className="font-semibold text-ink">{hit.authorName}</span>
                        ) : null}
                        {hit.publishedAt ? (
                          <>
                            <span>·</span>
                            <RelativeTime iso={hit.publishedAt} locale={locale} />
                          </>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-[var(--radius-panel)] border border-line bg-paper-elevated p-12 text-center">
              <p className="text-lg font-bold text-ink">{copy.noResults}</p>
              <p className="mt-2 text-xs text-stone max-w-[48ch] mx-auto leading-relaxed">
                {copy.noResultsHelp}
              </p>
            </div>
          )}
        </section>
      ) : (
        /* Empty Query State: Show Recent Stories & Category Hubs */
        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Recent Stories (8 cols) */}
          <section className="lg:col-span-8">
            <div className="flex items-center justify-between border-b-2 border-accent pb-3 mb-6">
              <h2 className="text-xl font-black text-ink">{copy.recent}</h2>
              <Link href={`/${locale}/latest`} className="text-xs font-bold text-accent hover:underline">
                {dict.seeAll} →
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {currentStories.map((story) => (
                <article key={story.id} className="surface-card flex flex-col justify-between overflow-hidden p-4 group">
                  <div>
                    {story.hero ? (
                      <Link
                        href={`/${locale}/${story.categorySlug}/${story.slug}`}
                        className="editorial-image relative block aspect-[16/10] rounded-[var(--radius-control)] mb-3 overflow-hidden"
                      >
                        <Image
                          src={story.hero.url}
                          alt={story.hero.alt || story.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 360px"
                          className="object-cover"
                        />
                      </Link>
                    ) : null}
                    <h3 className="text-base font-bold leading-snug tracking-[-0.015em] text-ink group-hover:text-accent transition-colors">
                      <Link href={`/${locale}/${story.categorySlug}/${story.slug}`}>
                        {story.title}
                      </Link>
                    </h3>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-2 text-[0.72rem] font-semibold text-stone">
                    <span className="capitalize text-accent font-bold">{story.categorySlug}</span>
                    <RelativeTime iso={story.publishedAt} locale={locale} />
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Browse Categories (4 cols) */}
          <aside className="lg:col-span-4 lg:border-l lg:border-line lg:pl-8">
            <div className="border-b-2 border-accent pb-3 mb-6">
              <h2 className="text-base font-black text-ink uppercase tracking-wide">
                {copy.browse}
              </h2>
            </div>

            <nav className="divide-y divide-line" aria-label={dict.categories}>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/${locale}/${category.slug}`}
                  className="flex items-center justify-between py-3 text-sm font-bold text-ink hover:text-accent group"
                >
                  <div className="flex items-center gap-2.5">
                    <CategoryIcon slug={category.slug} size={16} weight="bold" />
                    <span>{isNe ? category.nameNe : category.nameEn}</span>
                  </div>
                  <CaretRight
                    size={14}
                    weight="bold"
                    className="text-stone group-hover:text-accent group-hover:translate-x-1 transition-all"
                  />
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </main>
  )
}

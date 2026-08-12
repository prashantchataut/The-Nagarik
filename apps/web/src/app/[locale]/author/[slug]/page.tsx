import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { CheckCircle, Newspaper, ArrowLeft } from '@phosphor-icons/react/dist/ssr'
import { StoryCard } from '@/components/news/StoryCard'
import { getContent, siteUrl } from '@/lib/content'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale: raw, slug } = await params
  if (!isLocale(raw)) return {}
  const locale = raw as AppLocale
  const content = getContent()
  const authors = await content.listAuthors()
  const author = authors.find((a) => a.slug === slug)
  if (!author) return {}

  const name = locale === 'en' && author.nameEn ? author.nameEn : author.nameNe
  const bio = locale === 'en' ? author.bioEn || author.bioNe : author.bioNe

  return {
    title: `${name} | The Nagarik`,
    description: bio,
    alternates: {
      canonical: siteUrl(`/${locale}/author/${slug}`),
    },
    openGraph: {
      title: `${name} | The Nagarik`,
      description: bio,
      type: 'profile',
    },
  }
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: raw, slug } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)
  const content = getContent()
  const [authors, articles, categories] = await Promise.all([
    content.listAuthors(),
    content.listPublishedArticles({ locale }),
    content.listCategories(),
  ])

  const author = authors.find((item) => item.slug === slug)
  if (!author) notFound()

  const name = locale === 'en' && author.nameEn ? author.nameEn : author.nameNe
  const bio = locale === 'en' ? author.bioEn || author.bioNe : author.bioNe
  const authored = articles.filter((article) => article.authorIds.includes(author.id))
  const cards = await Promise.all(authored.map((article) => content.toStoryCard(article, locale)))

  const isNe = locale === 'ne'
  const copy = isNe
    ? {
        kicker: 'लेखक प्रोफाइल',
        stories: 'प्रकाशित समाचार तथा विचार',
        empty: 'यस लेखकका कुनै समाचार हाल उपलब्ध छैनन्।',
        all: 'सबै लेखकहरू हेर्नुहोस्',
        verified: 'प्रमाणित पत्रकार',
      }
    : {
        kicker: 'Author profile',
        stories: 'Published journalism & analysis',
        empty: 'No published articles from this author yet.',
        all: 'All authors directory',
        verified: 'Verified journalist',
      }

  // Get distinct categories this author writes for
  const authorCategorySlugs = Array.from(new Set(authored.map((a) => {
    const cat = categories.find((c) => c.id === a.categoryId)
    return cat ? (isNe ? cat.nameNe : cat.nameEn) : null
  }).filter(Boolean)))

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-8 md:px-6 md:py-12">
      {/* Back link */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link
          href={`/${locale}/authors`}
          className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
        >
          <ArrowLeft size={14} weight="bold" />
          <span>{copy.all}</span>
        </Link>
      </nav>

      {/* Author Profile Header Card */}
      <header className="surface-card p-6 md:p-8 mb-10 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <span className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-accent-fg font-black text-2xl shadow-md">
            {author.avatarUrl ? (
              <Image
                src={author.avatarUrl}
                alt={name}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              name.slice(0, 1)
            )}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-accent">
                {copy.kicker}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-success-muted px-2.5 py-0.5 text-[0.65rem] font-bold text-success">
                <CheckCircle size={12} weight="bold" />
                <span>{copy.verified}</span>
              </span>
            </div>

            <h1 className="mt-1 text-3xl font-black tracking-tight text-ink md:text-4xl">
              {name}
            </h1>

            {bio ? (
              <p className="mt-2.5 max-w-[68ch] text-sm leading-relaxed text-stone md:text-base">
                {bio}
              </p>
            ) : null}

            {author.beats?.length ? (
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Beats">
                {author.beats.map((beat) => (
                  <li
                    key={beat}
                    className="rounded-full bg-accent-muted px-2.5 py-1 text-[0.7rem] font-bold text-accent"
                  >
                    {beat}
                  </li>
                ))}
              </ul>
            ) : null}

            {/* Author Stats Bar */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-stone border-t border-line/60 pt-3">
              <div className="flex items-center gap-1.5 font-bold text-ink">
                <Newspaper size={15} weight="bold" className="text-accent" />
                <span>
                  {cards.length} {dict.stories}
                </span>
              </div>

              {authorCategorySlugs.length ? (
                <>
                  <span>·</span>
                  <div className="flex flex-wrap gap-1.5">
                    {authorCategorySlugs.map((catName) => (
                      <span
                        key={catName}
                        className="rounded-full bg-paper-elevated border border-line px-2 py-0.5 text-[0.7rem] text-stone"
                      >
                        {catName}
                      </span>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Published Stories Section */}
      <section aria-label={copy.stories}>
        <div className="mb-6 flex items-center justify-between border-b-2 border-accent pb-3">
          <h2 className="text-xl font-black tracking-tight text-ink md:text-2xl">
            {copy.stories}
          </h2>
          <span className="rounded-full bg-paper-elevated border border-line px-3 py-1 text-xs font-bold text-stone">
            {cards.length} {dict.stories}
          </span>
        </div>

        {cards.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                locale={locale}
                dict={dict}
                aspect="card"
                size="md"
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--radius-panel)] border border-line bg-paper-elevated p-12 text-center">
            <p className="text-sm font-bold text-ink">{copy.empty}</p>
          </div>
        )}
      </section>
    </main>
  )
}

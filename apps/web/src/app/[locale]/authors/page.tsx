import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { CaretRight, Newspaper, Users } from '@phosphor-icons/react/dist/ssr'
import { getContent, siteUrl } from '@/lib/content'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: raw } = await params
  if (!isLocale(raw)) return {}
  const locale = raw as AppLocale
  const title = locale === 'ne' ? 'हाम्रा लेखक तथा पत्रकारहरू' : 'Our Authors & Journalists'
  const description =
    locale === 'ne'
      ? 'द नागरिकका पत्रकार, स्तम्भकार र लेखकहरूको विवरण तथा प्रकाशित सामग्री।'
      : 'Profiles and published stories from The Nagarik writers and correspondents.'

  return {
    title: `${title} | The Nagarik`,
    description,
    alternates: {
      canonical: siteUrl(`/${locale}/authors`),
    },
  }
}

export default async function AuthorsDirectoryPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)
  const content = getContent()
  const [authors, articles] = await Promise.all([
    content.listAuthors(),
    content.listPublishedArticles({ locale }),
  ])

  const rows = authors
    .map((author) => ({
      author,
      count: articles.filter((article) => article.authorIds.includes(author.id)).length,
    }))
    .sort((a, b) => b.count - a.count || a.author.nameNe.localeCompare(b.author.nameNe, 'ne'))

  const isNe = locale === 'ne'
  const copy = isNe
    ? {
        kicker: 'समाचारकक्ष टिम',
        title: 'लेखक तथा पत्रकारहरू',
        intro: 'नागरिक सरोकार र निष्पक्ष पत्रकारिताका लागि अग्रपङ्क्तिमा खटिएका हाम्रा लेखक, संवाददाता र विश्लेषकहरू।',
        stories: 'प्रकाशित समाचार',
        viewProfile: 'प्रोफाइल र लेखहरू',
        empty: 'कुनै लेखक प्रोफाइल उपलब्ध छैन।',
      }
    : {
        kicker: 'Newsroom team',
        title: 'Our Writers & Journalists',
        intro: 'The correspondents, analysts, and reporters behind our civic bylines and investigations.',
        stories: 'published stories',
        viewProfile: 'View profile & work',
        empty: 'No author profiles available yet.',
      }

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-8 md:px-6 md:py-12">
      {/* Masthead */}
      <header className="border-b-2 border-accent pb-6 mb-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-[760px]">
            <p className="text-xs font-bold uppercase tracking-wider text-accent">
              {copy.kicker}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-ink md:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-stone md:text-lg">
              {copy.intro}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-paper-elevated border border-line px-3.5 py-1.5 text-xs font-bold text-stone">
            <Users size={16} weight="bold" className="text-accent" />
            <span>
              {authors.length} {dict.authors}
            </span>
          </div>
        </div>
      </header>

      {/* Authors Grid */}
      {rows.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ author, count }) => {
            const name = isNe ? author.nameNe : author.nameEn || author.nameNe
            const bio = isNe ? author.bioNe : author.bioEn || author.bioNe

            return (
              <Link
                key={author.id}
                href={`/${locale}/author/${author.slug}`}
                className="surface-card flex flex-col justify-between p-6 group hover:border-accent hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center gap-4">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg font-black text-xl group-hover:scale-105 transition-transform">
                      {name.slice(0, 1)}
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-xl font-bold tracking-tight text-ink group-hover:text-accent transition-colors">
                        {name}
                      </h2>
                      <p className="flex items-center gap-1 mt-0.5 text-xs font-bold text-accent">
                        <Newspaper size={13} weight="bold" />
                        <span>
                          {count} {copy.stories}
                        </span>
                      </p>
                    </div>
                  </div>

                  {bio ? (
                    <p className="mt-4 line-clamp-3 text-xs leading-relaxed text-stone">
                      {bio}
                    </p>
                  ) : null}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-line/60 pt-3 text-xs font-bold text-accent">
                  <span>{copy.viewProfile}</span>
                  <CaretRight
                    size={14}
                    weight="bold"
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="rounded-[var(--radius-panel)] border border-line bg-paper-elevated p-12 text-center">
          <p className="text-sm font-bold text-ink">{copy.empty}</p>
        </div>
      )}
    </main>
  )
}

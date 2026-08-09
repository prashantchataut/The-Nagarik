import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getContent } from '@/lib/content'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

export default async function AuthorsPage({ params }: { params: Promise<{ locale: string }> }) {
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

  const copy = locale === 'ne'
    ? {
        kicker: 'समाचारकक्ष',
        title: 'लेखक र पत्रकार',
        intro: 'बाइलाइन पछाडिका पत्रकार र लेखकहरू। प्रत्येक प्रोफाइलबाट उनीहरूको प्रकाशित काम हेर्न सकिन्छ।',
        stories: 'प्रकाशित समाचार',
        empty: 'अहिले सार्वजनिक लेखक प्रोफाइल उपलब्ध छैन।',
      }
    : {
        kicker: 'Newsroom',
        title: 'Writers and journalists',
        intro: 'The people behind our bylines. Each profile links to their published work.',
        stories: 'published stories',
        empty: 'No public writer profiles are available yet.',
      }

  return (
    <main className="mx-auto max-w-[1100px] px-4 py-10 md:px-6 md:py-14">
      <header className="max-w-[760px]">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">{copy.kicker}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-0.035em] text-ink md:text-5xl">{copy.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-stone">{copy.intro}</p>
      </header>

      {rows.length ? (
        <div className="mt-10 grid border-t border-line md:grid-cols-2 md:gap-x-10">
          {rows.map(({ author, count }) => {
            const name = locale === 'en' && author.nameEn ? author.nameEn : author.nameNe
            const bio = locale === 'en' ? author.bioEn || author.bioNe : author.bioNe
            return (
              <Link
                key={author.id}
                href={`/${locale}/author/${author.slug}`}
                className="group border-b border-line py-6"
              >
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <h2 className="text-2xl font-bold tracking-[-0.02em] text-ink group-hover:text-accent">{name}</h2>
                    {bio ? <p className="mt-2 line-clamp-3 max-w-[48ch] text-sm leading-relaxed text-stone">{bio}</p> : null}
                  </div>
                  <span className="shrink-0 text-lg text-stone" aria-hidden="true">→</span>
                </div>
                <p className="mt-4 text-xs font-semibold text-stone">{count} {copy.stories}</p>
              </Link>
            )
          })}
        </div>
      ) : (
        <p className="mt-10 border-t border-line pt-6 text-stone">{copy.empty}</p>
      )}

      <p className="mt-10 text-sm text-stone">
        <Link href={`/${locale}/about`} className="font-semibold text-accent hover:underline">← {dict.about}</Link>
      </p>
    </main>
  )
}

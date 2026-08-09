import Link from 'next/link'
import { notFound } from 'next/navigation'
import { StoryLink } from '@/components/Story'
import { getContent } from '@/lib/content'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

export default async function AuthorPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)
  const content = getContent()
  const [authors, articles] = await Promise.all([
    content.listAuthors(),
    content.listPublishedArticles({ locale }),
  ])
  const author = authors.find((item) => item.slug === slug)
  if (!author) notFound()

  const name = locale === 'en' && author.nameEn ? author.nameEn : author.nameNe
  const bio = locale === 'en' ? author.bioEn || author.bioNe : author.bioNe
  const authored = articles.filter((article) => article.authorIds.includes(author.id))
  const cards = await Promise.all(authored.map((article) => content.toStoryCard(article, locale)))
  const copy = locale === 'ne'
    ? { kicker: 'लेखक', stories: 'प्रकाशित काम', empty: 'यस लेखकका सार्वजनिक समाचार अहिले उपलब्ध छैनन्।', all: 'सबै लेखक' }
    : { kicker: 'Author', stories: 'Published work', empty: 'No public stories from this author are available yet.', all: 'All writers' }

  return (
    <main className="mx-auto max-w-[1040px] px-4 py-10 md:px-6 md:py-14">
      <header className="max-w-[760px] border-b border-line pb-8">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">{copy.kicker}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-0.035em] text-ink md:text-5xl">{name}</h1>
        {bio ? <p className="mt-4 max-w-[64ch] text-lg leading-[1.75] text-stone">{bio}</p> : null}
      </header>

      <section className="mt-9">
        <div className="flex items-baseline justify-between border-b border-line pb-3">
          <h2 className="text-2xl font-bold tracking-[-0.025em] text-ink">{copy.stories}</h2>
          <span className="text-sm font-semibold text-stone">{cards.length}</span>
        </div>
        {cards.length ? (
          <div className="divide-y divide-line">
            {cards.map((story) => <StoryLink key={story.id} story={story} locale={locale} dict={dict} />)}
          </div>
        ) : (
          <p className="py-8 text-stone">{copy.empty}</p>
        )}
      </section>

      <Link href={`/${locale}/authors`} className="mt-10 inline-flex min-h-11 items-center font-bold text-accent hover:underline">← {copy.all}</Link>
    </main>
  )
}

import { notFound } from 'next/navigation'
import { StoryLink } from '@/components/Story'
import { RelativeTime } from '@/components/RelativeTime'
import { getContent } from '@/lib/content'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

export const revalidate = 60

export default async function LatestPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)
  const content = getContent()
  const articles = await content.listPublishedArticles({ locale })
  const cards = await Promise.all(articles.map((a) => content.toStoryCard(a, locale)))
  const dayMs = 24 * 60 * 60 * 1000
  const recent = cards.filter(
    (c) => c.publishedAt && Date.now() - new Date(c.publishedAt).getTime() < dayMs,
  )
  const older = cards.filter((c) => !recent.includes(c))

  return (
    <div className="mx-auto max-w-[900px] px-4 py-6 md:px-6 md:py-8">
      <header className="border-b border-line pb-4">
        <h1 className="font-[family-name:var(--font-display)] text-2xl tracking-[-0.02em] md:text-3xl">
          {dict.latest}
        </h1>
        <p className="mt-2 text-sm text-stone">
          {recent.length ? `${dict.hours24}: ${recent.length}` : dict.empty}
        </p>
      </header>

      {recent.length ? (
        <section className="mt-5">
          <h2 className="text-sm font-medium text-accent">{dict.hours24}</h2>
          <div className="mt-1">
            {recent.map((s) => (
              <div key={s.id} className="relative">
                <span className="pointer-events-none absolute left-0 top-4 hidden text-[0.65rem] text-stone sm:block sm:w-16">
                  <RelativeTime iso={s.publishedAt} locale={locale} />
                </span>
                <div className="sm:pl-20">
                  <StoryLink locale={locale} story={s} dict={dict} />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {older.length ? (
        <section className={recent.length ? 'mt-6' : 'mt-5'}>
          {recent.length ? <h2 className="text-sm font-medium text-stone">{dict.latest}</h2> : null}
          <div className={recent.length ? 'mt-1' : undefined}>
            {older.map((s) => (
              <StoryLink key={s.id} locale={locale} story={s} dict={dict} />
            ))}
          </div>
        </section>
      ) : null}

      {!cards.length ? <p className="mt-10 text-stone">{dict.empty}</p> : null}
    </div>
  )
}

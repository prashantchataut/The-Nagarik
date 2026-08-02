import { notFound } from 'next/navigation'
import { StoryLink } from '@/components/Story'
import { getContent } from '@/lib/content'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

export default async function LatestPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)
  const content = getContent()
  const articles = await content.listPublishedArticles({ locale })
  const cards = await Promise.all(articles.map((a) => content.toStoryCard(a, locale)))

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-12 md:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">{dict.latest}</h1>
      <div className="mt-8">
        {cards.map((s) => (
          <StoryLink key={s.id} locale={locale} story={s} />
        ))}
      </div>
    </div>
  )
}

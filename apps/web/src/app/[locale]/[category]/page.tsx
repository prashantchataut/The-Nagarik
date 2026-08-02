import { notFound } from 'next/navigation'
import { StoryLink } from '@/components/Story'
import { getContent } from '@/lib/content'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

export const revalidate = 60

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>
}) {
  const { locale: raw, category: categorySlug } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)
  const content = getContent()
  const category = await content.getCategoryBySlug(categorySlug)
  if (!category) notFound()

  // Avoid catching article routes incorrectly — article is [category]/[slug]
  const articles = await content.listPublishedArticles({ categorySlug, locale })
  const cards = await Promise.all(articles.map((a) => content.toStoryCard(a, locale)))

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-12 md:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl">
        {locale === 'en' ? category.nameEn : category.nameNe}
      </h1>
      <p className="mt-3 max-w-[65ch] text-stone">
        {locale === 'en' ? category.descriptionEn : category.descriptionNe}
      </p>
      <div className="mt-10">
        {cards.length ? cards.map((s) => <StoryLink key={s.id} locale={locale} story={s} />) : <p>{dict.empty}</p>}
      </div>
    </div>
  )
}

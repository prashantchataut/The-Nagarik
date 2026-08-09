import Link from 'next/link'
import { notFound } from 'next/navigation'
import { NepaliPatroWidget } from '@/components/NepaliPatroWidget'
import { getContent } from '@/lib/content'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

export default async function NepaliPatroPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)
  const content = getContent()
  const articles = await content.listPublishedArticles({ locale })
  const cards = await Promise.all(articles.slice(0, 6).map((article) => content.toStoryCard(article, locale)))
  const news = cards.map((card) => ({
    id: card.id,
    title: card.title,
    href: `/${locale}/${card.categorySlug}/${card.slug}`,
  }))

  return (
    <main className="mx-auto max-w-[1240px] px-4 py-8 md:px-6 md:py-12">
      <nav aria-label={dict.utilities} className="text-sm">
        <Link href={`/${locale}/utilities`} className="font-semibold text-accent hover:underline">← {dict.utilities}</Link>
      </nav>
      <header className="mt-5 max-w-[760px] border-b border-line pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">{dict.utilities}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-0.035em] text-ink md:text-5xl">{dict.nepaliPatro}</h1>
        <p className="mt-3 text-base leading-relaxed text-stone">
          {locale === 'ne'
            ? 'विक्रम संवत् पात्रो, तिथि, पर्व तथा BS ↔ AD मिति रूपान्तरण एउटै ठाउँमा।'
            : 'Bikram Sambat calendar, tithi, festivals, and BS ↔ AD date conversion in one place.'}
        </p>
      </header>
      <div className="mt-7">
        <NepaliPatroWidget locale={locale} news={news} />
      </div>
    </main>
  )
}

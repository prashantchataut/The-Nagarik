import Link from 'next/link'
import { notFound } from 'next/navigation'
import { NepaliPatroWidget } from '@/components/NepaliPatroWidget'
import { getContent } from '@/lib/content'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'
import { BRAND_NE, newsHomeHref } from '@/lib/site'

export default async function NepaliPatroPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)
  const content = getContent()
  const articles = await content.listPublishedArticles({ locale })
  const cards = await Promise.all(articles.slice(0, 6).map((a) => content.toStoryCard(a, locale)))
  const news = cards.map((c) => ({
    id: c.id,
    title: c.title,
    href: `/${locale}/${c.categorySlug}/${c.slug}`,
  }))

  return (
    <div className="min-h-[60vh] bg-paper">
      {/* Patro product chrome */}
      <div className="border-b border-line">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div>
            <p className="text-xl font-semibold tracking-[-0.02em] text-ink md:text-2xl">
              {locale === 'ne' ? 'द नागरिक पात्रो' : 'Nagarik Patro'}
            </p>
            <p className="text-xs text-stone">{dict.nepaliPatro}</p>
          </div>
          <Link
            href={newsHomeHref(locale)}
            className="rounded-[var(--radius-control)] bg-accent px-3 py-2 text-sm font-semibold text-accent-fg hover:opacity-90"
          >
            {dict.backToNews}
          </Link>
        </div>
        <div className="bg-accent text-accent-fg">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-3 px-4 py-2 text-sm md:px-6">
            <Link href={`/${locale}/utilities`} className="hover:underline">
              {dict.utilities}
            </Link>
            <span className="opacity-50">|</span>
            <Link href={`/${locale}/utilities/preeti-unicode`} className="hover:underline">
              {dict.preetiTranslator}
            </Link>
            <span className="opacity-50">|</span>
            <Link href={newsHomeHref(locale)} className="hover:underline">
              {BRAND_NE}
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1240px] px-4 py-6 md:px-6 md:py-8">
        <p className="mb-4 text-sm text-stone">
          <Link href={`/${locale}/utilities`} className="text-accent hover:underline">
            ← {dict.utilities}
          </Link>
        </p>
        <NepaliPatroWidget locale={locale} news={news} />
      </div>
    </div>
  )
}

import { notFound } from 'next/navigation'
import { SiteFooter, SiteHeader } from '@/components/Chrome'
import { MobileBottomNav } from '@/components/MobileNav'
import { ConsentBanner } from '@/components/ReaderClient'
import { FixtureBanner } from '@/components/Story'
import { getContent } from '@/lib/content'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)
  const content = getContent()
  const categories = await content.listCategories()
  const otherLocale = locale === 'ne' ? 'en' : 'ne'

  return (
    <div lang={locale}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius-control)] focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-fg"
      >
        {dict.skipToContent}
      </a>
      <FixtureBanner dict={dict} show={content.usingDevFixtures} />
      <SiteHeader
        locale={locale}
        dict={dict}
        categories={categories}
        otherLocaleHref={`/${otherLocale}`}
      />
      <main id="main" className="pb-20 lg:pb-0">
        {children}
      </main>
      <SiteFooter locale={locale} dict={dict} categories={categories} />
      <MobileBottomNav locale={locale} dict={dict} />
      <ConsentBanner dict={dict} />
    </div>
  )
}

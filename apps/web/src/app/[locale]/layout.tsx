import { notFound } from 'next/navigation'
import { SiteFooter, SiteHeader } from '@/components/Chrome'
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
      <FixtureBanner dict={dict} show={content.usingDevFixtures} />
      <SiteHeader
        locale={locale}
        dict={dict}
        categories={categories}
        otherLocaleHref={`/${otherLocale}`}
      />
      <main>{children}</main>
      <SiteFooter locale={locale} dict={dict} />
      <ConsentBanner locale={locale} />
    </div>
  )
}

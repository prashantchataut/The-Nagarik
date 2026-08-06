import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'
import { patroHref } from '@/lib/site'

export default async function UtilitiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)
  const calendarUrl = patroHref(locale)

  const tiles = [
    {
      href: calendarUrl,
      title: dict.nepaliPatro,
      body:
        locale === 'ne'
          ? 'विक्रम संवत् पात्रो, पर्व, मिति रूपान्तरण'
          : 'Bikram Sambat calendar, festivals, date converter',
      featured: true,
    },
    {
      href: `/${locale}/utilities/preeti-unicode`,
      title: dict.preetiTranslator,
      body:
        locale === 'ne'
          ? 'प्रीति बाट युनिकोड नेपाली रूपान्तरण'
          : 'Convert legacy Preeti text to Unicode Nepali',
      featured: false,
    },
    {
      href: `${calendarUrl}#converter`,
      title: dict.dateConverter,
      body: locale === 'ne' ? 'BS ↔ AD मिति परिवर्तन' : 'Convert between BS and AD',
      featured: false,
    },
    {
      href: `${calendarUrl}#holidays`,
      title: dict.publicHolidays,
      body: locale === 'ne' ? 'सार्वजनिक बिदा र पर्व सूची' : 'Public holidays and festivals',
      featured: false,
    },
    {
      href: `${calendarUrl}#rashifal`,
      title: dict.rashifal,
      body: locale === 'ne' ? 'दैनिक राशिफल (चाँडै)' : 'Daily horoscope (soon)',
      featured: false,
    },
    {
      href: `${calendarUrl}#sait`,
      title: dict.shubhaSait,
      body: locale === 'ne' ? 'शुभ साइत जानकारी (चाँडै)' : 'Auspicious timings (soon)',
      featured: false,
    },
  ]

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8 md:px-6 md:py-10">
      <header className="border-b-2 border-accent pb-5">
        <h1 className="text-3xl font-semibold tracking-[-0.03em] md:text-4xl">{dict.utilities}</h1>
        <p className="mt-2 max-w-[54ch] text-sm text-stone">
          {locale === 'ne'
            ? 'पात्रो, मिति रूपान्तरण, र दैनिक उपयोगी उपकरणहरू।'
            : 'Patro, date tools, and daily civic utilities.'}
        </p>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <Link
            key={t.href + t.title}
            href={t.href}
            className={`border p-5 transition hover:border-accent ${
              t.featured
                ? 'border-accent bg-accent text-accent-fg md:col-span-2 lg:col-span-3'
                : 'border-line bg-paper'
            }`}
          >
            <h2 className={`text-xl font-semibold ${t.featured ? 'text-accent-fg' : 'text-ink'}`}>
              {t.title}
            </h2>
            <p className={`mt-2 text-sm ${t.featured ? 'text-accent-fg/90' : 'text-stone'}`}>
              {t.body}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}

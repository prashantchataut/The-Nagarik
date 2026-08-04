import Link from 'next/link'
import { notFound } from 'next/navigation'
import { NepaliPatroWidget } from '@/components/NepaliPatroWidget'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

export default async function NepaliPatroPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 md:px-6 md:py-10">
      <p className="mb-3 text-sm">
        <Link href={`/${locale}/utilities`} className="text-accent hover:underline">
          ← {dict.utilities}
        </Link>
      </p>
      <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.03em] md:text-4xl">
        {dict.nepaliPatro}
      </h1>
      <p className="mt-2 max-w-[54ch] text-sm leading-relaxed text-stone">
        {locale === 'ne'
          ? 'काठमाडौं मिति, अनुमानित तिथि, र सूचीकृत पर्व। मन्दिर पञ्चाङ्ग सँग एक दिन फरक हुनसक्छ।'
          : 'Kathmandu date, approximate tithi, and listed festivals. Temple almanacs may differ by a day.'}
      </p>
      <div className="mt-6">
        <NepaliPatroWidget locale={locale} />
      </div>
    </div>
  )
}

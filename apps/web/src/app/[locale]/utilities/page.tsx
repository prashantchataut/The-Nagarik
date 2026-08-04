import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

export default async function UtilitiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 md:px-6 md:py-10">
      <header className="border-b border-line pb-5">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.03em] md:text-4xl">
          {dict.utilities}
        </h1>
      </header>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Link
          href={`/${locale}/utilities/nepali-patro`}
          className="rounded-[14px] border border-line bg-paper-elevated p-5 hover:border-accent"
        >
          <h2 className="font-[family-name:var(--font-display)] text-xl">{dict.nepaliPatro}</h2>
          <p className="mt-2 text-sm text-stone">Kathmandu date/time quick utility.</p>
        </Link>
        <Link
          href={`/${locale}/utilities/preeti-unicode`}
          className="rounded-[14px] border border-line bg-paper-elevated p-5 hover:border-accent"
        >
          <h2 className="font-[family-name:var(--font-display)] text-xl">{dict.preetiTranslator}</h2>
          <p className="mt-2 text-sm text-stone">Convert legacy Preeti text to Unicode Nepali.</p>
        </Link>
      </div>
    </div>
  )
}

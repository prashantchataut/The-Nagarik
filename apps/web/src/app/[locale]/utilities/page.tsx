import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PreetiConverter } from '@/components/PreetiConverter'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

export default async function PreetiUnicodePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)

  return (
    <main className="mx-auto max-w-[1040px] px-4 py-8 md:px-6 md:py-12">
      <nav aria-label={dict.utilities} className="text-sm">
        <Link href={`/${locale}/utilities`} className="font-semibold text-accent hover:underline">← {dict.utilities}</Link>
      </nav>
      <header className="mt-5 max-w-[760px] border-b border-line pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">{dict.utilities}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-0.035em] text-ink md:text-5xl">{dict.preetiTranslator}</h1>
        <p className="mt-3 text-base leading-relaxed text-stone">
          {locale === 'ne'
            ? 'पुरानो प्रीति टेक्स्टलाई युनिकोड नेपालीमा बदल्नुहोस्। प्रकाशनअघि नाम, अंक र प्राविधिक शब्द फेरि जाँच्नुहोस्।'
            : 'Convert legacy Preeti text to Unicode Nepali. Proofread names, numerals, and technical terms before publishing.'}
        </p>
      </header>
      <div className="mt-7">
        <PreetiConverter locale={locale} />
      </div>
    </main>
  )
}

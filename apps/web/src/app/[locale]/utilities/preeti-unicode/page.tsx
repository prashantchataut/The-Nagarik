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
    <div className="mx-auto max-w-[1240px] px-4 py-8 md:px-6 md:py-10">
      <p className="mb-3 text-sm">
        <Link href={`/${locale}/utilities`} className="text-accent hover:underline">
          ← {dict.utilities}
        </Link>
      </p>
      <header className="border-b-2 border-accent pb-4">
        <h1 className="text-3xl font-semibold tracking-[-0.03em] md:text-4xl">{dict.preetiTranslator}</h1>
        <p className="mt-2 max-w-[54ch] text-sm text-stone">
          {locale === 'ne'
            ? 'पुरानो प्रीति टेक्स्टलाई युनिकोड नेपालीमा बदल्नुहोस्। प्रकाशनअघि नाम र प्राविधिक शब्द जाँच्नुहोस्।'
            : 'Convert legacy Preeti text to Unicode Nepali. Proofread names and technical words before publishing.'}
        </p>
      </header>
      <div className="mt-6 max-w-[900px]">
        <PreetiConverter />
      </div>
    </div>
  )
}

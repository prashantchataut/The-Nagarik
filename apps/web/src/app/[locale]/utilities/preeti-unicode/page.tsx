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
    <div className="mx-auto max-w-[900px] px-4 py-8 md:px-6 md:py-10">
      <p className="mb-3 text-sm">
        <Link href={`/${locale}/utilities`} className="text-accent hover:underline">
          ← {dict.utilities}
        </Link>
      </p>
      <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.03em] md:text-4xl">
        {dict.preetiTranslator}
      </h1>
      <p className="mt-2 text-sm text-stone">
        Practical newsroom helper for old copy/paste text. Review output before publishing.
      </p>
      <div className="mt-6">
        <PreetiConverter />
      </div>
    </div>
  )
}

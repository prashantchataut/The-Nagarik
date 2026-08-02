import { notFound } from 'next/navigation'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)

  return (
    <div className="mx-auto max-w-[65ch] px-4 py-16 md:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">{dict.about}</h1>
      <div className="mt-6 space-y-4 text-lg leading-relaxed text-stone">
        {locale === 'ne' ? (
          <>
            <p>द नागरिक नेपालका लागि नेपाली-प्रथम द्विभाषी नागरिक समाचार पोर्टल हो।</p>
            <p>हामी मौलिक पत्रकारिता मात्र प्रकाशित गर्छौं। अंग्रेजी सामग्री मानव समीक्षापछि मात्र।</p>
          </>
        ) : (
          <>
            <p>The Nagarik is a Nepali-first bilingual civic news portal for Nepal.</p>
            <p>We publish original journalism only. English appears only after human review.</p>
          </>
        )}
      </div>
    </div>
  )
}

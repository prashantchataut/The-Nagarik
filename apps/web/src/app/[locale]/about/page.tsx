import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)

  return (
    <div className="mx-auto max-w-[65ch] px-4 py-10 md:px-6 md:py-14">
      <h1 className="border-b-2 border-accent pb-3 text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
        {dict.about}
      </h1>
      <div className="mt-6 space-y-4 text-lg leading-relaxed text-stone">
        {locale === 'ne' ? (
          <>
            <p>द नागरिक नेपालका लागि नेपाली-प्रथम द्विभाषी नागरिक समाचार पोर्टल हो।</p>
            <p>हामी मौलिक पत्रकारिता मात्र प्रकाशित गर्छौं। अंग्रेजी सामग्री मानव समीक्षापछि मात्र सार्वजनिक हुन्छ।</p>
            <p>पाठक अनुभव पहिलो: बाक्लो तर शान्त पोर्टल, इमानदार खोज र र्याङ्किङ, र पढाइका लागि स्पष्ट टाइपोग्राफी।</p>
          </>
        ) : (
          <>
            <p>The Nagarik is a Nepali-first bilingual civic news portal for Nepal.</p>
            <p>We publish original journalism only. English appears only after human review.</p>
            <p>
              Reading comes first: dense but calm portal IA, honest search and rankings, and typography built
              for finishing stories.
            </p>
          </>
        )}
      </div>
      <p className="mt-10 text-sm">
        <Link href={`/${locale}/trust`} className="text-accent hover:underline">
          {dict.trust}
        </Link>
      </p>
    </div>
  )
}

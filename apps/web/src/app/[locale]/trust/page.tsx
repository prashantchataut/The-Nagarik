import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

export default async function TrustPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)

  const sections = [
    { title: dict.trustCorrectionsTitle, body: dict.trustCorrectionsBody },
    { title: dict.trustRankingsTitle, body: dict.trustRankingsBody },
    { title: dict.trustEnglishTitle, body: dict.trustEnglishBody },
    { title: dict.trustLegalTitle, body: dict.trustLegalBody },
  ]

  return (
    <div className="mx-auto max-w-[65ch] px-4 py-10 md:px-6 md:py-14">
      <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.03em] md:text-4xl">
        {dict.trust}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-stone">
        {locale === 'ne'
          ? 'द नागरिक पाठक विश्वास पहिलो राख्छ। तलका नियमहरू कोड र सार्वजनिक पृष्ठहरूसँग मेल खान्छन्।'
          : 'The Nagarik puts reader trust first. These policies match what the code and public pages actually do.'}
      </p>

      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="font-[family-name:var(--font-display)] text-xl tracking-[-0.02em]">
              {section.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-stone">{section.body}</p>
          </section>
        ))}
      </div>

      <p className="mt-10 text-sm">
        <Link href="/admin/algorithms" className="text-accent hover:underline">
          {dict.viewAlgorithmDesk}
        </Link>
      </p>
    </div>
  )
}

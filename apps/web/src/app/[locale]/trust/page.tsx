import { notFound } from 'next/navigation'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

export default async function TrustPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)

  const supplemental =
    locale === 'ne'
      ? [
          {
            title: 'मौलिकता र श्रेय',
            body: 'हामी मौलिक समाचारलाई प्राथमिकता दिन्छौं। बाह्य तथ्य, दस्तावेज, तस्बिर वा उद्धरण प्रयोग गर्दा त्यसको स्रोत स्पष्ट राख्ने सिद्धान्त अपनाइन्छ।',
          },
          {
            title: 'पाठक गोपनीयता',
            body: 'सहमति नदिएसम्म पहिलो-पक्ष विश्लेषण चल्दैन। लोकप्रियता जस्ता संकेत पर्याप्त वास्तविक घटनाबाट बनेपछि मात्र र्याङ्किङमा प्रयोग हुन्छन्।',
          },
          {
            title: 'सम्पादकीय र उत्पादन सीमा',
            body: 'अपूर्ण सेवा, नमूना बजार दर वा प्रमाणित नभएको कानुनी दाबीलाई उत्पादनको तथ्यका रूपमा प्रस्तुत गरिँदैन।',
          },
        ]
      : [
          {
            title: 'Originality and attribution',
            body: 'We prioritize original reporting. When external facts, documents, photographs, or quotations are used, their source should be made clear.',
          },
          {
            title: 'Reader privacy',
            body: 'First-party analytics run only after consent. Popularity signals are used for rankings only after enough real events exist.',
          },
          {
            title: 'Editorial and product boundaries',
            body: 'Incomplete services, sample market rates, or unverified legal claims are not presented as production facts.',
          },
        ]

  const sections = [
    { title: dict.trustCorrectionsTitle, body: dict.trustCorrectionsBody },
    { title: dict.trustRankingsTitle, body: dict.trustRankingsBody },
    { title: dict.trustEnglishTitle, body: dict.trustEnglishBody },
    ...supplemental,
    { title: dict.trustLegalTitle, body: dict.trustLegalBody },
  ]

  return (
    <main className="mx-auto max-w-[900px] px-4 py-10 md:px-6 md:py-14">
      <header className="max-w-[720px]">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">{dict.siteName}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-0.035em] text-ink md:text-5xl">{dict.trust}</h1>
        <p className="mt-5 text-lg leading-[1.75] text-stone">
          {locale === 'ne'
            ? 'विश्वासका नियमहरू प्रचार सामग्री होइनन्। सार्वजनिक पृष्ठ, सम्पादकीय प्रक्रिया र चलिरहेको उत्पादनले वास्तवमै पालना गर्न सक्ने कुरा मात्र यहाँ लेखिन्छ।'
            : 'Trust policies are not marketing copy. This page describes only what the public product and editorial workflow can actually support.'}
        </p>
      </header>

      <div className="mt-12 divide-y divide-line border-y border-line">
        {sections.map((section, index) => (
          <section key={section.title} className="grid gap-3 py-6 md:grid-cols-[3rem_15rem_1fr] md:gap-6">
            <span className="text-sm font-bold tabular-nums text-stone">{String(index + 1).padStart(2, '0')}</span>
            <h2 className="text-xl font-bold tracking-[-0.02em] text-ink">{section.title}</h2>
            <p className="text-base leading-[1.8] text-stone">{section.body}</p>
          </section>
        ))}
      </div>
    </main>
  )
}

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ShieldCheck, CheckCircle } from '@phosphor-icons/react/dist/ssr'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'
import { siteUrl } from '@/lib/content'

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: raw } = await params
  if (!isLocale(raw)) return {}
  const locale = raw as AppLocale
  const title = locale === 'ne' ? 'सम्पादकीय विश्वास तथा नीतिहरू' : 'Trust Policies & Editorial Standards'
  const description =
    locale === 'ne'
      ? 'द नागरिकको निष्पक्ष पत्रकारिता, सच्याइएको नीति, पाठक गोपनीयता र सम्पादकीय आचारसंहिता।'
      : 'The Nagarik trust protocols, corrections policy, privacy standards, and editorial integrity.'

  return {
    title: `${title} | The Nagarik`,
    description,
    alternates: {
      canonical: siteUrl(`/${locale}/trust`),
    },
  }
}

export default async function TrustPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)
  const isNe = locale === 'ne'

  const policies = [
    {
      num: '०१',
      title: dict.trustCorrectionsTitle,
      body: isNe
        ? 'समाचारमा कुनै तथ्यगत त्रुटि भएमा मूल लेख नहटाई तल वा छेउमा स्पष्ट ‘सच्याइएको’ सूचनासहित समय खुलाइन्छ। इतिहास लुकाउने वा मूल सामग्री गुपचुप बदल्ने काम हुँदैन।'
        : 'When factual errors occur, corrections stay transparently appended to the story with precise timestamps. We never silently rewrite or erase published history.',
    },
    {
      num: '०२',
      title: dict.trustRankingsTitle,
      body: isNe
        ? 'चर्चित र धेरै पढिएको सूची पाठकको सहमतिपछि मात्र पहिलो-पक्ष संकेतबाट निर्धारण हुन्छ। पर्याप्त डेटा नभएसम्म ताजा क्रम देखाएर त्यसलाई ‘कोल्ड स्टार्ट’ स्पष्ट लेबल गरिन्छ।'
        : 'Trending and most-read rankings use first-party signals only after reader consent. Until sufficient telemetry exists, stories remain in honest chronological order.',
    },
    {
      num: '०३',
      title: dict.trustEnglishTitle,
      body: isNe
        ? 'नेपाली मुख्य प्रकाशन भाषा हो। अंग्रेजी संस्करण मस्यौदा वा स्वचालित मेसिन अनुवाद नभई सम्पादकीय टिमले मानव समीक्षा र तथ्य प्रमाणीकरण गरेपछि मात्र सार्वजनिक हुन्छ।'
        : 'Nepali is our primary newsroom language. English editions appear only after thorough human editorial review, never unverified machine translation.',
    },
    {
      num: '०४',
      title: isNe ? 'मौलिकता र स्रोत श्रेय' : 'Originality & Source Attribution',
      body: isNe
        ? 'हामी मौलिक पत्रकारितालाई पहिलो प्राथमिकता दिन्छौं। बाह्य तथ्य, सरकारी दस्तावेज, तस्बिर वा विज्ञहरूको भनाइ प्रयोग गर्दा स्रोत र योगदानकर्ताको नाम स्पष्ट खुलाइन्छ।'
        : 'We prioritize original civic reporting. When secondary documents, external photography, or expert testimony are referenced, full credit is transparently cited.',
    },
    {
      num: '०५',
      title: isNe ? 'पाठक गोपनीयता र ट्रयाकिङ-मुक्त नीति' : 'Reader Privacy & Zero Third-Party Trackers',
      body: isNe
        ? 'हामी तेस्रो-पक्षीय विज्ञापन नेटवर्क वा आक्रामक डेटा ट्रयाकिङ प्रयोग गर्दैनौं। पाठकको व्यक्तिगत विवरण सुरक्षित रहन्छ र पढाइ अनुभव सधैं सफा राखिन्छ।'
        : 'We do not run invasive third-party ad trackers. Your reading activity is protected, private, and free from cross-site profiling.',
    },
    {
      num: '०६',
      title: dict.trustLegalTitle,
      body: isNe
        ? 'सूचना तथा प्रसारण विभाग र प्रेस काउन्सिल नेपालका आधिकारिक मापदण्डको पूर्ण पालना गरिन्छ। प्रमाणित नभएका कानूनी दाबी वा अपूर्ण विवरण सार्वजनिक गरिँदैन।'
        : 'We adhere to regulatory press standards in Nepal. Unverified claims or incomplete proceedings are never presented as established facts.',
    },
  ]

  return (
    <main className="mx-auto max-w-[1040px] px-4 py-8 md:px-6 md:py-14">
      {/* Masthead */}
      <header className="border-b-2 border-accent pb-8 mb-12">
        <div className="max-w-[760px]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} weight="bold" className="text-accent" />
            <p className="text-xs font-bold uppercase tracking-wider text-accent">
              {dict.siteName} - {isNe ? 'सम्पादकीय निष्पक्षता' : 'Editorial Integrity'}
            </p>
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-ink sm:text-4xl md:text-5xl">
            {dict.trust}
          </h1>
          <p className="mt-4 text-base font-medium leading-relaxed text-stone md:text-lg">
            {isNe
              ? 'विश्वासका नियमहरू प्रचार सामग्री होइनन्। हाम्रो समाचारकक्ष, पत्रकार र प्रविधिले व्यवहारमा पालना गर्ने सिद्धान्तहरू यहाँ स्पष्ट छन्।'
              : 'Our trust policies are not promotional slogans. They define the concrete standards our journalists, editors, and platform uphold daily.'}
          </p>
        </div>
      </header>

      {/* Policies List */}
      <div className="divide-y divide-line border-y border-line">
        {policies.map((policy) => (
          <article
            key={policy.num}
            className="grid gap-4 py-8 sm:grid-cols-[4rem_1fr] md:grid-cols-[5rem_16rem_1fr] md:gap-8 items-start"
          >
            <span className="text-xl font-black text-accent tabular-nums">
              {policy.num}
            </span>

            <h2 className="text-xl font-bold tracking-tight text-ink">
              {policy.title}
            </h2>

            <p className="text-sm leading-[1.8] text-stone md:text-base">
              {policy.body}
            </p>
          </article>
        ))}
      </div>
    </main>
  )
}

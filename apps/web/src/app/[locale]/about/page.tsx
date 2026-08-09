import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)

  const copy =
    locale === 'ne'
      ? {
          kicker: 'द नागरिक',
          title: 'हाम्रो बारे',
          intro: 'नेपालका पाठकका लागि नेपाली-प्रथम, नागरिक जीवनमा केन्द्रित र पढ्न सजिलो समाचार अनुभव बनाउनु हाम्रो उद्देश्य हो।',
          missionTitle: 'हामी किन छौं',
          mission:
            'समाचारको गति र गहिराइलाई एकअर्काको विरोधी नबनाई, देश, राजनीति, अर्थ, प्रदेश र सार्वजनिक जीवनका विषयलाई स्पष्ट सन्दर्भसहित प्रस्तुत गर्न।',
          originalTitle: 'मौलिक पत्रकारिता',
          original:
            'द नागरिक एग्रिगेटर होइन। प्रकाशित सामग्रीको स्रोत र जिम्मेवारी स्पष्ट राख्दै आफ्नै रिपोर्टिङ, विश्लेषण र सम्पादकीय प्रक्रियामा आधारित सामग्रीलाई प्राथमिकता दिइन्छ।',
          languageTitle: 'नेपाली पहिलो, अंग्रेजी समीक्षा पछि',
          language:
            'नेपाली मुख्य प्रकाशन भाषा हो। अंग्रेजी संस्करण उपलब्ध हुँदा त्यो मानव समीक्षापछि मात्र सार्वजनिक गरिन्छ।',
          readerTitle: 'पाठक अनुभव',
          reader:
            'छिटो स्क्यान गर्न मिल्ने घनत्व, लामो समाचार पढ्न सहज टाइपोग्राफी, कमजोर नेटवर्कमा पनि काम गर्ने पृष्ठ र अनावश्यक उत्पादन-चमकभन्दा पत्रकारितालाई अघि राख्ने डिजाइन हाम्रो आधार हो।',
          people: 'समाचारकक्षका लेखक',
          trust: 'सम्पादकीय विश्वास र नीतिहरू',
        }
      : {
          kicker: 'The Nagarik',
          title: 'About',
          intro: 'We are building a Nepali-first civic news experience for readers in Nepal, designed to be clear, fast, and worth finishing.',
          missionTitle: 'Why we exist',
          mission:
            'To cover public life, politics, the economy, provinces, and civic affairs without treating speed and depth as opposites.',
          originalTitle: 'Original journalism',
          original:
            'The Nagarik is not an aggregator. We prioritize reporting, analysis, and editorial work with clear responsibility for what we publish.',
          languageTitle: 'Nepali first, English after review',
          language:
            'Nepali is the primary publishing language. English is published only when a human-reviewed version is ready.',
          readerTitle: 'Reader experience',
          reader:
            'Our baseline is fast scanning, comfortable long-form reading, resilience on weaker connections, and a design that keeps journalism ahead of product decoration.',
          people: 'Meet our writers',
          trust: 'Editorial trust and policies',
        }

  return (
    <main className="mx-auto max-w-[980px] px-4 py-10 md:px-6 md:py-14">
      <header className="max-w-[760px]">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">{copy.kicker}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-0.035em] text-ink md:text-5xl">{copy.title}</h1>
        <p className="mt-5 text-xl leading-[1.65] text-stone md:text-2xl">{copy.intro}</p>
      </header>

      <div className="mt-12 grid gap-x-12 gap-y-10 md:grid-cols-2">
        {[
          [copy.missionTitle, copy.mission],
          [copy.originalTitle, copy.original],
          [copy.languageTitle, copy.language],
          [copy.readerTitle, copy.reader],
        ].map(([title, body]) => (
          <section key={title} className="border-t border-line pt-4">
            <h2 className="text-xl font-bold tracking-[-0.02em] text-ink">{title}</h2>
            <p className="mt-3 text-base leading-[1.8] text-stone">{body}</p>
          </section>
        ))}
      </div>

      <nav className="mt-12 flex flex-col border-y border-line sm:flex-row sm:divide-x sm:divide-line" aria-label={dict.about}>
        <Link href={`/${locale}/authors`} className="flex min-h-14 flex-1 items-center justify-between py-3 font-bold text-ink hover:text-accent sm:px-5 sm:first:pl-0">
          {copy.people}<span aria-hidden="true">→</span>
        </Link>
        <Link href={`/${locale}/trust`} className="flex min-h-14 flex-1 items-center justify-between py-3 font-bold text-ink hover:text-accent sm:px-5">
          {copy.trust}<span aria-hidden="true">→</span>
        </Link>
      </nav>
    </main>
  )
}

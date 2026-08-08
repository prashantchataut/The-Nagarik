import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Login | The Nagarik',
  description: 'Reader account, journalist desk, admin desk, and Payload CMS access.',
  robots: { index: false, follow: false },
}

const loginCards = {
  ne: [
    {
      title: 'पाठक खाता',
      body: 'पाठक खाता सदस्यता र सुरक्षित सेवाका लागि छुट्याइएको छ।',
      href: '/ne/account',
      action: 'खाता स्थिति हेर्नुहोस्',
      tone: 'secondary',
    },
    {
      title: 'पत्रकार लगइन',
      body: 'समाचार लेख्ने, मस्यौदा मिलाउने, र आफ्ना लेखको स्थिति हेर्ने डेस्क।',
      href: '/admin/login?next=/journalist',
      action: 'पत्रकार डेस्क',
      tone: 'primary',
    },
    {
      title: 'प्रशासन लगइन',
      body: 'सम्पादकीय कतार, प्रकाशन अवस्था, प्रयोगकर्ता, र लन्च जाँचका लागि।',
      href: '/admin/login?next=/admin',
      action: 'Admin desk',
      tone: 'primary',
    },
    {
      title: 'Payload CMS',
      body: 'समाचार, मिडिया, लेखक, वर्ग, र ट्यागको canonical editor।',
      href: '/cms',
      action: 'CMS खोल्नुहोस्',
      tone: 'secondary',
    },
  ],
  en: [
    {
      title: 'Reader account',
      body: 'Reader accounts are reserved for membership and secure services.',
      href: '/en/account',
      action: 'View account status',
      tone: 'secondary',
    },
    {
      title: 'Journalist login',
      body: 'Write stories, manage drafts, and track submissions from the journalist desk.',
      href: '/admin/login?next=/journalist',
      action: 'Journalist desk',
      tone: 'primary',
    },
    {
      title: 'Admin login',
      body: 'Run the editorial queue, publishing state, users, and launch checks.',
      href: '/admin/login?next=/admin',
      action: 'Admin desk',
      tone: 'primary',
    },
    {
      title: 'Payload CMS',
      body: 'Canonical editor for stories, media, authors, sections, and tags.',
      href: '/cms',
      action: 'Open CMS',
      tone: 'secondary',
    },
  ],
} as const

export default async function LocaleLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)
  const cards = loginCards[locale]

  return (
    <section className="mx-auto max-w-[1120px] px-4 py-12 md:px-6 md:py-16">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-accent">{dict.login}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] md:text-4xl">
          {locale === 'ne' ? 'द नागरिकमा प्रवेश' : 'Access The Nagarik'}
        </h1>
        <p className="mt-4 max-w-[62ch] text-sm leading-relaxed text-stone md:text-base">
          {locale === 'ne'
            ? 'पाठक, पत्रकार, सम्पादक, र प्रशासकका प्रवेश मार्ग अलग छन्। आफ्नो काम अनुसार सही डेस्क छान्नुहोस्।'
            : 'Reader, journalist, editor, and admin access are separated. Choose the desk that matches your work.'}
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <article key={card.title} className="border border-line bg-paper-elevated p-5">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">{card.title}</h2>
            <p className="mt-2 min-h-[3.25rem] text-sm leading-relaxed text-stone">{card.body}</p>
            <Link
              href={card.href}
              className={
                card.tone === 'primary'
                  ? 'mt-5 inline-flex rounded-[var(--radius-control)] bg-accent px-4 py-2 text-sm font-semibold text-accent-fg'
                  : 'mt-5 inline-flex rounded-[var(--radius-control)] border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-accent'
              }
            >
              {card.action}
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}

import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  CaretRight,
  CheckCircle,
  Eye,
  Globe,
  Heart,
  Newspaper,
  ShieldCheck,
  Sparkle,
  Users,
} from '@phosphor-icons/react/dist/ssr'
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
  const title = locale === 'ne' ? 'हाम्रो बारेमा' : 'About Us'
  const description =
    locale === 'ne'
      ? 'द नागरिकको सम्पादकीय लक्ष्य, सिद्धान्त, टिम र नागरिक पत्रकारिताको प्रतिबद्धता।'
      : 'About The Nagarik: independent civic journalism, editorial principles, and team.'

  return {
    title: `${title} | The Nagarik`,
    description,
    alternates: {
      canonical: siteUrl(`/${locale}/about`),
    },
  }
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)
  const isNe = locale === 'ne'

  const pillars = [
    {
      title: isNe ? '१. मौलिक नागरिक पत्रकारिता' : '1. Original Civic Journalism',
      desc: isNe
        ? 'द नागरिक एग्रिगेटर होइन। हामी आफ्नै रिपोर्टिङ, अनुसन्धान र सम्पादकीय प्रक्रियाबाट प्रमाणित सामग्री मात्र प्रकाशन गर्छौं।'
        : 'The Nagarik is not an aggregator. We publish verified journalism rooted in original reporting, research, and accountability.',
      icon: Newspaper,
    },
    {
      title: isNe ? '२. सातै प्रदेशको सन्तुलित कभरेज' : '2. Balanced Federal Coverage',
      desc: isNe
        ? 'काठमाडौँ उपत्यकाको केन्द्र मात्र होइन, सातै प्रदेशका स्थानीय निर्णय, विकास, समस्या र नागरिक आवाजलाई समान स्थान दिइन्छ।'
        : 'Beyond the capital, we provide balanced civic coverage across all seven federal provinces of Nepal.',
      icon: Globe,
    },
    {
      title: isNe ? '३. नेपाली पहिलो, मानव-समीक्षित अंग्रेजी' : '3. Nepali-First, Reviewed English',
      desc: isNe
        ? 'नेपाली हाम्रो मुख्य भाषा हो। अंग्रेजी संस्करण मस्यौदा वा स्वचालित अनुवाद नभई मानव सम्पादकीय समीक्षापछि मात्र सार्वजनिक हुन्छ।'
        : 'Nepali is our primary voice. English editions are published strictly after human editorial review, never automated drafts.',
      icon: CheckCircle,
    },
    {
      title: isNe ? '४. पाठक-मैत्री पारदर्शी प्रविधि' : '4. Reader-Centric Design',
      desc: isNe
        ? 'अनावश्यक विज्ञापन र पप-अपको कोलाहल हटाएर छिटो खुल्ने, सफा टाइपोग्राफी र कमजोर इन्टरनेटमा पनि सहज चल्ने प्लेटफर्म।'
        : 'Free from cluttered pop-up ads, delivering rapid load times, comfortable Devanagari typography, and offline resilience.',
      icon: Sparkle,
    },
  ]

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-8 md:px-6 md:py-14">
      {/* Masthead */}
      <header className="border-b-2 border-accent pb-8 mb-12">
        <div className="max-w-[840px]">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">
            {dict.siteName} - {isNe ? 'नागरिक समाचार' : 'Civic News'}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-ink sm:text-4xl md:text-5xl">
            {isNe ? 'हाम्रो बारेमा तथा सम्पादकीय ध्येय' : 'About The Nagarik & Our Mission'}
          </h1>
          <p className="mt-4 text-lg font-medium leading-relaxed text-stone md:text-xl">
            {isNe
              ? 'द नागरिक नेपालको पहिलो नागरिक-केन्द्रित डिजिटल समाचार पोर्टल हो, जहाँ सार्वजनिक जवाफदेहिता र पाठकको पढाइ अनुभवलाई सर्वोपरि राखिन्छ।'
              : 'The Nagarik is Nepal’s premier civic-first digital news portal, built to champion public accountability and exceptional reading craft.'}
          </p>
        </div>
      </header>

      {/* 4 Core Pillars Grid */}
      <section className="mb-14" aria-label="Core Pillars">
        <div className="grid gap-6 sm:grid-cols-2">
          {pillars.map((pillar) => {
            const Icon = pillar.icon
            return (
              <div key={pillar.title} className="surface-card p-6 md:p-8">
                <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-control)] bg-accent-muted text-accent mb-4">
                  <Icon size={24} weight="bold" />
                </span>
                <h2 className="text-xl font-bold tracking-tight text-ink">
                  {pillar.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-stone md:text-base">
                  {pillar.desc}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Editorial Standards & Navigation Links */}
      <section className="rounded-[var(--radius-panel)] border border-line bg-paper-elevated p-8 md:p-10 shadow-sm" aria-label="Editorial Links">
        <div className="max-w-[720px]">
          <h2 className="text-2xl font-black text-ink">
            {isNe ? 'सम्पादकीय निष्पक्षता र पारदर्शिता' : 'Editorial Standards & Transparency'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-stone md:text-base">
            {isNe
              ? 'हाम्रो रिपोर्टिङ नीति, सच्याइएको व्यवस्था, लेखकहरूको विवरण र डेटा प्रयोगबारे थप जान्नुहोस्।'
              : 'Learn more about our corrections policy, transparency protocols, and verified newsroom team.'}
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href={`/${locale}/trust`}
              className="inline-flex items-center gap-2 rounded-[var(--radius-control)] accent-solid px-5 py-2.5 text-xs font-bold shadow-sm"
            >
              <ShieldCheck size={16} weight="bold" />
              <span>{isNe ? 'सम्पादकीय विश्वास नीतिहरू' : 'Trust Policies'}</span>
            </Link>

            <Link
              href={`/${locale}/authors`}
              className="inline-flex items-center gap-2 rounded-[var(--radius-control)] border border-line bg-paper px-5 py-2.5 text-xs font-bold text-ink hover:border-accent"
            >
              <Users size={16} weight="bold" />
              <span>{isNe ? 'लेखक तथा पत्रकार टिम' : 'Meet Our Journalists'}</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

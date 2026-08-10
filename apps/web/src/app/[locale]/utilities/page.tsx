import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  CalendarBlank,
  Translate,
  CurrencyDollar,
  Coins,
  ArrowsLeftRight,
  Sparkle,
  CaretRight,
  Clock,
} from '@phosphor-icons/react/dist/ssr'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'
import { resolveBullion, resolveUsdNpr } from '@/lib/market-rates'
import { bsToAd, todayBs, BS_MONTHS_NE, WEEKDAYS_NE } from '@/lib/bs-calendar'
import { panchangForAd } from '@/lib/panchang'

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: raw } = await params
  if (!isLocale(raw)) return {}
  const locale = raw as AppLocale
  const title = locale === 'ne' ? 'उपयोगी उपकरणहरू' : 'Civic Utilities & Tools'
  const description =
    locale === 'ne'
      ? 'नेपाली पात्रो, प्रीति युनिकोड रूपान्तरक, सुनचाँदी भाउ र विदेशी मुद्रा विनिमय दर।'
      : 'Nepali Patro calendar, Preeti Unicode converter, gold/silver rates, and forex exchange tools.'

  return {
    title: `${title} | The Nagarik`,
    description,
  }
}

export default async function UtilitiesHubPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)
  const isNe = locale === 'ne'

  const [bullion, usd] = await Promise.all([resolveBullion(), resolveUsdNpr()])
  const today = todayBs()
  const todayAd = bsToAd(today)
  const todayPanchang = panchangForAd(todayAd, locale)
  const todayMonthName = BS_MONTHS_NE[today.month - 1]
  const todayWd = new Date(Date.UTC(todayAd.year, todayAd.month - 1, todayAd.day)).getUTCDay()
  const todayWdName = `${WEEKDAYS_NE[todayWd]}बार`

  const tools = [
    {
      id: 'nepali-patro',
      title: dict.nepaliPatro,
      description: isNe
        ? 'विक्रम संवत् २०८३ को पूर्ण क्यालेन्डर, महिनागत चाडपर्व, एकादशी र सार्वजनिक बिदाको तालिका।'
        : 'Complete Bikram Sambat 2083 calendar with monthly festivals, ekadashi, and public holidays.',
      href: `/${locale}/utilities/nepali-patro`,
      icon: CalendarBlank,
      badge: isNe ? 'पात्रो' : 'Calendar',
      accentTone: 'accent',
      highlight: `${todayWdName}, ${today.day} ${todayMonthName} ${today.year} (${todayPanchang.tithiLabel})`,
    },
    {
      id: 'preeti-unicode',
      title: dict.preetiTranslator,
      description: isNe
        ? 'परम्परागत प्रीति वा कान्तिपुर फन्ट टेक्स्टलाई तत्काल मानक युनिकोड नेपालीमा रूपान्तरण गर्नुहोस्।'
        : 'Convert legacy Preeti or Kantipur font text into standard Unicode Nepali instantly.',
      href: `/${locale}/utilities/preeti-unicode`,
      icon: Translate,
      badge: isNe ? 'कन्भर्टर' : 'Converter',
      accentTone: 'accent',
    },
    {
      id: 'date-converter',
      title: isNe ? 'मिति रूपान्तरण (BS ↔ AD)' : 'BS ↔ AD Date Converter',
      description: isNe
        ? 'विक्रम संवत् (BS) मितिलाई इस्वी संवत् (AD) मा र AD लाई BS मा छिटो परिवर्तन गर्नुहोस्।'
        : 'Convert between Bikram Sambat (BS) and Gregorian (AD) calendar dates seamlessly.',
      href: `/${locale}/utilities/nepali-patro`,
      icon: ArrowsLeftRight,
      badge: isNe ? 'रूपान्तरण' : 'Converter',
    },
    {
      id: 'bullion-rates',
      title: dict.goldSilver,
      description: isNe
        ? 'नेपाल सुनचाँदी व्यवसायी महासंघको दैनिक बजार भाउ (छापावाल, तेजाबी सुन र चाँदी प्रतितोला)।'
        : 'Daily market bullion rates in Nepal for fine gold, tejabi gold, and silver per tola.',
      href: `/${locale}/utilities/nepali-patro`,
      icon: Coins,
      badge: isNe ? 'बजार दर' : 'Market',
      highlight: bullion.rows[0]
        ? `${isNe ? bullion.rows[0].labelNe : bullion.rows[0].labelEn}: रु. ${bullion.rows[0].today}`
        : undefined,
    },
    {
      id: 'forex-rates',
      title: dict.forexRates,
      description: isNe
        ? 'नेपाल राष्ट्र बैंकको आधिकारिक विदेशी मुद्रा विनिमय दर (USD, EUR, GBP, AUD, आदि)।'
        : 'Nepal Rastra Bank official foreign currency exchange rates against NPR.',
      href: `/${locale}/utilities/nepali-patro`,
      icon: CurrencyDollar,
      badge: isNe ? 'विनिमय दर' : 'Forex',
      highlight: `1 USD = रु. ${usd.rate.toFixed(2)}`,
    },
    {
      id: 'rashifal',
      title: isNe ? 'दैनिक राशिफल तथा पञ्चाङ्ग' : 'Daily Horoscope & Panchang',
      description: isNe
        ? 'आजको तिथि, नक्षत्र, योग, करण, सूर्योदय, सूर्यास्त र १२ राशिको दैनिक फलादेश।'
        : 'Today’s tithi, nakshatra, sunrise/sunset times, and daily zodiac guidance.',
      href: `/${locale}/utilities/nepali-patro`,
      icon: Sparkle,
      badge: isNe ? 'पञ्चाङ्ग' : 'Panchang',
    },
  ]

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-8 md:px-6 md:py-12">
      {/* Masthead */}
      <header className="border-b-2 border-accent pb-6 mb-10">
        <div className="max-w-[760px]">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">
            {dict.siteName}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-ink md:text-5xl">
            {isNe ? 'नागरिक उपयोगी उपकरणहरू' : 'Civic Utilities & Daily Tools'}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-stone md:text-lg">
            {isNe
              ? 'दैनिक जीवन र समाचार विश्लेषणमा चाहिने आवश्यक उपकरण, क्यालेन्डर, युनिकोड र बजार तथ्याङ्कहरू।'
              : 'Essential daily tools, calendar converter, Unicode translator, and market data for civic life.'}
          </p>
        </div>
      </header>

      {/* Quick Live Highlight Bar */}
      <section
        className="mb-10 rounded-[var(--radius-panel)] border border-line bg-paper-elevated p-5 shadow-sm"
        aria-label="Live Highlights"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Today BS Card */}
          <div className="flex items-center gap-3 border-b border-line/60 pb-3 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg">
              <CalendarBlank size={20} weight="bold" />
            </span>
            <div className="min-w-0">
              <p className="text-[0.7rem] font-bold uppercase tracking-wider text-stone">
                {isNe ? 'आजको पञ्चाङ्ग' : "Today's Panchang"}
              </p>
              <p className="truncate text-sm font-black text-ink">
                {`${todayWdName}, ${today.day} ${todayMonthName} ${today.year}`}
              </p>
            </div>
          </div>

          {/* Gold Rate */}
          <div className="flex items-center gap-3 border-b border-line/60 pb-3 sm:border-b-0 lg:border-r sm:pb-0 sm:pr-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning-muted text-warning">
              <Coins size={20} weight="bold" />
            </span>
            <div className="min-w-0">
              <p className="text-[0.7rem] font-bold uppercase tracking-wider text-stone">
                {isNe ? 'छापावाल सुन (प्रतितोला)' : 'Fine Gold Rate'}
              </p>
              <p className="truncate text-sm font-black text-ink">
                रु. {bullion.rows[0]?.today ?? '२,१५,५००'}
              </p>
            </div>
          </div>

          {/* USD Rate */}
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success-muted text-success">
              <CurrencyDollar size={20} weight="bold" />
            </span>
            <div className="min-w-0">
              <p className="text-[0.7rem] font-bold uppercase tracking-wider text-stone">
                {isNe ? 'अमेरिकी डलर (USD / NPR)' : 'US Dollar Exchange'}
              </p>
              <p className="truncate text-sm font-black text-ink">
                १ USD = रु. {usd.rate.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section aria-label="Tools Grid">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const Icon = tool.icon
            return (
              <Link
                key={tool.id}
                href={tool.href}
                className="surface-card flex flex-col justify-between p-6 group hover:border-accent hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-control)] bg-paper-elevated text-accent group-hover:bg-accent group-hover:text-accent-fg transition-colors">
                      <Icon size={24} weight="bold" />
                    </span>
                    <span className="rounded-full bg-paper-elevated border border-line px-2.5 py-0.5 text-[0.7rem] font-bold text-stone">
                      {tool.badge}
                    </span>
                  </div>

                  <h2 className="mt-4 text-xl font-bold leading-snug tracking-[-0.02em] text-ink group-hover:text-accent transition-colors">
                    {tool.title}
                  </h2>

                  <p className="mt-2.5 text-xs leading-relaxed text-stone">
                    {tool.description}
                  </p>

                  {tool.highlight ? (
                    <div className="mt-4 rounded-[var(--radius-control)] bg-accent-muted/40 p-2.5 border border-accent/20 text-xs font-bold text-accent">
                      {tool.highlight}
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 flex items-center gap-1 text-xs font-bold text-accent border-t border-line/60 pt-3">
                  <span>{isNe ? 'उपकरण खोल्नुहोस्' : 'Open tool'}</span>
                  <CaretRight
                    size={14}
                    weight="bold"
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </main>
  )
}

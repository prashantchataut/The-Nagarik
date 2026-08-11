import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import {
  CheckCircle,
  ShieldCheck,
  UserCircle,
} from '@phosphor-icons/react/dist/ssr'
import { ReaderLoginForm } from '@/components/auth/ReaderLoginForm'
import { getReaderSession } from '@/lib/auth/reader-session'
import { isLocale, type AppLocale } from '@/lib/i18n'
import { SITE } from '@/site.config'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Reader Login',
  robots: { index: false, follow: false },
}

export default async function LocaleLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const isNe = locale === 'ne'

  const reader = await getReaderSession()
  if (reader) redirect(`/${locale}/account`)

  const perks = isNe
    ? ['रुचिअनुसार व्यक्तिगत समाचार अनुभव', 'प्रोफाइल र प्राथमिकता सबै उपकरणमा', 'छिटो प्रतिक्रिया र संवाद']
    : ['A news experience personalised to your interests', 'Profile and preferences across devices', 'Faster comments and conversation']

  return (
    <div className="bg-paper-elevated py-8 md:py-14">
      <section className="mx-auto grid max-w-[1140px] overflow-hidden rounded-[var(--radius-lg)] border border-line bg-paper shadow-[0_24px_70px_rgb(16_32_29_/_0.08)] lg:grid-cols-[0.95fr_1.05fr]">
        {/* Brand side */}
        <div className="relative min-h-[280px] overflow-hidden bg-nav lg:min-h-[600px]">
          <Image
            src="/media/demo/pradesh-2.jpg"
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-nav/75 backdrop-blur-[2px]" aria-hidden="true" />

          <div className="relative flex h-full flex-col justify-between p-6 text-nav-fg md:p-10">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-nav-accent">
                {SITE.brand.en.toUpperCase()} · {isNe ? 'पाठक खाता' : 'READER ACCOUNT'}
              </p>
              <h1 className="mt-4 max-w-[16ch] text-3xl font-black leading-[1.18] tracking-[-0.035em] text-nav-fg md:text-4xl lg:text-5xl">
                {isNe ? 'तपाईंको आफ्नै समाचार अनुभव' : 'Your own news experience'}
              </h1>
              <ul className="mt-6 space-y-2.5">
                {perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-sm leading-relaxed text-nav-fg/90">
                    <CheckCircle size={17} weight="fill" className="mt-0.5 shrink-0 text-nav-accent" aria-hidden="true" />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs leading-relaxed text-nav-fg/70">
              {isNe ? SITE.brand.taglineNe : SITE.brand.taglineEn}
            </p>
          </div>
        </div>

        {/* Form side */}
        <div className="flex flex-col justify-center p-6 md:p-10 lg:p-14">
          <div className="flex items-center gap-2 text-accent">
            <UserCircle size={24} weight="bold" aria-hidden="true" />
            <h2 className="text-xl font-black text-ink md:text-2xl">
              {isNe ? 'पाठक लगइन' : 'Reader login'}
            </h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-stone">
            {isNe
              ? 'आफ्नो पाठक खातामा प्रवेश गर्नुहोस्।'
              : 'Sign in to your reader account.'}
          </p>

          <div className="mt-6">
            <ReaderLoginForm locale={locale} />
          </div>

          <div className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
            <p className="text-stone">
              {isNe ? 'खाता छैन?' : "Don't have an account?"}{' '}
              <Link href={`/${locale}/register`} className="font-bold text-accent hover:underline">
                {isNe ? 'खाता खोल्नुहोस्' : 'Create one'}
              </Link>
            </p>
            <p className="inline-flex items-center gap-1.5 text-xs text-stone">
              <ShieldCheck size={15} weight="bold" className="shrink-0 text-accent" aria-hidden="true" />
              {isNe ? 'पत्रकार वा सम्पादक हुनुहुन्छ?' : 'Journalist or editor?'}{' '}
              <Link href="/admin/login" className="font-bold text-accent hover:underline">
                {isNe ? 'स्टाफ लगइन' : 'Staff login'}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

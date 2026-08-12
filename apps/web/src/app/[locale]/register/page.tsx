import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { RegisterClient } from '@/components/auth/RegisterClient'
import { getReaderSession } from '@/lib/auth/reader-session'
import { isLocale, type AppLocale } from '@/lib/i18n'
import { SITE } from '@/site.config'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Create Account',
  robots: { index: false, follow: false },
}

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const isNe = locale === 'ne'

  // Already signed in as a reader: go straight to the account.
  const reader = await getReaderSession()
  if (reader) redirect(`/${locale}/account`)

  return (
    <div className="mx-auto max-w-[720px] px-4 py-10 md:px-6 md:py-14">
      <header className="mb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-accent">
          {isNe ? SITE.brand.ne : SITE.brand.en}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-ink md:text-4xl">
          {isNe ? 'खाता खोल्नुहोस्' : 'Create your account'}
        </h1>
        <p className="mx-auto mt-3 max-w-[52ch] text-sm leading-relaxed text-stone">
          {isNe
            ? 'पाठक र पत्रकार खाता फरक हुन्: पाठक खाता तुरुन्तै खुल्छ, पत्रकार खाता सम्पादकीय प्रमाणीकरणपछि मात्र।'
            : 'Reader and journalist accounts are separate: readers start instantly, journalists are verified by the editorial team first.'}
        </p>
      </header>

      <div className="surface-card p-6 md:p-8">
        <RegisterClient locale={locale} />
      </div>
    </div>
  )
}

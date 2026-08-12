import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { LockKeyOpen } from '@phosphor-icons/react/dist/ssr'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { getReaderSession } from '@/lib/auth/reader-session'
import { isLocale, type AppLocale } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Forgot Password',
  robots: { index: false, follow: false },
}

export default async function ForgotPasswordPage({
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

  return (
    <div className="bg-paper-elevated py-8 md:py-14">
      <section className="mx-auto max-w-md rounded-[var(--radius-lg)] border border-line bg-paper p-6 shadow-[0_24px_70px_rgb(16_32_29_/_0.08)] md:p-10">
        <div className="flex items-center gap-2 text-accent">
          <LockKeyOpen size={24} weight="bold" aria-hidden="true" />
          <h1 className="text-xl font-black text-ink md:text-2xl">
            {isNe ? 'पासवर्ड बिर्सनुभयो?' : 'Forgot your password?'}
          </h1>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-stone">
          {isNe
            ? 'खाताको इमेल लेख्नुहोस्। हामी पासवर्ड रिसेट गर्ने लिङ्क पठाउँछौं।'
            : 'Enter your account email and we will send a password reset link.'}
        </p>
        <div className="mt-6">
          <ForgotPasswordForm locale={locale} />
        </div>
        <p className="mt-6 border-t border-line pt-5 text-sm text-stone">
          <Link
            href={`/${locale}/login`}
            className="inline-flex min-h-11 items-center font-bold text-accent underline-offset-4 hover:underline"
          >
            {isNe ? 'लगइनमा फर्कनुहोस्' : 'Back to login'}
          </Link>
        </p>
      </section>
    </div>
  )
}

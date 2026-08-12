import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { LockKey } from '@phosphor-icons/react/dist/ssr'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { isLocale, type AppLocale } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Reset Password',
  robots: { index: false, follow: false },
}

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const isNe = locale === 'ne'

  return (
    <div className="bg-paper-elevated py-8 md:py-14">
      <section className="mx-auto max-w-md rounded-[var(--radius-lg)] border border-line bg-paper p-6 shadow-[0_24px_70px_rgb(16_32_29_/_0.08)] md:p-10">
        <div className="flex items-center gap-2 text-accent">
          <LockKey size={24} weight="bold" aria-hidden="true" />
          <h1 className="text-xl font-black text-ink md:text-2xl">
            {isNe ? 'नयाँ पासवर्ड राख्नुहोस्' : 'Set a new password'}
          </h1>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-stone">
          {isNe
            ? 'इमेलको लिङ्कबाट आउनुभएको हो भने तल नयाँ पासवर्ड राख्नुहोस्।'
            : 'You arrived from the email link - set your new password below.'}
        </p>
        <div className="mt-6">
          {/* useSearchParams (token) requires a Suspense boundary. */}
          <Suspense fallback={null}>
            <ResetPasswordForm locale={locale} />
          </Suspense>
        </div>
      </section>
    </div>
  )
}

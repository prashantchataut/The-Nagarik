import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { AccountNav } from '@/components/account/AccountNav'
import { getReaderSession, readerAuthReady } from '@/lib/auth/reader-session'
import { getStaffSession } from '@/lib/auth/staff-session'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)
  const isNe = locale === 'ne'

  // Login-first: the account area belongs to signed-in people.
  // Anonymous visitors land on the login screen (with a return path).
  // When the account service is offline (no DB), the gate stays open so the
  // device-local surfaces keep working in facade/demo mode.
  if (readerAuthReady()) {
    const [reader, staff] = await Promise.all([getReaderSession(), getStaffSession()])
    if (!reader && !staff) {
      redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/account`)}`)
    }
  }

  return (
    <div className="mx-auto max-w-[1040px] px-4 py-8 md:px-6 md:py-12">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-accent">{dict.siteName}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-ink md:text-4xl">
          {dict.account}
        </h1>
        <p className="mt-2 max-w-[64ch] text-sm leading-relaxed text-stone">
          {isNe
            ? 'पाठक प्रोफाइल, सुरक्षित समाचार, पढाइ इतिहास र प्राथमिकता।'
            : 'Reader profile, saved stories, reading history, and preferences.'}
        </p>
      </header>

      <AccountNav locale={locale} />

      <div className="mt-8">{children}</div>
    </div>
  )
}

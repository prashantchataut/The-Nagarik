import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowRight, ShieldCheck } from '@phosphor-icons/react/dist/ssr'
import { HistoryPanel } from '@/components/account/HistoryPanel'
import { ReaderIdentityCard } from '@/components/account/ReaderIdentityCard'
import { SavedStoriesPanel } from '@/components/account/SavedStoriesPanel'
import { StaffLogoutButton } from '@/components/auth/StaffLogoutButton'
import { primaryRole } from '@/lib/auth/staff-roles'
import { getStaffSession } from '@/lib/auth/staff-session'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Account',
  robots: { index: false, follow: false },
}

export default async function LocaleAccountPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()

  const locale = raw as AppLocale
  const dict = getDictionary(locale)
  const session = await getStaffSession()
  const isNe = locale === 'ne'

  return (
    <div className="space-y-8">
      {/* Reader identity */}
      <ReaderIdentityCard locale={locale} />

      {/* Compact previews */}
      <div className="grid gap-8 lg:grid-cols-2">
        <SavedStoriesPanel locale={locale} variant="compact" />
        <HistoryPanel locale={locale} variant="compact" />
      </div>

      {/* Staff & Newsroom Desk Access */}
      <section className="surface-card border-accent/40 bg-paper-elevated p-6 md:p-8">
        <div className="flex items-center gap-2 text-accent">
          <ShieldCheck size={22} weight="bold" />
          <h2 className="text-xl font-bold text-ink">
            {isNe ? 'समाचारकक्ष स्टाफ पहुँच' : 'Staff Newsroom Access'}
          </h2>
        </div>

        {session ? (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-fg font-black text-lg">
                {(session.name || session.email || 'U').slice(0, 1).toUpperCase()}
              </span>
              <div>
                <p className="text-base font-bold text-ink">{session.name || 'Staff User'}</p>
                <p className="text-xs text-stone">{session.email}</p>
                <span className="mt-1 inline-block rounded-full bg-accent-muted px-2.5 py-0.5 text-[0.68rem] font-bold text-accent">
                  {primaryRole(session.roles) ?? 'staff'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link
                href="/journalist"
                className="inline-flex min-h-10 items-center rounded-[var(--radius-control)] accent-solid px-4 text-xs font-bold shadow-sm"
              >
                {isNe ? 'पत्रकार डेस्क खोल्नुहोस्' : 'Open Journalist Desk'}
              </Link>
              <Link
                href="/journalist/profile"
                className="inline-flex min-h-10 items-center rounded-[var(--radius-control)] border border-line bg-paper px-4 text-xs font-bold text-ink hover:border-accent"
              >
                {isNe ? 'पत्रकार प्रोफाइल' : 'Journalist Profile'}
              </Link>
              <Link
                href="/admin"
                className="inline-flex min-h-10 items-center rounded-[var(--radius-control)] border border-line bg-paper px-4 text-xs font-bold text-ink hover:border-accent"
              >
                {isNe ? 'सञ्चालन डेस्क' : 'Admin Desk'}
              </Link>
              <StaffLogoutButton className="rounded-[var(--radius-control)] border border-line bg-paper px-3 text-xs font-bold text-stone hover:text-danger hover:border-danger" />
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <p className="max-w-[62ch] text-xs leading-relaxed text-stone">
              {isNe
                ? 'पत्रकार, सम्पादक र प्रकाशकहरूले आफ्नो आधिकारिक खाताबाट समाचारकक्षमा सुरक्षित प्रवेश गर्न सक्नुहुन्छ। पाठकलाई खाता आवश्यक छैन।'
                : 'Journalists, editors, and publishers sign in here to compose stories, review queues, and publish news. Readers never need an account.'}
            </p>
            <div className="mt-5">
              <Link
                href={`/${locale}/login`}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-control)] accent-solid px-5 text-xs font-bold shadow-sm"
              >
                <span>{dict.login}</span>
                <ArrowRight size={14} weight="bold" aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

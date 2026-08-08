import Link from 'next/link'
import { notFound } from 'next/navigation'
import { StaffLogoutButton } from '@/components/auth/StaffLogoutButton'
import { primaryRole } from '@/lib/auth/staff-roles'
import { getStaffSession } from '@/lib/auth/staff-session'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

export const metadata = {
  robots: { index: false, follow: false },
}

/**
 * Account surface:
 * - Staff session → profile + desk links
 * - Anonymous → staff login CTA (reader membership deferred per PRODUCT)
 */
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

  if (!session) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 md:px-6">
        <p className="text-sm font-semibold text-accent">{dict.account}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-[-0.03em]">
          {locale === 'ne' ? 'खाता' : 'Account'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-stone">
          {locale === 'ne'
            ? 'पाठक खाता सदस्यता र सुरक्षित सेवाका लागि छुट्याइएको छ। समाचारकक्ष स्टाफ Payload खाताबाट साइन इन गर्नुहोस्।'
            : 'Reader accounts are reserved for membership and secure services. Newsroom staff sign in with their Payload account.'}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/login`}
            className="inline-flex rounded-[var(--radius-control)] bg-accent px-4 py-2 text-sm font-semibold text-accent-fg"
          >
            {dict.staffLogin}
          </Link>
          <Link
            href={`/${locale}`}
            className="inline-flex rounded-[var(--radius-control)] border border-line px-4 py-2 text-sm font-medium"
          >
            {dict.home}
          </Link>
        </div>
      </div>
    )
  }

  const role = primaryRole(session.roles)

  return (
    <div className="mx-auto max-w-lg px-4 py-16 md:px-6">
      <p className="text-sm font-semibold text-accent">{dict.account}</p>
      <h1 className="mt-1 text-3xl font-bold">{session.name || session.email}</h1>
      <p className="mt-2 text-sm text-stone">
        {session.email}
        {role ? ` / ${role}` : ''}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/admin"
          className="inline-flex rounded-[var(--radius-control)] bg-accent px-4 py-2 text-sm font-semibold text-accent-fg"
        >
          {dict.newsroomDesk}
        </Link>
        <Link
          href="/cms"
          className="inline-flex rounded-[var(--radius-control)] border border-line px-4 py-2 text-sm font-medium"
        >
          Payload CMS
        </Link>
        <Link
          href="/admin/account"
          className="inline-flex rounded-[var(--radius-control)] border border-line px-4 py-2 text-sm font-medium"
        >
          {dict.account}
        </Link>
        <StaffLogoutButton className="inline-flex rounded-[var(--radius-control)] border border-line px-4 py-2 text-sm font-medium hover:border-holiday" />
      </div>
    </div>
  )
}

import Link from 'next/link'
import { AdminButton, AdminCard } from '@/components/admin/primitives'
import { StaffLogoutButton } from '@/components/auth/StaffLogoutButton'
import { cmsCollectionUrl } from '@/lib/admin/nav'
import { primaryRole } from '@/lib/auth/staff-roles'
import { getStaffSession } from '@/lib/auth/staff-session'

export const metadata = {
  title: 'Account · Newsroom',
  robots: { index: false, follow: false },
}

export default async function AdminAccountPage() {
  const session = await getStaffSession()
  if (!session) return null
  const role = primaryRole(session.roles)

  return (
    <div>
      <p className="text-sm font-semibold text-accent">खाता</p>
      <h1 className="mt-1 text-3xl font-bold">My account</h1>
      <p className="mt-2 max-w-[54ch] text-sm text-stone">
        One Payload user powers both this desk and <code>/cms</code>. Password and profile fields
        edit in CMS.
      </p>

      <AdminCard className="mt-8 space-y-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-stone">Name</p>
          <p className="text-lg font-semibold">{session.name || '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-stone">Email</p>
          <p className="font-medium">{session.email}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-stone">Roles</p>
          <p className="font-medium">{session.roles.join(', ') || '—'}</p>
          {role ? (
            <p className="mt-1 text-xs text-stone">Primary desk role: {role}</p>
          ) : null}
        </div>
      </AdminCard>

      <div className="mt-6 flex flex-wrap gap-3">
        <AdminButton href={cmsCollectionUrl('users', session.id)}>Edit in CMS</AdminButton>
        <AdminButton href="/cms" variant="ghost">
          Open Payload
        </AdminButton>
        <StaffLogoutButton className="inline-flex items-center justify-center rounded-[var(--radius-control)] border border-line px-4 py-2 text-sm font-medium hover:border-holiday" />
      </div>

      <p className="mt-8 text-xs text-stone">
        Reader membership is out of Phase 1 (
        <Link href="/ne/account" className="text-accent hover:underline">
          /ne/account
        </Link>
        ). Staff only for now.
      </p>
    </div>
  )
}

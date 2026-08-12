import Link from 'next/link'
import { AdminButton, AdminCard } from '@/components/admin/primitives'
import { StaffLogoutButton } from '@/components/auth/StaffLogoutButton'
import { cmsCollectionUrl } from '@/lib/admin/nav'
import { primaryRole } from '@/lib/auth/staff-roles'
import { getStaffSession } from '@/lib/auth/staff-session'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Account · Newsroom',
  robots: { index: false, follow: false },
}

export default async function AdminAccountPage() {
  const session = await getStaffSession()
  if (!session) return null
  const role = primaryRole(session.roles)

  return (
    <div className="space-y-6 max-w-[720px]">
      <div className="border-b border-line pb-5">
        <p className="text-xs font-bold uppercase tracking-wider text-accent">
          खाता व्यवस्थापन
        </p>
        <h1 className="mt-1 text-2xl font-black text-ink md:text-3xl">
          My Account Profile
        </h1>
        <p className="mt-1 text-xs text-stone">
          Unified Payload account powering both Newsroom desk and /cms.
        </p>
      </div>

      <AdminCard className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-fg font-black text-xl">
            {(session.name || session.email || 'U').slice(0, 1).toUpperCase()}
          </span>
          <div>
            <p className="text-lg font-bold text-ink">{session.name || 'Staff User'}</p>
            <p className="text-xs text-stone">{session.email}</p>
            <span className="mt-1 inline-block rounded-full bg-accent-muted px-2.5 py-0.5 text-xs font-bold text-accent">
              {role ?? 'staff'}
            </span>
          </div>
        </div>

        <div className="border-t border-line pt-4 space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-line/60">
            <span className="text-stone font-semibold">User ID:</span>
            <span className="font-mono text-ink">{session.id}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-line/60">
            <span className="text-stone font-semibold">Email:</span>
            <span className="font-semibold text-ink">{session.email}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-line/60">
            <span className="text-stone font-semibold">Assigned Roles:</span>
            <span className="font-bold text-accent">{session.roles.join(', ')}</span>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap gap-3">
          <AdminButton href="/journalist/profile">
            Public Byline Profile (bio, photo, beats)
          </AdminButton>
          <AdminButton href={cmsCollectionUrl('users', session.id)} variant="secondary" external>
            Edit Profile & Password in CMS
          </AdminButton>
          <StaffLogoutButton className="rounded-[var(--radius-control)] border border-line bg-paper px-4 py-2 text-xs font-bold text-stone hover:text-danger hover:border-danger" />
        </div>
      </AdminCard>
    </div>
  )
}

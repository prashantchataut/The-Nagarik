import Link from 'next/link'
import {
  AdminButton,
  AdminCard,
  AdminStatusPill,
  CmsCanonicalBanner,
} from '@/components/admin/primitives'
import { listDeskUsers, payloadDeskAvailable } from '@/lib/admin/payload-desk'
import { cmsCollectionUrl } from '@/lib/admin/nav'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Users · Newsroom',
  robots: { index: false, follow: false },
}

export default async function AdminUsersPage() {
  const connected = payloadDeskAvailable()
  const users = connected ? await listDeskUsers() : []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-accent">
            प्रयोगकर्ता तथा पहुँच
          </p>
          <h1 className="mt-1 text-2xl font-black text-ink md:text-3xl">
            Staff Users & Roles (RBAC)
          </h1>
          <p className="mt-1 text-xs text-stone">
            Manage journalists, editors, publishers, and admin permissions in Payload CMS.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <AdminButton href={cmsCollectionUrl('users', 'create')} external>
            + नयाँ प्रयोगकर्ता
          </AdminButton>
          <AdminButton href={cmsCollectionUrl('users')} variant="secondary" external>
            Manage in CMS
          </AdminButton>
        </div>
      </div>

      <CmsCanonicalBanner onPayload={connected} />

      {/* Role Matrix Helper */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { role: 'Admin', desc: 'Full system & staff management' },
          { role: 'Publisher', desc: 'Publish, schedule & unpublish stories' },
          { role: 'Editor', desc: 'Review, edit & approve journalist drafts' },
          { role: 'Journalist', desc: 'Compose, upload media & submit drafts' },
        ].map((r) => (
          <div key={r.role} className="surface-card p-3 text-xs">
            <p className="font-bold text-ink">{r.role}</p>
            <p className="mt-0.5 text-stone text-[0.7rem]">{r.desc}</p>
          </div>
        ))}
      </div>

      {!connected ? (
        <AdminCard>
          <p className="text-xs text-stone">
            Connect PostgreSQL database to manage users from Payload.
          </p>
        </AdminCard>
      ) : (
        <div className="surface-card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="border-b border-line bg-paper-elevated text-stone uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3">नाम</th>
                <th className="px-4 py-3">इमेल</th>
                <th className="px-4 py-3">भूमिका (Roles)</th>
                <th className="px-4 py-3">सक्रिय</th>
                <th className="px-4 py-3">कार्यहरू</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-paper-elevated/50 transition-colors">
                  <td className="px-4 py-3 font-bold text-ink">{user.name || '-'}</td>
                  <td className="px-4 py-3 text-stone">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-accent-muted px-2 py-0.5 font-bold text-accent">
                      {user.roles.join(', ') || 'journalist'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <AdminStatusPill status={user.isActive ? 'active' : 'disabled'} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={cmsCollectionUrl('users', user.id)}
                      target="_blank"
                      className="font-bold text-accent hover:underline"
                    >
                      Edit in CMS →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!users.length ? (
            <div className="p-12 text-center">
              <p className="text-sm font-bold text-ink">कुनै प्रयोगकर्ता भेटिएन</p>
              <p className="mt-1 text-xs text-stone">
                Create staff accounts in Payload CMS at /cms.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

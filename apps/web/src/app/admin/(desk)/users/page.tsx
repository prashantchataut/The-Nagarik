import Link from 'next/link'
import { AdminButton, AdminCard, CmsCanonicalBanner } from '@/components/admin/primitives'
import { listDeskUsers, payloadDeskAvailable } from '@/lib/admin/payload-desk'
import { cmsCollectionUrl } from '@/lib/admin/nav'

export const metadata = {
  title: 'Users · Newsroom',
  robots: { index: false, follow: false },
}

export default async function AdminUsersPage() {
  const connected = payloadDeskAvailable()
  const onPayload = connected
  const users = connected ? await listDeskUsers() : []

  return (
    <div>
      <p className="text-sm font-semibold text-accent">प्रयोगकर्ता</p>
      <h1 className="mt-1 text-3xl font-bold">Staff users</h1>
      <p className="mt-2 max-w-[54ch] text-sm text-stone">
        Compact roles only: journalist, editor, publisher, admin. Create and edit accounts in
        Payload.
      </p>

      <div className="mt-6">
        <CmsCanonicalBanner onPayload={onPayload} />
      </div>

      {!connected ? (
        <AdminCard className="mt-8">
          <p className="text-sm text-holiday">
            Connect Postgres to list users. Pitch demos: <code>*@nagarik.local</code> after seed.
          </p>
        </AdminCard>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-3">
            <AdminButton href={cmsCollectionUrl('users')}>Manage in CMS</AdminButton>
            <AdminButton href={cmsCollectionUrl('users', 'create')} variant="ghost">
              New user
            </AdminButton>
          </div>
          <AdminCard className="mt-8 !p-0 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line bg-paper text-xs uppercase tracking-wide text-stone">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Roles</th>
                  <th className="px-4 py-3 font-semibold">Active</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 font-medium">{user.name || '—'}</td>
                    <td className="px-4 py-3 text-stone">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs">{user.roles.join(', ') || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          user.isActive ? 'text-xs font-semibold text-accent' : 'text-xs text-holiday'
                        }
                      >
                        {user.isActive ? 'yes' : 'disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={cmsCollectionUrl('users', user.id)}
                        className="text-xs font-semibold text-accent hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!users.length ? (
              <p className="px-4 py-10 text-sm text-stone">No users found.</p>
            ) : null}
          </AdminCard>
        </>
      )}
    </div>
  )
}

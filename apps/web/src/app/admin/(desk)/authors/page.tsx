import Link from 'next/link'
import { AdminButton, AdminCard, CmsCanonicalBanner } from '@/components/admin/primitives'
import { cmsCollectionUrl } from '@/lib/admin/nav'
import { listDeskAuthors, payloadDeskAvailable } from '@/lib/admin/payload-desk'

export const metadata = {
  title: 'Authors · Newsroom',
  robots: { index: false, follow: false },
}

export default async function AdminAuthorsPage() {
  const connected = payloadDeskAvailable()
  const authors = connected ? await listDeskAuthors() : []

  return (
    <div>
      <p className="text-sm font-semibold text-accent">लेखक</p>
      <h1 className="mt-1 text-3xl font-bold">Authors</h1>
      <div className="mt-6">
        <CmsCanonicalBanner onPayload={connected} />
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <AdminButton href={cmsCollectionUrl('authors')}>Manage in CMS</AdminButton>
        <AdminButton href={cmsCollectionUrl('authors', 'create')} variant="ghost">
          New author
        </AdminButton>
      </div>
      {!connected ? (
        <AdminCard className="mt-8">
          <p className="text-sm text-holiday">Connect Postgres to load authors from Payload.</p>
        </AdminCard>
      ) : (
        <AdminCard className="mt-8 !p-0">
          <ul className="divide-y divide-line">
            {authors.map((author) => (
              <li key={author.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{author.nameNe}</p>
                  <p className="text-xs text-stone">
                    {author.nameEn || '—'} · <code>{author.slug}</code>
                  </p>
                </div>
                <Link
                  href={cmsCollectionUrl('authors', author.id)}
                  className="text-xs font-semibold text-accent hover:underline"
                >
                  Edit
                </Link>
              </li>
            ))}
          </ul>
          {!authors.length ? (
            <p className="px-4 py-8 text-sm text-stone">No authors yet.</p>
          ) : null}
        </AdminCard>
      )}
    </div>
  )
}

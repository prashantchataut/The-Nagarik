import Link from 'next/link'
import { AdminButton, AdminCard, CmsCanonicalBanner } from '@/components/admin/primitives'
import { cmsCollectionUrl } from '@/lib/admin/nav'
import { listDeskCategories, payloadDeskAvailable } from '@/lib/admin/payload-desk'

export const metadata = {
  title: 'Categories · Newsroom',
  robots: { index: false, follow: false },
}

export default async function AdminCategoriesPage() {
  const connected = payloadDeskAvailable()
  const categories = connected ? await listDeskCategories() : []

  return (
    <div>
      <p className="text-sm font-semibold text-accent">विभाग</p>
      <h1 className="mt-1 text-3xl font-bold">Categories</h1>
      <div className="mt-6">
        <CmsCanonicalBanner onPayload={connected} />
      </div>
      <div className="mt-6">
        <AdminButton href={cmsCollectionUrl('categories')}>Manage in CMS</AdminButton>
      </div>
      {!connected ? (
        <AdminCard className="mt-8">
          <p className="text-sm text-holiday">Connect Postgres to load categories from Payload.</p>
        </AdminCard>
      ) : (
        <AdminCard className="mt-8 !p-0">
          <ul className="divide-y divide-line">
            {categories.map((cat) => (
              <li
                key={cat.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{cat.nameNe}</p>
                  <p className="text-xs text-stone">
                    {cat.nameEn} · <code>{cat.slug}</code>
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/ne/${cat.slug}`}
                    className="text-xs font-semibold text-accent hover:underline"
                  >
                    Reader
                  </Link>
                  <Link
                    href={cmsCollectionUrl('categories', cat.id)}
                    className="text-xs font-semibold text-ink hover:underline"
                  >
                    Edit
                  </Link>
                </div>
              </li>
            ))}
          </ul>
          {!categories.length ? (
            <p className="px-4 py-8 text-sm text-stone">No categories in Payload yet.</p>
          ) : null}
        </AdminCard>
      )}
    </div>
  )
}

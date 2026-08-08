import Link from 'next/link'
import { AdminButton, AdminCard, CmsCanonicalBanner } from '@/components/admin/primitives'
import { getContent } from '@/lib/content'
import { cmsCollectionUrl } from '@/lib/admin/nav'

export const metadata = {
  title: 'Categories · Newsroom',
  robots: { index: false, follow: false },
}

export default async function AdminCategoriesPage() {
  const content = getContent()
  const categories = await content.listCategories()
  const onPayload = content.source === 'payload' && !content.usingDevFixtures

  return (
    <div>
      <p className="text-sm font-semibold text-accent">विभाग</p>
      <h1 className="mt-1 text-3xl font-bold">Categories</h1>
      <div className="mt-6">
        <CmsCanonicalBanner onPayload={onPayload} />
      </div>
      <div className="mt-6">
        <AdminButton href={cmsCollectionUrl('categories')}>Manage in CMS</AdminButton>
      </div>
      <AdminCard className="mt-8 !p-0">
        <ul className="divide-y divide-line">
          {categories.map((cat) => (
            <li key={cat.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{cat.nameNe}</p>
                <p className="text-xs text-stone">
                  {cat.nameEn} · <code>{cat.slug}</code>
                </p>
              </div>
              <Link href={`/ne/${cat.slug}`} className="text-xs font-semibold text-accent hover:underline">
                Reader
              </Link>
            </li>
          ))}
        </ul>
        {!categories.length ? (
          <p className="px-4 py-8 text-sm text-stone">No categories yet.</p>
        ) : null}
      </AdminCard>
    </div>
  )
}

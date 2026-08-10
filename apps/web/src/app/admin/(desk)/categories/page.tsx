import Link from 'next/link'
import {
  AdminButton,
  AdminCard,
  CmsCanonicalBanner,
} from '@/components/admin/primitives'
import { cmsCollectionUrl } from '@/lib/admin/nav'
import { listDeskCategories, payloadDeskAvailable } from '@/lib/admin/payload-desk'
import { CategoryIcon } from '@/components/CategoryIcon'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Categories · Newsroom',
  robots: { index: false, follow: false },
}

export default async function AdminCategoriesPage() {
  const connected = payloadDeskAvailable()
  const categories = connected ? await listDeskCategories() : []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-accent">
            विभाग वर्गीकरण
          </p>
          <h1 className="mt-1 text-2xl font-black text-ink md:text-3xl">
            News Categories & Sections
          </h1>
          <p className="mt-1 text-xs text-stone">
            Manage newsroom editorial categories and navigation taxonomy in Payload CMS.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <AdminButton href={cmsCollectionUrl('categories', 'create')} external>
            + नयाँ विभाग थप्नुहोस्
          </AdminButton>
          <AdminButton href={cmsCollectionUrl('categories')} variant="secondary" external>
            Manage in CMS
          </AdminButton>
        </div>
      </div>

      <CmsCanonicalBanner onPayload={connected} />

      {!connected ? (
        <AdminCard>
          <p className="text-xs text-stone">
            Connect PostgreSQL database to manage categories from Payload.
          </p>
        </AdminCard>
      ) : (
        <div className="surface-card overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-xs">
            <thead className="border-b border-line bg-paper-elevated text-stone uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3">विभाग</th>
                <th className="px-4 py-3">Name (English)</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">कार्यहरू</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-paper-elevated/50 transition-colors">
                  <td className="px-4 py-3 font-bold text-ink">
                    <div className="flex items-center gap-2">
                      <CategoryIcon slug={cat.slug} size={15} weight="bold" />
                      <span>{cat.nameNe}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone">{cat.nameEn || '-'}</td>
                  <td className="px-4 py-3 font-mono text-accent">/{cat.slug}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={cmsCollectionUrl('categories', cat.id)}
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

          {!categories.length ? (
            <div className="p-12 text-center">
              <p className="text-sm font-bold text-ink">कुनै विभाग भेटिएन</p>
              <p className="mt-1 text-xs text-stone">
                Add categories in Payload CMS at /cms.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

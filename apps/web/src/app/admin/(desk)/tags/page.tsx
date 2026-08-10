import Link from 'next/link'
import {
  AdminButton,
  AdminCard,
  CmsCanonicalBanner,
} from '@/components/admin/primitives'
import { cmsCollectionUrl } from '@/lib/admin/nav'
import { listDeskTags, payloadDeskAvailable } from '@/lib/admin/payload-desk'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Tags · Newsroom',
  robots: { index: false, follow: false },
}

export default async function AdminTagsPage() {
  const connected = payloadDeskAvailable()
  const tags = connected ? await listDeskTags() : []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-accent">
            ट्याग व्यवस्थापन
          </p>
          <h1 className="mt-1 text-2xl font-black text-ink md:text-3xl">
            Topic & Story Tags
          </h1>
          <p className="mt-1 text-xs text-stone">
            Manage trending story hashtags and topic categorization in Payload CMS.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <AdminButton href={cmsCollectionUrl('tags', 'create')} external>
            + नयाँ ट्याग थप्नुहोस्
          </AdminButton>
          <AdminButton href={cmsCollectionUrl('tags')} variant="secondary" external>
            Manage in CMS
          </AdminButton>
        </div>
      </div>

      <CmsCanonicalBanner onPayload={connected} />

      {!connected ? (
        <AdminCard>
          <p className="text-xs text-stone">
            Connect PostgreSQL database to manage tags from Payload.
          </p>
        </AdminCard>
      ) : (
        <div className="surface-card overflow-x-auto">
          <table className="w-full min-w-[540px] text-left text-xs">
            <thead className="border-b border-line bg-paper-elevated text-stone uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3">ट्याग नाम</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">कार्यहरू</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tags.map((tag) => (
                <tr key={tag.id} className="hover:bg-paper-elevated/50 transition-colors">
                  <td className="px-4 py-3 font-bold text-ink">#{tag.nameNe}</td>
                  <td className="px-4 py-3 font-mono text-accent">/{tag.slug}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={cmsCollectionUrl('tags', tag.id)}
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

          {!tags.length ? (
            <div className="p-12 text-center">
              <p className="text-sm font-bold text-ink">कुनै ट्याग भेटिएन</p>
              <p className="mt-1 text-xs text-stone">
                Add tags in Payload CMS at /cms.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

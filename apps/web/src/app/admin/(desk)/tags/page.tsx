import Link from 'next/link'
import { AdminButton, AdminCard, CmsCanonicalBanner } from '@/components/admin/primitives'
import { cmsCollectionUrl } from '@/lib/admin/nav'
import { listDeskTags, payloadDeskAvailable } from '@/lib/admin/payload-desk'

export const metadata = {
  title: 'Tags · Newsroom',
  robots: { index: false, follow: false },
}

export default async function AdminTagsPage() {
  const connected = payloadDeskAvailable()
  const tags = connected ? await listDeskTags() : []

  return (
    <div>
      <p className="text-sm font-semibold text-accent">ट्याग</p>
      <h1 className="mt-1 text-3xl font-bold">Tags</h1>
      <p className="mt-2 max-w-[54ch] text-sm text-stone">
        Tags live only in Payload — no shadow taxonomy.
      </p>
      <div className="mt-6">
        <CmsCanonicalBanner onPayload={connected} />
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <AdminButton href={cmsCollectionUrl('tags')}>Open tags in CMS</AdminButton>
        <AdminButton href={cmsCollectionUrl('tags', 'create')} variant="ghost">
          New tag
        </AdminButton>
      </div>
      {!connected ? (
        <AdminCard className="mt-8">
          <p className="text-sm text-holiday">Connect Postgres to list tags.</p>
        </AdminCard>
      ) : (
        <AdminCard className="mt-8 !p-0">
          <ul className="divide-y divide-line">
            {tags.map((tag) => (
              <li
                key={tag.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{tag.nameNe}</p>
                  <p className="text-xs text-stone">
                    {tag.nameEn || '—'} · <code>{tag.slug}</code>
                  </p>
                </div>
                <Link
                  href={cmsCollectionUrl('tags', tag.id)}
                  className="text-xs font-semibold text-accent hover:underline"
                >
                  Edit
                </Link>
              </li>
            ))}
          </ul>
          {!tags.length ? (
            <p className="px-4 py-8 text-sm text-stone">No tags yet.</p>
          ) : null}
        </AdminCard>
      )}
    </div>
  )
}

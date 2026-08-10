import Link from 'next/link'
import {
  AdminButton,
  AdminCard,
  CmsCanonicalBanner,
} from '@/components/admin/primitives'
import { cmsCollectionUrl } from '@/lib/admin/nav'
import { listDeskAuthors, payloadDeskAvailable } from '@/lib/admin/payload-desk'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Authors · Newsroom',
  robots: { index: false, follow: false },
}

export default async function AdminAuthorsPage() {
  const connected = payloadDeskAvailable()
  const authors = connected ? await listDeskAuthors() : []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-accent">
            लेखक व्यवस्थापन
          </p>
          <h1 className="mt-1 text-2xl font-black text-ink md:text-3xl">
            Authors & Journalists
          </h1>
          <p className="mt-1 text-xs text-stone">
            Manage author profiles, bylines, bios, and social links in Payload CMS.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <AdminButton href={cmsCollectionUrl('authors', 'create')} external>
            + नयाँ लेखक थप्नुहोस्
          </AdminButton>
          <AdminButton href={cmsCollectionUrl('authors')} variant="secondary" external>
            Manage in CMS
          </AdminButton>
        </div>
      </div>

      <CmsCanonicalBanner onPayload={connected} />

      {!connected ? (
        <AdminCard>
          <p className="text-xs text-stone">
            Connect PostgreSQL database to manage authors from Payload.
          </p>
        </AdminCard>
      ) : (
        <div className="surface-card overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-xs">
            <thead className="border-b border-line bg-paper-elevated text-stone uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3">नाम (नेपाली)</th>
                <th className="px-4 py-3">Name (English)</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">कार्यहरू</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {authors.map((author) => (
                <tr key={author.id} className="hover:bg-paper-elevated/50 transition-colors">
                  <td className="px-4 py-3 font-bold text-ink">{author.nameNe}</td>
                  <td className="px-4 py-3 text-stone">{author.nameEn || '-'}</td>
                  <td className="px-4 py-3 font-mono text-accent">/{author.slug}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={cmsCollectionUrl('authors', author.id)}
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

          {!authors.length ? (
            <div className="p-12 text-center">
              <p className="text-sm font-bold text-ink">कुनै लेखक भेटिएन</p>
              <p className="mt-1 text-xs text-stone">
                Add authors in Payload CMS at /cms.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

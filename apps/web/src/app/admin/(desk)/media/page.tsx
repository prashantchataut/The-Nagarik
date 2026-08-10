import Link from 'next/link'
import {
  AdminButton,
  AdminCard,
  CmsCanonicalBanner,
} from '@/components/admin/primitives'
import { cmsCollectionUrl } from '@/lib/admin/nav'
import { listDeskMedia, payloadDeskAvailable } from '@/lib/admin/payload-desk'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Media · Newsroom',
  robots: { index: false, follow: false },
}

export default async function AdminMediaPage() {
  const connected = payloadDeskAvailable()
  const media = connected ? await listDeskMedia() : []
  const hasBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim())

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-accent">
            मिडिया व्यवस्थापन
          </p>
          <h1 className="mt-1 text-2xl font-black text-ink md:text-3xl">
            Media Library
          </h1>
          <p className="mt-1 text-xs text-stone">
            Newsroom photography and media assets with enforced alt text and photo credits in Payload CMS.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <AdminButton href={cmsCollectionUrl('media', 'create')} external>
            + मिडिया अपलोड गर्नुहोस्
          </AdminButton>
          <AdminButton href={cmsCollectionUrl('media')} variant="secondary" external>
            Open Media in CMS
          </AdminButton>
        </div>
      </div>

      <CmsCanonicalBanner onPayload={connected} />

      {!connected ? (
        <AdminCard>
          <p className="text-xs text-stone">
            Connect PostgreSQL database to manage media from Payload.
          </p>
        </AdminCard>
      ) : (
        <div className="surface-card overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-xs">
            <thead className="border-b border-line bg-paper-elevated text-stone uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3">फाइल / विवरण</th>
                <th className="px-4 py-3">Filename</th>
                <th className="px-4 py-3">Alt Text</th>
                <th className="px-4 py-3">कार्यहरू</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {media.map((item) => (
                <tr key={item.id} className="hover:bg-paper-elevated/50 transition-colors">
                  <td className="px-4 py-3 font-bold text-ink">{item.alt || item.filename}</td>
                  <td className="px-4 py-3 font-mono text-stone">{item.filename}</td>
                  <td className="px-4 py-3">
                    {item.alt ? (
                      <span className="text-success font-semibold">✓ Provided</span>
                    ) : (
                      <span className="text-holiday font-bold">⚠ Missing Alt</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={cmsCollectionUrl('media', item.id)}
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

          {!media.length ? (
            <div className="p-12 text-center">
              <p className="text-sm font-bold text-ink">कुनै मिडिया फाइल भेटिएन</p>
              <p className="mt-1 text-xs text-stone">
                Upload images and photography in Payload CMS at /cms.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

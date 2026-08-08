import Link from 'next/link'
import { AdminButton, AdminCard, CmsCanonicalBanner } from '@/components/admin/primitives'
import { cmsCollectionUrl } from '@/lib/admin/nav'
import { listDeskMedia, payloadDeskAvailable } from '@/lib/admin/payload-desk'

export const metadata = {
  title: 'Media · Newsroom',
  robots: { index: false, follow: false },
}

export default async function AdminMediaPage() {
  const connected = payloadDeskAvailable()
  const media = connected ? await listDeskMedia() : []
  const hasBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim())

  return (
    <div>
      <p className="text-sm font-semibold text-accent">मिडिया</p>
      <h1 className="mt-1 text-3xl font-bold">Media library</h1>
      <p className="mt-2 max-w-[54ch] text-sm text-stone">
        Alt text and credit are enforced in Payload publish gates. Upload in CMS
        {hasBlob ? ' (Vercel Blob)' : ' (local disk until Blob token is set)'}.
      </p>
      <div className="mt-6">
        <CmsCanonicalBanner onPayload={connected} />
      </div>
      <div className="mt-6">
        <AdminButton href={cmsCollectionUrl('media')}>Open media in CMS</AdminButton>
      </div>
      {!connected ? (
        <AdminCard className="mt-8">
          <p className="text-sm text-holiday">Connect Postgres to browse media from Payload.</p>
        </AdminCard>
      ) : (
        <AdminCard className="mt-8 !p-0">
          <ul className="divide-y divide-line">
            {media.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.alt || item.filename}</p>
                  <p className="text-xs text-stone">
                    <code>{item.filename}</code>
                    {!item.alt ? ' · missing alt' : ''}
                  </p>
                </div>
                <Link
                  href={cmsCollectionUrl('media', item.id)}
                  className="text-xs font-semibold text-accent hover:underline"
                >
                  Edit
                </Link>
              </li>
            ))}
          </ul>
          {!media.length ? (
            <p className="px-4 py-8 text-sm text-stone">No media uploaded yet.</p>
          ) : null}
        </AdminCard>
      )}
    </div>
  )
}

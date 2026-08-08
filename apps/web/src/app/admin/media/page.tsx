import { AdminButton, CmsCanonicalBanner } from '@/components/admin/primitives'
import { getContent } from '@/lib/content'
import { cmsCollectionUrl } from '@/lib/admin/nav'

export const metadata = {
  title: 'Media · Newsroom',
  robots: { index: false, follow: false },
}

export default async function AdminMediaPage() {
  const content = getContent()
  const onPayload = content.source === 'payload' && !content.usingDevFixtures
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
        <CmsCanonicalBanner onPayload={onPayload} />
      </div>
      <div className="mt-6">
        <AdminButton href={cmsCollectionUrl('media')}>Open media in CMS</AdminButton>
      </div>
    </div>
  )
}

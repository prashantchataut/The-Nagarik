import { AdminButton, CmsCanonicalBanner } from '@/components/admin/primitives'
import { getContent } from '@/lib/content'
import { cmsCollectionUrl } from '@/lib/admin/nav'

export const metadata = {
  title: 'Tags · Newsroom',
  robots: { index: false, follow: false },
}

export default async function AdminTagsPage() {
  const content = getContent()
  const onPayload = content.source === 'payload' && !content.usingDevFixtures

  return (
    <div>
      <p className="text-sm font-semibold text-accent">ट्याग</p>
      <h1 className="mt-1 text-3xl font-bold">Tags</h1>
      <p className="mt-2 max-w-[54ch] text-sm text-stone">
        Tags are managed only in Payload (no JSON shadow). Open CMS to create or rename.
      </p>
      <div className="mt-6">
        <CmsCanonicalBanner onPayload={onPayload} />
      </div>
      <div className="mt-6">
        <AdminButton href={cmsCollectionUrl('tags')}>Open tags in CMS</AdminButton>
      </div>
    </div>
  )
}

import { AdminButton, AdminCard, CmsCanonicalBanner } from '@/components/admin/primitives'
import { getContent } from '@/lib/content'
import { cmsCollectionUrl } from '@/lib/admin/nav'

export const metadata = {
  title: 'Authors · Newsroom',
  robots: { index: false, follow: false },
}

export default async function AdminAuthorsPage() {
  const content = getContent()
  const authors = await content.listAuthors()
  const onPayload = content.source === 'payload' && !content.usingDevFixtures

  return (
    <div>
      <p className="text-sm font-semibold text-accent">लेखक</p>
      <h1 className="mt-1 text-3xl font-bold">Authors</h1>
      <div className="mt-6">
        <CmsCanonicalBanner onPayload={onPayload} />
      </div>
      <div className="mt-6">
        <AdminButton href={cmsCollectionUrl('authors')}>Manage in CMS</AdminButton>
      </div>
      <AdminCard className="mt-8 !p-0">
        <ul className="divide-y divide-line">
          {authors.map((author) => (
            <li key={author.id} className="px-4 py-3 text-sm">
              <p className="font-medium">{author.nameNe}</p>
              <p className="text-xs text-stone">
                {author.nameEn ?? '—'} · <code>{author.slug}</code>
              </p>
            </li>
          ))}
        </ul>
        {!authors.length ? (
          <p className="px-4 py-8 text-sm text-stone">No authors yet.</p>
        ) : null}
      </AdminCard>
    </div>
  )
}

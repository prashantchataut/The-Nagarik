import Link from 'next/link'
import { AdminButton, AdminCard, CmsCanonicalBanner } from '@/components/admin/primitives'
import { cmsArticleCreateUrl, cmsArticleEditUrl, cmsCollectionUrl } from '@/lib/admin/nav'
import {
  listDeskPublishedStories,
  payloadDeskAvailable,
} from '@/lib/admin/payload-desk'

export const metadata = {
  title: 'Articles · Newsroom',
  robots: { index: false, follow: false },
}

export default async function AdminArticlesPage() {
  const connected = payloadDeskAvailable()
  const stories = connected ? await listDeskPublishedStories() : []

  return (
    <div>
      <p className="text-sm font-semibold text-accent">समाचार</p>
      <h1 className="mt-1 text-3xl font-bold">Published articles</h1>
      <p className="mt-2 max-w-[54ch] text-sm text-stone">
        Payload-only list. Create, edit, and schedule in CMS — this desk does not shadow-store
        articles.
      </p>

      <div className="mt-6">
        <CmsCanonicalBanner onPayload={connected} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <AdminButton href={cmsArticleCreateUrl()}>नयाँ लेख</AdminButton>
        <AdminButton href={cmsCollectionUrl('articles')} variant="ghost">
          Open Payload list
        </AdminButton>
        <AdminButton href="/admin/queue" variant="ghost">
          Editorial queue
        </AdminButton>
      </div>

      {!connected ? (
        <AdminCard className="mt-8">
          <p className="text-sm text-holiday">
            Connect Postgres to list published stories. Fixtures are never shown here.
          </p>
        </AdminCard>
      ) : (
        <AdminCard className="mt-8 !p-0 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line bg-paper text-xs uppercase tracking-wide text-stone">
              <tr>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Section</th>
                <th className="px-4 py-3 font-semibold">Flags</th>
                <th className="px-4 py-3 font-semibold">Published</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {stories.map((story) => (
                <tr key={story.id}>
                  <td className="px-4 py-3 font-medium">{story.titleNe}</td>
                  <td className="px-4 py-3 text-stone">{story.categorySlug}</td>
                  <td className="px-4 py-3">
                    {story.isBreaking ? (
                      <span className="text-xs font-semibold text-holiday">breaking</span>
                    ) : (
                      <span className="text-xs text-stone">—</span>
                    )}
                    {story.hasEnglish ? (
                      <span className="ml-2 text-xs text-accent">EN</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-stone tabular-nums">
                    {story.publishedAt
                      ? new Date(story.publishedAt).toLocaleDateString('en-NP')
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/ne/${story.categorySlug}/${story.slug}`}
                        className="text-xs font-semibold text-accent hover:underline"
                      >
                        View
                      </Link>
                      <Link
                        href={cmsArticleEditUrl(story.id)}
                        className="text-xs font-semibold text-ink hover:underline"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!stories.length ? (
            <p className="px-4 py-10 text-sm text-stone">
              No published stories in Payload yet. Publish from{' '}
              <Link href={cmsCollectionUrl('articles')} className="text-accent underline">
                /cms
              </Link>
              .
            </p>
          ) : null}
        </AdminCard>
      )}
    </div>
  )
}

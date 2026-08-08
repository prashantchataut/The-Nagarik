import Link from 'next/link'
import { AdminButton, AdminCard, CmsCanonicalBanner } from '@/components/admin/primitives'
import { getContent } from '@/lib/content'
import { cmsArticleCreateUrl, cmsArticleEditUrl, cmsCollectionUrl } from '@/lib/admin/nav'

export const metadata = {
  title: 'Articles · Newsroom',
  robots: { index: false, follow: false },
}

export default async function AdminArticlesPage() {
  const content = getContent()
  const articles = await content.listPublishedArticles({ locale: 'ne' })
  const cards = await Promise.all(articles.map((a) => content.toStoryCard(a, 'ne')))
  const onPayload = content.source === 'payload' && !content.usingDevFixtures

  return (
    <div>
      <p className="text-sm font-semibold text-accent">समाचार</p>
      <h1 className="mt-1 text-3xl font-bold">Published articles</h1>
      <p className="mt-2 max-w-[54ch] text-sm text-stone">
        Read-only desk list from the content façade. Create/edit/schedule in Payload — same split
        Watch uses when Payload is canonical.
      </p>

      <div className="mt-6">
        <CmsCanonicalBanner onPayload={onPayload} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <AdminButton href={cmsArticleCreateUrl()}>नयाँ लेख</AdminButton>
        <AdminButton href={cmsCollectionUrl('articles')} variant="ghost">
          Open Payload list
        </AdminButton>
      </div>

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
            {cards.map((story) => (
              <tr key={story.id}>
                <td className="px-4 py-3 font-medium">{story.title}</td>
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
                    {onPayload ? (
                      <Link
                        href={cmsArticleEditUrl(story.id)}
                        className="text-xs font-semibold text-ink hover:underline"
                      >
                        Edit
                      </Link>
                    ) : (
                      <Link
                        href={cmsCollectionUrl('articles')}
                        className="text-xs font-semibold text-ink hover:underline"
                      >
                        CMS
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!cards.length ? (
          <p className="px-4 py-10 text-sm text-stone">No published stories in the current content source.</p>
        ) : null}
      </AdminCard>
    </div>
  )
}

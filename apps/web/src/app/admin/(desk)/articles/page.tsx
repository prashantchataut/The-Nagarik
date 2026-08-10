import Link from 'next/link'
import {
  AdminButton,
  AdminCard,
  AdminStatusPill,
  CmsCanonicalBanner,
} from '@/components/admin/primitives'
import { cmsArticleCreateUrl, cmsArticleEditUrl, cmsCollectionUrl } from '@/lib/admin/nav'
import {
  listDeskPublishedStories,
  payloadDeskAvailable,
} from '@/lib/admin/payload-desk'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Articles · Newsroom',
  robots: { index: false, follow: false },
}

export default async function AdminArticlesPage() {
  const connected = payloadDeskAvailable()
  const stories = connected ? await listDeskPublishedStories(100) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-accent">
            समाचार व्यवस्थापन
          </p>
          <h1 className="mt-1 text-2xl font-black text-ink md:text-3xl">
            Published Articles
          </h1>
          <p className="mt-1 text-xs text-stone">
            All active published journalism from Payload CMS.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <AdminButton href={cmsArticleCreateUrl()} external>
            + नयाँ लेख सिर्जना
          </AdminButton>
          <AdminButton href={cmsCollectionUrl('articles')} variant="secondary" external>
            Open Payload List
          </AdminButton>
        </div>
      </div>

      <CmsCanonicalBanner onPayload={connected} />

      {!connected ? (
        <AdminCard>
          <p className="text-xs text-stone">
            Connect PostgreSQL database to list published stories from Payload.
          </p>
        </AdminCard>
      ) : (
        <div className="surface-card overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead className="border-b border-line bg-paper-elevated text-stone uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3">शीर्षक</th>
                <th className="px-4 py-3">विभाग</th>
                <th className="px-4 py-3">फ्ल्याग</th>
                <th className="px-4 py-3">प्रकाशित मिति</th>
                <th className="px-4 py-3">कार्यहरू</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {stories.map((story) => (
                <tr key={story.id} className="hover:bg-paper-elevated/50 transition-colors">
                  <td className="px-4 py-3 font-bold text-ink max-w-[320px] truncate">
                    {story.isBreaking ? (
                      <span className="mr-2 rounded bg-danger px-1.5 py-0.5 text-[0.65rem] font-extrabold text-danger-fg">
                        ब्रेकिङ
                      </span>
                    ) : null}
                    <span>{story.titleNe}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-accent capitalize">
                    {story.categorySlug}
                  </td>
                  <td className="px-4 py-3">
                    {story.hasEnglish ? (
                      <span className="rounded bg-accent-muted px-1.5 py-0.5 text-[0.65rem] font-bold text-accent">
                        EN
                      </span>
                    ) : (
                      <span className="text-stone text-[0.7rem] font-medium">NE only</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone tabular-nums">
                    {story.publishedAt
                      ? new Date(story.publishedAt).toLocaleDateString('ne-NP')
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 font-bold">
                      <Link
                        href={`/ne/${story.categorySlug}/${story.slug}`}
                        target="_blank"
                        className="text-accent hover:underline"
                      >
                        View
                      </Link>
                      <Link
                        href={cmsArticleEditUrl(story.id)}
                        target="_blank"
                        className="text-ink hover:underline"
                      >
                        Edit in CMS
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!stories.length ? (
            <div className="p-12 text-center">
              <p className="text-sm font-bold text-ink">कुनै प्रकाशित समाचार छैन</p>
              <p className="mt-1 text-xs text-stone">
                Publish articles from Payload CMS at /cms.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

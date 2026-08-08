import Link from 'next/link'
import { AdminButton, AdminCard, CmsCanonicalBanner } from '@/components/admin/primitives'
import { getContent } from '@/lib/content'
import { getDeskEditorialQueue, payloadDeskAvailable } from '@/lib/admin/payload-desk'
import { cmsArticleEditUrl, cmsCollectionUrl } from '@/lib/admin/nav'

export const metadata = {
  title: 'Editorial queue · Newsroom',
  robots: { index: false, follow: false },
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  in_review: 'In review',
  scheduled: 'Scheduled',
}

export default async function AdminQueuePage() {
  const content = getContent()
  const onPayload = content.source === 'payload' && !content.usingDevFixtures
  const connected = payloadDeskAvailable()
  const queue = connected ? await getDeskEditorialQueue() : []

  return (
    <div>
      <p className="text-sm font-semibold text-accent">सम्पादकीय कतार</p>
      <h1 className="mt-1 text-3xl font-bold">Editorial queue</h1>
      <p className="mt-2 max-w-[54ch] text-sm text-stone">
        Drafts, in-review, and scheduled stories from Payload (Watch journalist-inbox pattern,
        without a shadow store).
      </p>

      <div className="mt-6">
        <CmsCanonicalBanner onPayload={onPayload} />
      </div>

      {!connected ? (
        <AdminCard className="mt-8">
          <p className="text-sm text-holiday">
            DATABASE_URL + PAYLOAD_SECRET required to load the queue. Start{' '}
            <code>local:pg</code> or set Neon, then refresh.
          </p>
        </AdminCard>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-3">
            <AdminButton href={cmsCollectionUrl('articles')}>Open articles in CMS</AdminButton>
          </div>
          <AdminCard className="mt-8 !p-0 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-line bg-paper text-xs uppercase tracking-wide text-stone">
                <tr>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Section</th>
                  <th className="px-4 py-3 font-semibold">Updated</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {queue.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium">
                      {item.isBreaking ? (
                        <span className="mr-2 text-xs font-semibold text-holiday">ब्रेकिङ</span>
                      ) : null}
                      {item.titleNe}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-[var(--radius-control)] bg-paper px-2 py-0.5 text-xs font-semibold">
                        {STATUS_LABEL[item.status] ?? item.status}
                      </span>
                      {item.englishStatus === 'published' ? (
                        <span className="ml-2 text-xs text-accent">EN</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-stone">{item.categoryLabel}</td>
                    <td className="px-4 py-3 text-stone tabular-nums">
                      {item.updatedAt
                        ? new Date(item.updatedAt).toLocaleString('en-NP')
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={cmsArticleEditUrl(item.id)}
                        className="text-xs font-semibold text-accent hover:underline"
                      >
                        Edit in CMS
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!queue.length ? (
              <p className="px-4 py-10 text-sm text-stone">
                Queue empty — no draft, in-review, or scheduled articles.
              </p>
            ) : null}
          </AdminCard>
        </>
      )}
    </div>
  )
}

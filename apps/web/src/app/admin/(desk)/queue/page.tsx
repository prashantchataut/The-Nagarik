import Link from 'next/link'
import {
  AdminButton,
  AdminCard,
  AdminStatusPill,
  CmsCanonicalBanner,
} from '@/components/admin/primitives'
import { CommentModerationPanel } from '@/components/admin/CommentModerationPanel'
import { JournalistApplicationsPanel } from '@/components/admin/JournalistApplicationsPanel'
import { getDeskEditorialQueue, payloadDeskAvailable } from '@/lib/admin/payload-desk'
import { cmsArticleCreateUrl, cmsArticleEditUrl, cmsCollectionUrl } from '@/lib/admin/nav'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Editorial Queue · Newsroom',
  robots: { index: false, follow: false },
}

export default async function AdminQueuePage() {
  const connected = payloadDeskAvailable()
  const queue = connected ? await getDeskEditorialQueue() : []

  const inReview = queue.filter((i) => i.status === 'in_review')
  const drafts = queue.filter((i) => i.status === 'draft')
  const scheduled = queue.filter((i) => i.status === 'scheduled')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-accent">
            सम्पादकीय व्यवस्थापन
          </p>
          <h1 className="mt-1 text-2xl font-black text-ink md:text-3xl">
            Editorial Queue
          </h1>
          <p className="mt-1 text-xs text-stone">
            Articles in review, scheduled for publication, or pending revision in Payload CMS.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <AdminButton href={cmsArticleCreateUrl()} external>
            + नयाँ मस्यौदा
          </AdminButton>
          <AdminButton href={cmsCollectionUrl('articles')} variant="secondary" external>
            Open Articles in CMS
          </AdminButton>
        </div>
      </div>

      <CmsCanonicalBanner onPayload={connected} />

      {/* Summary Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-accent-muted px-3 py-1 font-bold text-accent">
          All Queue ({queue.length})
        </span>
        <span className="rounded-full bg-warning-muted px-3 py-1 font-bold text-warning">
          In Review ({inReview.length})
        </span>
        <span className="rounded-full bg-paper-strong px-3 py-1 font-bold text-stone">
          Drafts ({drafts.length})
        </span>
        <span className="rounded-full bg-success-muted px-3 py-1 font-bold text-success">
          Scheduled ({scheduled.length})
        </span>
      </div>

      {!connected ? (
        <AdminCard>
          <p className="text-xs text-stone">
            DATABASE_URL + PAYLOAD_SECRET required to load the queue from Payload.
          </p>
        </AdminCard>
      ) : (
        <div className="surface-card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="border-b border-line bg-paper-elevated text-stone uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3">शीर्षक</th>
                <th className="px-4 py-3">स्थिति</th>
                <th className="px-4 py-3">विभाग</th>
                <th className="px-4 py-3">अन्तिम अद्यावधिक</th>
                <th className="px-4 py-3">कार्यहरू</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {queue.map((item) => (
                <tr key={item.id} className="hover:bg-paper-elevated/50 transition-colors">
                  <td className="px-4 py-3 font-bold text-ink">
                    {item.isBreaking ? (
                      <span className="mr-2 rounded bg-danger px-1.5 py-0.5 text-[0.65rem] font-black text-danger-fg">
                        ब्रेकिङ
                      </span>
                    ) : null}
                    <span>{item.titleNe}</span>
                  </td>
                  <td className="px-4 py-3">
                    <AdminStatusPill status={item.status} />
                    {item.englishStatus === 'published' ? (
                      <span className="ml-2 rounded bg-accent-muted px-1.5 py-0.5 text-[0.65rem] font-bold text-accent">
                        EN
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-semibold text-stone">
                    {item.categoryLabel}
                  </td>
                  <td className="px-4 py-3 text-stone tabular-nums">
                    {item.updatedAt
                      ? new Date(item.updatedAt).toLocaleString('ne-NP')
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={cmsArticleEditUrl(item.id)}
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

          {!queue.length ? (
            <div className="p-12 text-center">
              <p className="text-sm font-bold text-ink">सम्पादकीय कतार खाली छ</p>
              <p className="mt-1 text-xs text-stone">
                No draft, in-review, or scheduled articles pending.
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* Journalist onboarding queue */}
      <JournalistApplicationsPanel />

      {/* Reader comment moderation queue */}
      <CommentModerationPanel />
    </div>
  )
}

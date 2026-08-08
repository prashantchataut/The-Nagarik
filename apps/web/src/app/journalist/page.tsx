import Link from 'next/link'
import {
  AdminButton,
  AdminCard,
  AdminMetric,
  CmsCanonicalBanner,
} from '@/components/admin/primitives'
import {
  getJournalistStatusCounts,
  listJournalistStories,
} from '@/lib/journalist/desk'
import { requireContributorSession, journalistSeesAllStories } from '@/lib/journalist/session'
import { payloadDeskAvailable } from '@/lib/admin/payload-desk'

export const metadata = {
  title: 'Journalist desk · द नागरिक',
  robots: { index: false, follow: false },
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  in_review: 'In review',
  scheduled: 'Scheduled',
  published: 'Published',
  retracted: 'Retracted',
}

export default async function JournalistDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const query = await searchParams
  const statusFilter =
    typeof query.status === 'string' && query.status in STATUS_LABEL ? query.status : undefined

  const session = await requireContributorSession('/journalist')
  const connected = payloadDeskAvailable()
  const counts = connected ? await getJournalistStatusCounts(session) : null
  const stories = connected
    ? await listJournalistStories(session, { status: statusFilter })
    : []
  const seesAll = journalistSeesAllStories(session)

  return (
    <div>
      <p className="text-sm font-semibold text-accent">पत्रकार डेस्क</p>
      <h1 className="mt-1 text-3xl font-bold tracking-[-0.03em]">My stories</h1>
      <p className="mt-2 max-w-[54ch] text-sm text-stone">
        Write drafts, submit for review, track status. Body uses newsroom blocks (not a second CMS).
        {seesAll ? ' Editors see the full inbox here.' : ' Showing stories you created.'}
      </p>

      <div className="mt-6">
        <CmsCanonicalBanner onPayload={connected} />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetric label="Draft" value={counts?.draft ?? '—'} href="/journalist?status=draft" />
        <AdminMetric
          label="In review"
          value={counts?.in_review ?? '—'}
          href="/journalist?status=in_review"
          tone="accent"
        />
        <AdminMetric
          label="Published"
          value={counts?.published ?? '—'}
          href="/journalist?status=published"
        />
        <AdminMetric
          label="Retracted"
          value={counts?.retracted ?? '—'}
          href="/journalist?status=retracted"
          tone="danger"
        />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <AdminButton href="/journalist/compose">नयाँ लेख</AdminButton>
        <AdminButton href="/admin/queue" variant="ghost">
          Editorial queue
        </AdminButton>
        <AdminButton href="/cms/collections/articles" variant="ghost">
          Open in CMS
        </AdminButton>
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
            {stories.map((story) => (
              <tr key={story.id}>
                <td className="px-4 py-3 font-medium">
                  {story.isBreaking ? (
                    <span className="mr-2 text-xs font-semibold text-holiday">ब्रेकिङ</span>
                  ) : null}
                  {story.titleNe}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-[var(--radius-control)] bg-paper px-2 py-0.5 text-xs font-semibold">
                    {STATUS_LABEL[story.status] ?? story.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-stone">{story.categorySlug}</td>
                <td className="px-4 py-3 text-stone tabular-nums">
                  {story.updatedAt ? new Date(story.updatedAt).toLocaleString('en-NP') : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/journalist/compose/${story.id}`}
                      className="text-xs font-semibold text-accent hover:underline"
                    >
                      Edit
                    </Link>
                    {story.status === 'published' ? (
                      <Link
                        href={`/ne/${story.categorySlug}/${story.slug}`}
                        className="text-xs font-semibold text-ink hover:underline"
                      >
                        View
                      </Link>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!stories.length ? (
          <p className="px-4 py-10 text-sm text-stone">
            No stories yet.{' '}
            <Link href="/journalist/compose" className="text-accent underline">
              Start a draft
            </Link>
            .
          </p>
        ) : null}
      </AdminCard>
    </div>
  )
}

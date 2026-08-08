import Link from 'next/link'
import {
  AdminButton,
  AdminCard,
  AdminMetric,
  CmsCanonicalBanner,
} from '@/components/admin/primitives'
import { getAdminDashboardSnapshot } from '@/lib/admin/dashboard'
import { cmsArticleCreateUrl, cmsCollectionUrl } from '@/lib/admin/nav'

export const metadata = {
  title: 'Dashboard · Newsroom',
  robots: { index: false, follow: false },
}

export default async function AdminDashboardPage() {
  const snap = await getAdminDashboardSnapshot()
  const onPayload = snap.contentSource === 'payload' && !snap.usingDevFixtures

  return (
    <div>
      <p className="text-sm font-semibold text-accent">ड्यासबोर्ड</p>
      <h1 className="mt-1 text-3xl font-bold tracking-[-0.03em]">Newsroom overview</h1>
      <p className="mt-2 max-w-[54ch] text-sm text-stone">
        Same desk shape as Nagarik Watch — dashboard + deep links — without a second article
        editor. Publish in Payload.
      </p>

      <div className="mt-6">
        <CmsCanonicalBanner onPayload={onPayload} />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetric label="प्रकाशित" value={snap.publishedTotal} href="/admin/articles" tone="accent" />
        <AdminMetric label="ब्रेकिङ" value={snap.breakingCount} href="/admin/articles" tone="danger" />
        <AdminMetric
          label="कतार"
          value={
            snap.statusCounts
              ? snap.statusCounts.draft + snap.statusCounts.in_review + snap.statusCounts.scheduled
              : '—'
          }
          href="/admin/queue"
        />
        <AdminMetric label="विभाग" value={snap.categoryCount} href="/admin/categories" />
      </div>

      {snap.statusCounts ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(
            [
              ['Draft', snap.statusCounts.draft],
              ['In review', snap.statusCounts.in_review],
              ['Scheduled', snap.statusCounts.scheduled],
              ['Published', snap.statusCounts.published],
              ['Retracted', snap.statusCounts.retracted],
            ] as const
          ).map(([label, value]) => (
            <AdminCard key={label}>
              <p className="text-xs uppercase tracking-wide text-stone">{label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
            </AdminCard>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-xs text-stone">
          Workflow counts appear when DATABASE_URL is connected
          {snap.payloadConnected ? '' : ' (not connected)'}.
        </p>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <AdminButton href={cmsArticleCreateUrl()}>नयाँ लेख (/cms)</AdminButton>
        <AdminButton href="/admin/queue" variant="ghost">
          Editorial queue
        </AdminButton>
        <AdminButton href={cmsCollectionUrl('articles')} variant="ghost">
          Articles in CMS
        </AdminButton>
        <AdminButton href="/admin/launch" variant="ghost">
          Launch check
        </AdminButton>
        <AdminButton href="/admin/algorithms" variant="ghost">
          Algorithms
        </AdminButton>
      </div>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-xl font-semibold">Recent published</h2>
          <Link href="/admin/articles" className="text-sm font-medium text-accent hover:underline">
            All →
          </Link>
        </div>
        <AdminCard className="mt-4 !p-0">
          {snap.recent.length ? (
            <ul className="divide-y divide-line">
              {snap.recent.map((story) => (
                <li key={story.id} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
                  <div className="min-w-0">
                    {story.isBreaking ? (
                      <span className="mr-2 text-xs font-semibold text-holiday">ब्रेकिङ</span>
                    ) : null}
                    <Link
                      href={`/ne/${story.categorySlug}/${story.slug}`}
                      className="font-medium hover:text-accent"
                    >
                      {story.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-stone">
                      /{story.categorySlug}/{story.slug}
                      {story.publishedAt
                        ? ` · ${new Date(story.publishedAt).toLocaleString('en-NP')}`
                        : ''}
                    </p>
                  </div>
                  <Link
                    href={cmsCollectionUrl('articles')}
                    className="shrink-0 text-xs font-semibold text-accent hover:underline"
                  >
                    Edit in CMS
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-8 text-sm text-stone">
              No published articles yet. Run seed or publish from{' '}
              <Link href={cmsCollectionUrl('articles')} className="text-accent underline">
                /cms
              </Link>
              .
            </p>
          )}
        </AdminCard>
        <p className="mt-3 text-xs text-stone">{snap.scheduledHint}</p>
      </section>
    </div>
  )
}

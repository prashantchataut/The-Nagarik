import Link from 'next/link'
import {
  AdminButton,
  AdminCard,
  AdminMetric,
  AdminStatusPill,
  CmsCanonicalBanner,
} from '@/components/admin/primitives'
import { cmsArticleCreateUrl, cmsCollectionUrl } from '@/lib/admin/nav'
import { getAdminDashboardSnapshot } from '@/lib/admin/dashboard'
import { payloadDeskAvailable } from '@/lib/admin/payload-desk'
import { Article, CaretRight, CheckCircle, Clock, FileText, Folder, Users, Video } from '@phosphor-icons/react/dist/ssr'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Dashboard · Newsroom',
  robots: { index: false, follow: false },
}

export default async function AdminDashboardPage() {
  const connected = payloadDeskAvailable()
  const snapshot = await getAdminDashboardSnapshot()

  const inReviewCount = snapshot.statusCounts?.in_review ?? 0
  const draftCount = snapshot.statusCounts?.draft ?? 0
  const scheduledCount = snapshot.statusCounts?.scheduled ?? 0
  const queueTotal = inReviewCount + draftCount + scheduledCount

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-accent">
            न्युजरुम ड्यासबोर्ड
          </p>
          <h1 className="mt-1 text-2xl font-black text-ink md:text-3xl">
            Newsroom Desk
          </h1>
          <p className="mt-1 text-xs text-stone">
            Overview of publishing pipeline, editorial queue, and content operations.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <AdminButton href={cmsArticleCreateUrl()} external>
            + नयाँ लेख सिर्जना
          </AdminButton>
          <AdminButton href="/admin/queue" variant="secondary">
            सम्पादकीय कतार ({queueTotal})
          </AdminButton>
        </div>
      </div>

      {/* CMS Connection Banner */}
      <CmsCanonicalBanner onPayload={connected} />

      {/* Key Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetric
          label="प्रकाशित समाचार"
          value={snapshot.publishedTotal}
          href="/admin/articles"
          tone="accent"
          sublabel="Live in reader view"
        />

        <AdminMetric
          label="ब्रेकिङ समाचार"
          value={snapshot.breakingCount}
          href="/admin/articles"
          tone={snapshot.breakingCount > 0 ? 'danger' : 'default'}
          sublabel="Pulsing ticker active"
        />

        <AdminMetric
          label="सम्पादकीय कतार"
          value={queueTotal}
          href="/admin/queue"
          tone={queueTotal > 0 ? 'warning' : 'default'}
          sublabel={`${inReviewCount} in review · ${draftCount} drafts`}
        />

        <AdminMetric
          label="सक्रिय लेखक तथा विभाग"
          value={`${snapshot.authorCount} / ${snapshot.categoryCount}`}
          href="/admin/authors"
          sublabel="Authors & Sections"
        />
      </div>

      {/* Quick CMS Collections Jump */}
      <div>
        <h2 className="text-sm font-black uppercase tracking-wider text-stone mb-3">
          Payload CMS संग्रहहरू
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Articles', desc: 'समाचार सामग्री व्यवस्थापन', href: cmsCollectionUrl('articles'), icon: Article },
            { label: 'Media Library', desc: 'तस्बिर तथा फाइल अपलोड', href: cmsCollectionUrl('media'), icon: Video },
            { label: 'Authors', desc: 'पत्रकार तथा लेखक प्रोफाइल', href: cmsCollectionUrl('authors'), icon: Users },
            { label: 'Categories', desc: 'समाचार विभाग तथा वर्गीकरण', href: cmsCollectionUrl('categories'), icon: Folder },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="surface-card flex items-center justify-between p-4 group hover:border-accent hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] bg-paper-elevated text-accent group-hover:bg-accent group-hover:text-accent-fg transition-colors">
                  <item.icon size={18} weight="bold" />
                </span>
                <div>
                  <p className="text-sm font-bold text-ink group-hover:text-accent transition-colors">
                    {item.label}
                  </p>
                  <p className="text-[0.7rem] text-stone">{item.desc}</p>
                </div>
              </div>
              <CaretRight size={14} weight="bold" className="text-stone group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Published Articles Table */}
      <div>
        <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
          <h2 className="text-base font-black text-ink">
            पछिल्ला प्रकाशित समाचार
          </h2>
          <Link
            href="/admin/articles"
            className="text-xs font-bold text-accent hover:underline"
          >
            सबै हेर्नुहोस् →
          </Link>
        </div>

        {!connected ? (
          <AdminCard>
            <p className="text-xs text-stone">
              Connect PostgreSQL database to load published articles from Payload.
            </p>
          </AdminCard>
        ) : snapshot.recent.length ? (
          <div className="surface-card overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="border-b border-line bg-paper-elevated text-stone uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-4 py-3">शीर्षक</th>
                  <th className="px-4 py-3">विभाग</th>
                  <th className="px-4 py-3">स्थिति</th>
                  <th className="px-4 py-3">प्रकाशित मिति</th>
                  <th className="px-4 py-3">कार्यहरू</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {snapshot.recent.map((story) => (
                  <tr key={story.id} className="hover:bg-paper-elevated/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-ink">
                      {story.isBreaking ? (
                        <span className="mr-2 rounded bg-danger px-1.5 py-0.5 text-[0.65rem] font-extrabold text-danger-fg">
                          ब्रेकिङ
                        </span>
                      ) : null}
                      <span>{story.title}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-accent capitalize">
                      {story.categorySlug}
                    </td>
                    <td className="px-4 py-3">
                      <AdminStatusPill status="published" />
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
                          href={cmsCollectionUrl('articles', story.id)}
                          target="_blank"
                          className="text-ink hover:underline"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminCard>
            <p className="text-xs text-stone">
              No published articles in Payload yet. Create your first article in /cms.
            </p>
          </AdminCard>
        )}
      </div>
    </div>
  )
}

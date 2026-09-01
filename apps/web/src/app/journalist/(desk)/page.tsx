import Link from 'next/link'
import {
  NotePencil,
  FileText,
  Clock,
  CheckCircle,
  Hourglass,
  ArrowSquareOut,
} from '@phosphor-icons/react/dist/ssr'
import { requireContributorSession } from '@/lib/journalist/session'
import {
  getJournalistStatusCounts,
  listJournalistStories,
} from '@/lib/journalist/desk'
import { payloadDeskAvailable } from '@/lib/admin/payload-desk'
import { AdminStatusPill } from '@/components/admin/primitives'
import { primaryRole } from '@/lib/auth/staff-roles'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'मेरो डेस्क · पत्रकार पोर्टल',
  robots: { index: false, follow: false },
}

export default async function JournalistDashboardPage() {
  const session = await requireContributorSession('/journalist')
  const connected = payloadDeskAvailable()
  const role = primaryRole(session.roles)

  const [counts, stories] = await Promise.all([
    getJournalistStatusCounts(session),
    listJournalistStories(session, { limit: 50 }),
  ])

  const draftCount = counts?.draft ?? 0
  const inReviewCount = counts?.in_review ?? 0
  const publishedCount = counts?.published ?? 0
  const totalCount = draftCount + inReviewCount + publishedCount

  return (
    <div className="space-y-8 max-w-[1240px]">
      {/* Welcome Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-wider text-accent">
              पत्रकार कार्यथलो
            </p>
          </div>
          <h1 className="mt-1 text-2xl font-black text-ink sm:text-3xl">
            मेरो डेस्क (Journalist Workspace)
          </h1>
          <p className="mt-1 text-xs text-stone">
            साइन इन: <strong>{session.name || session.email}</strong> ({role ?? 'journalist'})
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/journalist/compose"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-control)] accent-solid px-4 text-xs font-bold shadow-sm hover:opacity-95 transition-opacity"
          >
            <NotePencil size={16} weight="bold" />
            <span>+ नयाँ लेख मस्यौदा</span>
          </Link>

          <Link
            href="/journalist/preferences"
            className="inline-flex min-h-10 items-center rounded-[var(--radius-control)] border border-line bg-paper px-3 text-xs font-bold text-ink hover:border-accent"
          >
            सेटिङ
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="surface-card p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-stone">
            मस्यौदा (Drafts)
          </p>
          <p className="mt-2 text-3xl font-black tabular-nums text-ink">
            {draftCount}
          </p>
          <p className="mt-1 text-[0.7rem] text-stone">तयारी भइरहेका लेखहरू</p>
        </div>

        <div className="surface-card p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-warning">
            समीक्षामा (In Review)
          </p>
          <p className="mt-2 text-3xl font-black tabular-nums text-warning">
            {inReviewCount}
          </p>
          <p className="mt-1 text-[0.7rem] text-stone">सम्पादकको पर्खाइमा</p>
        </div>

        <div className="surface-card p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">
            प्रकाशित (Published)
          </p>
          <p className="mt-2 text-3xl font-black tabular-nums text-accent">
            {publishedCount}
          </p>
          <p className="mt-1 text-[0.7rem] text-stone">पाठकले पढिरहेका लेखहरू</p>
        </div>

        <div className="surface-card p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-stone">
            कुल सामग्री
          </p>
          <p className="mt-2 text-3xl font-black tabular-nums text-ink">
            {totalCount}
          </p>
          <p className="mt-1 text-[0.7rem] text-stone">मेरो सम्पूर्ण पत्रकारिता</p>
        </div>
      </div>

      {/* Stories Table */}
      <div>
        <div className="flex items-center justify-between border-b-2 border-accent pb-3 mb-4">
          <h2 className="text-base font-black text-ink">
            मेरा समाचार तथा मस्यौैदाहरू (My Stories & Drafts)
          </h2>
          <span className="text-xs font-bold text-stone">
            {stories.length} सामग्रीहरू
          </span>
        </div>

        {!connected ? (
          <div className="surface-card p-8 text-center text-stone text-xs">
            Connect PostgreSQL database to load stories from Payload.
          </div>
        ) : stories.length ? (
          <div className="surface-card overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-xs">
              <thead className="border-b border-line bg-paper-elevated text-stone uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-4 py-3">शीर्षक</th>
                  <th className="px-4 py-3">विभाग</th>
                  <th className="px-4 py-3">स्थिति</th>
                  <th className="px-4 py-3">अन्तिम अद्यावधिक</th>
                  <th className="px-4 py-3">कार्यहरू</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {stories.map((story) => (
                  <tr key={story.id} className="hover:bg-paper-elevated/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-ink max-w-[320px] truncate">
                      {story.isBreaking ? (
                        <span className="mr-2 rounded bg-danger px-1.5 py-0.5 text-[0.65rem] font-black text-danger-fg">
                          ब्रेकिङ
                        </span>
                      ) : null}
                      <span>{story.titleNe}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-accent capitalize">
                      {story.categorySlug}
                    </td>
                    <td className="px-4 py-3">
                      <AdminStatusPill status={story.status} />
                    </td>
                    <td className="px-4 py-3 text-stone tabular-nums">
                      {story.updatedAt
                        ? new Date(story.updatedAt).toLocaleDateString('ne-NP')
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 font-bold">
                        <Link
                          href={`/journalist/compose/${story.id}`}
                          className="text-accent hover:underline"
                        >
                          सम्पादन (Edit) →
                        </Link>
                        {story.status === 'published' ? (
                          <Link
                            href={`/ne/${story.categorySlug}/${story.slug}`}
                            target="_blank"
                            className="text-stone hover:text-ink inline-flex items-center gap-0.5"
                          >
                            <span>हेर्नुहोस्</span>
                            <ArrowSquareOut size={11} weight="bold" />
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="surface-card p-12 text-center">
            <FileText size={32} weight="bold" className="mx-auto text-stone/60 mb-3" />
            <p className="text-sm font-bold text-ink">कुनै मस्यौदा भेटिएन</p>
            <p className="mt-1 text-xs text-stone">
              पहिलो समाचार मस्यौदा तयार गरी सम्पादकीय समीक्षामा पठाउनुहोस्।
            </p>
            <div className="mt-5">
              <Link
                href="/journalist/compose"
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] accent-solid px-4 py-2 text-xs font-bold shadow-sm"
              >
                <NotePencil size={15} weight="bold" />
                <span>+ नयाँ लेख लेख्नुहोस्</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

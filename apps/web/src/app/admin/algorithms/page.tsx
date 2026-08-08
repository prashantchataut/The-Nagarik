import { runDesk } from '@thenagarik/algorithms'
import { getContent } from '@/lib/content'
import { getEngagementSnapshot } from '@/lib/engagement'
import { AdminCard } from '@/components/admin/primitives'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Algorithms · Newsroom',
  robots: { index: false, follow: false },
}

export default async function AlgorithmDeskPage() {
  const snap = await getEngagementSnapshot()
  const content = getContent()
  const articles = await content.listPublishedArticles()
  const enabled = process.env.ALGORITHMS_ENABLED !== 'false'

  const desk = runDesk({
    algorithmsEnabled: enabled,
    killSwitches: { ALGORITHMS_ENABLED: enabled },
    engagementSampleN: snap.sampleN,
    lastEventAgeSec: snap.lastEventAgeSec,
    articleCount: articles.length,
    searchQueryN: snap.searchQueryN,
  })

  return (
    <div>
      <p className="text-sm font-semibold text-accent">एल्गोरिदम</p>
      <h1 className="mt-1 text-3xl font-bold">Algorithm desk</h1>
      <p className="mt-2 max-w-[65ch] text-sm text-stone">
        Status is honest: production and shadow only. Planned rows are roadmap, never shown as live
        ML. Fixture theater is banned. Cold engagement shows as cold-start / fallback.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {(
          [
            ['Total', desk.total],
            ['Production', desk.byStatus.production],
            ['Shadow', desk.byStatus.shadow],
            ['Planned', desk.byStatus.planned],
            ['Disabled', desk.byStatus.disabled],
          ] as const
        ).map(([label, value]) => (
          <AdminCard key={label}>
            <p className="text-xs uppercase tracking-[0.12em] text-stone">{label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
          </AdminCard>
        ))}
      </div>

      <p className="mt-4 text-sm text-stone">
        Engagement samples: {snap.sampleN}. Last event age:{' '}
        {snap.lastEventAgeSec == null ? 'none' : `${snap.lastEventAgeSec}s`}.
      </p>

      <h2 className="mt-12 text-xl font-semibold">Production capabilities</h2>
      <div className="mt-4 divide-y divide-line border-t border-line">
        {desk.production.map((row) => (
          <div key={row.id} className="grid gap-1 py-3 md:grid-cols-[220px_1fr]">
            <code className="text-sm text-accent">{row.id}</code>
            <p className="text-sm text-stone">
              cold {row.coldStartPct}% · fallback {row.fallbackPct}% · {row.detail}
            </p>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-xl font-semibold">Shadow</h2>
      <div className="mt-4 divide-y divide-line border-t border-line">
        {desk.shadow.map((row) => (
          <div key={row.id} className="grid gap-1 py-3 md:grid-cols-[220px_1fr]">
            <code className="text-sm">{row.id}</code>
            <p className="text-sm text-stone">{row.detail}</p>
          </div>
        ))}
      </div>

      <details className="mt-12">
        <summary className="cursor-pointer text-xl font-semibold">
          Planned roadmap ({desk.byStatus.planned})
        </summary>
        <ul className="mt-4 columns-1 gap-6 text-sm text-stone md:columns-2 lg:columns-3">
          {desk.rows
            .filter((r) => r.status === 'planned')
            .map((r) => (
              <li key={r.id} className="break-inside-avoid py-1">
                <code>{r.id}</code>
              </li>
            ))}
        </ul>
      </details>
    </div>
  )
}

import { runDesk } from '@thenagarik/algorithms'
import { getEngagementSnapshot } from '@/lib/engagement'
import { AdminCard, AdminMetric } from '@/components/admin/primitives'
import { listDeskPublishedStories, payloadDeskAvailable } from '@/lib/admin/payload-desk'
import { Sparkle, CheckCircle, Warning } from '@phosphor-icons/react/dist/ssr'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Algorithms · Newsroom',
  robots: { index: false, follow: false },
}

export default async function AlgorithmDeskPage() {
  const snap = await getEngagementSnapshot()
  const stories = payloadDeskAvailable() ? await listDeskPublishedStories(200) : []
  const enabled = process.env.ALGORITHMS_ENABLED !== 'false'

  const desk = runDesk({
    algorithmsEnabled: enabled,
    killSwitches: { ALGORITHMS_ENABLED: enabled },
    engagementSampleN: snap.sampleN,
    lastEventAgeSec: snap.lastEventAgeSec,
    articleCount: stories.length,
    searchQueryN: snap.searchQueryN,
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-line pb-5">
        <p className="text-xs font-bold uppercase tracking-wider text-accent">
          एल्गोरिदम निगरानी
        </p>
        <h1 className="mt-1 text-2xl font-black text-ink md:text-3xl">
          Algorithm & Signal Desk
        </h1>
        <p className="mt-1 text-xs text-stone max-w-[65ch]">
          Transparent, consent-gated discovery telemetry. Cold-start detection with honest fallbacks.
          Fixture theater is strictly banned.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <AdminMetric label="Total Models" value={desk.total} />
        <AdminMetric label="Production" value={desk.byStatus.production} tone="accent" />
        <AdminMetric label="Shadow" value={desk.byStatus.shadow} tone="warning" />
        <AdminMetric label="Planned" value={desk.byStatus.planned} />
        <AdminMetric label="Disabled" value={desk.byStatus.disabled} />
      </div>

      {/* Real-time Telemetry Snapshot */}
      <div className="rounded-[var(--radius-panel)] border border-line bg-paper-elevated p-4 text-xs text-stone flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
          <span className="font-bold text-ink">Live Signal Pipeline:</span>
          <span>{snap.sampleN} total engagement samples</span>
        </div>
        <div>
          <span>Last Event Age: </span>
          <span className="font-bold text-ink">
            {snap.lastEventAgeSec == null ? 'None' : `${snap.lastEventAgeSec}s ago`}
          </span>
        </div>
      </div>

      {/* Production Capabilities */}
      <div>
        <div className="flex items-center gap-2 border-b-2 border-accent pb-2 mb-4">
          <CheckCircle size={18} weight="bold" className="text-accent" />
          <h2 className="text-base font-black text-ink">
            सक्रिय उत्पादन मोडेलहरू (Production Capabilities)
          </h2>
        </div>

        <div className="surface-card divide-y divide-line overflow-hidden">
          {desk.production.map((row) => (
            <div
              key={row.id}
              className="grid gap-2 p-4 sm:grid-cols-[240px_1fr] items-center hover:bg-paper-elevated/40 transition-colors"
            >
              <div>
                <code className="text-xs font-bold text-accent">{row.id}</code>
                <div className="mt-1 flex gap-2 text-[0.68rem] text-stone font-semibold">
                  <span className="rounded bg-paper px-1.5 py-0.5 border border-line">
                    Cold: {row.coldStartPct}%
                  </span>
                  <span className="rounded bg-paper px-1.5 py-0.5 border border-line">
                    Fallback: {row.fallbackPct}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-stone leading-relaxed">{row.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Shadow Capabilities */}
      <div>
        <div className="flex items-center gap-2 border-b-2 border-warning pb-2 mb-4">
          <Sparkle size={18} weight="bold" className="text-warning" />
          <h2 className="text-base font-black text-ink">
            छाया मोडेलहरू (Shadow Evaluation)
          </h2>
        </div>

        <div className="surface-card divide-y divide-line overflow-hidden">
          {desk.shadow.map((row) => (
            <div
              key={row.id}
              className="grid gap-2 p-4 sm:grid-cols-[240px_1fr] items-center hover:bg-paper-elevated/40 transition-colors"
            >
              <code className="text-xs font-bold text-ink">{row.id}</code>
              <p className="text-xs text-stone leading-relaxed">{row.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Planned Roadmap */}
      <details className="surface-card p-4">
        <summary className="cursor-pointer font-bold text-xs uppercase tracking-wider text-stone">
          भविष्यको मार्गचित्र (Planned Roadmap - {desk.byStatus.planned} capabilities)
        </summary>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 pt-3 border-t border-line text-xs font-mono text-stone">
          {desk.rows
            .filter((r) => r.status === 'planned')
            .map((r) => (
              <li key={r.id} className="rounded bg-paper-elevated p-2 border border-line">
                <code>{r.id}</code>
              </li>
            ))}
        </ul>
      </details>
    </div>
  )
}

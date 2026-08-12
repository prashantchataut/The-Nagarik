import { AdminCard } from '@/components/admin/primitives'
import { getSignalsDesk, MIN_SIGNAL_EVENTS } from '@/lib/admin/signals-desk'
import { payloadDeskAvailable } from '@/lib/admin/payload-desk'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Signals Desk · Newsroom',
  robots: { index: false, follow: false },
}

const PHASE_LABEL: Record<string, { ne: string; className: string }> = {
  rising: { ne: 'बढ्दो', className: 'bg-success-muted text-success' },
  peak: { ne: 'शिखरमा', className: 'bg-warning-muted text-warning' },
  decaying: { ne: 'घट्दो', className: 'bg-paper-strong text-stone' },
  dormant: { ne: 'सुषुप्त', className: 'bg-paper-strong text-stone' },
}

/** Text sparkline: window series as block characters. */
function sparkline(windows: number[]): string {
  const blocks = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']
  const max = Math.max(...windows, 1)
  return windows.map((w) => blocks[Math.min(7, Math.round((w / max) * 7))]).join('')
}

export default async function SignalsDeskPage() {
  const connected = payloadDeskAvailable()
  const desk = await getSignalsDesk(20)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-accent">
            वास्तविक-समय सम्पादकीय संकेत
          </p>
          <h1 className="mt-1 text-2xl font-black text-ink md:text-3xl">Signals Desk</h1>
          <p className="mt-1 text-xs text-stone">
            Velocity, burst automata, Poisson surprise, and lifecycle phases over live
            {` ${desk.windowMinutes}-minute`} engagement windows. Every column is a registry
            algorithm - see /admin/algorithms.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-paper-elevated border border-line px-3 py-1 font-bold text-stone">
            {desk.sampleN} events
          </span>
          <span
            className={`rounded-full px-3 py-1 font-bold ${
              desk.live ? 'bg-success-muted text-success' : 'bg-warning-muted text-warning'
            }`}
          >
            {desk.live ? 'LIVE signals' : 'cold - awaiting reader events'}
          </span>
        </div>
      </div>

      {!connected ? (
        <AdminCard>
          <p className="text-xs text-stone">
            DATABASE_URL + PAYLOAD_SECRET required for the production event store; showing the
            local fallback store.
          </p>
        </AdminCard>
      ) : null}

      {/* Topic clusters from bursting stories */}
      {desk.topics.length ? (
        <section className="surface-card p-5" aria-labelledby="topics-title">
          <h2 id="topics-title" className="border-b border-line pb-2 text-base font-black text-ink">
            उम्दा विषयहरू <span className="text-xs font-semibold text-stone">(trend.topic_cluster)</span>
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {desk.topics.map((topic) => (
              <li
                key={topic.keywords.join('-')}
                className="rounded-full bg-accent-muted px-3.5 py-1.5 text-xs font-bold text-accent"
              >
                {topic.keywords.slice(0, 3).join(' · ')}
                <span className="ml-1.5 font-semibold text-stone">×{topic.storyIds.length}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Story signals table */}
      <div className="surface-card overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-xs">
          <thead className="border-b border-line bg-paper-elevated font-bold uppercase tracking-wider text-stone">
            <tr>
              <th className="px-4 py-3">समाचार</th>
              <th className="px-4 py-3">windows</th>
              <th className="px-4 py-3">velocity</th>
              <th className="px-4 py-3">accel/min</th>
              <th className="px-4 py-3">burst</th>
              <th className="px-4 py-3">surprise</th>
              <th className="px-4 py-3">phase</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {desk.signals.map((signal) => {
              const phase = PHASE_LABEL[signal.phase] ?? PHASE_LABEL.dormant
              return (
                <tr key={signal.id} className="transition-colors hover:bg-paper-elevated/50">
                  <td className="max-w-[280px] px-4 py-3">
                    <p className="truncate font-bold text-ink">{signal.title}</p>
                    <p className="mt-0.5 text-[0.68rem] capitalize text-stone">
                      {signal.categorySlug}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-accent" aria-hidden="true">
                    {sparkline(signal.windows)}
                  </td>
                  <td className="px-4 py-3 font-bold tabular-nums text-ink">
                    {signal.velocityScore.toFixed(3)}
                  </td>
                  <td
                    className={`px-4 py-3 tabular-nums ${
                      signal.accelerationPerMin > 0
                        ? 'font-bold text-success'
                        : signal.accelerationPerMin < 0
                          ? 'text-danger'
                          : 'text-stone'
                    }`}
                  >
                    {signal.accelerationPerMin > 0 ? '+' : ''}
                    {signal.accelerationPerMin.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    {signal.lowVolume ? (
                      <span
                        className="rounded bg-paper-strong px-1.5 py-0.5 text-[0.65rem] font-bold text-stone"
                        title={`थोरै डाटा: ${MIN_SIGNAL_EVENTS} भन्दा कम impressions - burst/surprise गेट गरियो`}
                      >
                        n&lt;{MIN_SIGNAL_EVENTS}
                      </span>
                    ) : signal.bursting || signal.kleinbergBursting ? (
                      <span className="rounded bg-danger px-1.5 py-0.5 text-[0.65rem] font-black text-danger-fg">
                        BURST{signal.kleinbergBursting ? ' ·K' : ''}
                      </span>
                    ) : (
                      <span className="text-stone">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-ink">
                    {signal.surprise >= 2 ? (
                      <strong className="text-warning">{signal.surprise.toFixed(1)}</strong>
                    ) : (
                      signal.surprise.toFixed(1)
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${phase.className}`}>
                      {phase.ne}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!desk.signals.length ? (
          <div className="p-12 text-center">
            <p className="text-sm font-bold text-ink">अहिले कुनै लाइभ संकेत छैन</p>
            <p className="mt-1 text-xs text-stone">
              Signals appear once consented reader events arrive. No fixture theater.
            </p>
          </div>
        ) : null}
      </div>

      <p className="text-[0.7rem] leading-relaxed text-stone">
        Columns: velocity = EWMA rate × freshness × burst multiplier (vel.velocity_rank) ·
        accel = window-over-window rate change (vel.acceleration) · BURST = robust MAD-z ≥ 3σ
        (vel.burst_z), ·K = Kleinberg automaton agrees (trend.kleinberg) · surprise = -log10
        P(X ≥ observed) of the latest window (trend.poisson_surprise; 2 = 1-in-100) · phase =
        trend.lifecycle. Burst/surprise are gated: rows with fewer than {MIN_SIGNAL_EVENTS}
        impressions in the window show n&lt;{MIN_SIGNAL_EVENTS} instead of alarms.
      </p>
    </div>
  )
}

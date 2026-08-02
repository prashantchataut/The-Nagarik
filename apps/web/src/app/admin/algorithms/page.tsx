import { runDesk } from '@thenagarik/algorithms'
import { getContent } from '@/lib/content'
import { getEngagementSnapshot } from '@/lib/engagement'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

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
    <div className="min-h-[100dvh] bg-paper text-ink">
      <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-6">
        <p className="text-sm text-stone">
          <Link href="/ne">← Reader</Link>
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl">Algorithm desk</h1>
        <p className="mt-3 max-w-[65ch] text-stone">
          Status is honest: production and shadow only. Planned rows are roadmap, never shown as live ML.
          Fixture theater is banned. Cold engagement shows as cold-start / fallback.
        </p>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {(
            [
              ['Total', desk.total],
              ['Production', desk.byStatus.production],
              ['Shadow', desk.byStatus.shadow],
              ['Planned', desk.byStatus.planned],
              ['Disabled', desk.byStatus.disabled],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="border border-line bg-paper-elevated p-4">
              <dt className="text-xs uppercase tracking-[0.12em] text-stone">{label}</dt>
              <dd className="mt-2 font-[family-name:var(--font-display)] text-3xl">{value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-4 text-sm text-stone">
          Engagement samples: {snap.sampleN}. Last event age:{' '}
          {snap.lastEventAgeSec == null ? 'none' : `${snap.lastEventAgeSec}s`}.
        </p>

        <h2 className="mt-12 font-[family-name:var(--font-display)] text-2xl">Production capabilities</h2>
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

        <h2 className="mt-12 font-[family-name:var(--font-display)] text-2xl">Shadow</h2>
        <div className="mt-4 divide-y divide-line border-t border-line">
          {desk.shadow.map((row) => (
            <div key={row.id} className="grid gap-1 py-3 md:grid-cols-[220px_1fr]">
              <code className="text-sm">{row.id}</code>
              <p className="text-sm text-stone">{row.detail}</p>
            </div>
          ))}
        </div>

        <details className="mt-12">
          <summary className="cursor-pointer font-[family-name:var(--font-display)] text-2xl">
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
    </div>
  )
}

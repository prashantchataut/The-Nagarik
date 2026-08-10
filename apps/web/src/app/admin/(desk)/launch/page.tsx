import {
  AdminButton,
  AdminCard,
  AdminStatusPill,
  CmsCanonicalBanner,
} from '@/components/admin/primitives'
import { getLaunchChecks } from '@/lib/admin/dashboard'
import { payloadDeskAvailable } from '@/lib/admin/payload-desk'
import { CheckCircle, Warning, XCircle } from '@phosphor-icons/react/dist/ssr'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Launch Checklist · Newsroom',
  robots: { index: false, follow: false },
}

export default async function AdminLaunchPage() {
  const checks = getLaunchChecks()
  const onPayload = payloadDeskAvailable() && process.env.CONTENT_SOURCE === 'payload'
  const ready = checks.filter((c) => c.id !== 'sentry').every((c) => c.ok)

  return (
    <div className="space-y-6 max-w-[880px]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-accent">
            उत्पादन तयारी
          </p>
          <h1 className="mt-1 text-2xl font-black text-ink md:text-3xl">
            Production Launch Readiness
          </h1>
          <p className="mt-1 text-xs text-stone">
            Rigorous environment and operational verification checklist for live production pitch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${
              ready
                ? 'bg-success-muted text-success'
                : 'bg-warning-muted text-warning'
            }`}
          >
            {ready ? <CheckCircle size={15} weight="bold" /> : <Warning size={15} weight="bold" />}
            <span>{ready ? 'Ready for Production' : 'Pre-Launch Action Required'}</span>
          </span>
        </div>
      </div>

      <CmsCanonicalBanner onPayload={onPayload} />

      {/* Checklist Card */}
      <div className="surface-card overflow-hidden">
        <div className="border-b border-line bg-paper-elevated px-5 py-3.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone">
            प्रणाली प्रमाणीकरण (System Verification)
          </h2>
        </div>

        <ul className="divide-y divide-line">
          {checks.map((check) => (
            <li
              key={check.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 hover:bg-paper-elevated/40 transition-colors"
            >
              <div>
                <p className="text-xs font-bold text-ink">{check.label}</p>
                <p className="mt-0.5 text-[0.7rem] text-stone font-mono">{check.detail}</p>
              </div>

              <div>
                <AdminStatusPill status={check.ok ? 'ok' : 'fail'} />
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Cron / Operations Information */}
      <AdminCard>
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone mb-2">
          पृष्ठभूमि कार्यहरू (Automated Ops & Cron Jobs)
        </h3>
        <ul className="space-y-1.5 text-xs text-stone">
          <li>
            • <code>POST /api/cron/scheduled-publish</code> - Publishes scheduled articles automatically.
          </li>
          <li>
            • <code>POST /api/cron/ops-probe</code> - Telemetry health probe for edge monitoring.
          </li>
        </ul>
      </AdminCard>
    </div>
  )
}

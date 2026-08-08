import { AdminCard, CmsCanonicalBanner } from '@/components/admin/primitives'
import { getLaunchChecks } from '@/lib/admin/dashboard'
import { getContent } from '@/lib/content'

export const metadata = {
  title: 'Launch check · Newsroom',
  robots: { index: false, follow: false },
}

export default async function AdminLaunchPage() {
  const checks = getLaunchChecks()
  const content = getContent()
  const onPayload = content.source === 'payload' && !content.usingDevFixtures
  const ready = checks.filter((c) => c.id !== 'sentry').every((c) => c.ok)

  return (
    <div>
      <p className="text-sm font-semibold text-accent">लन्च चेक</p>
      <h1 className="mt-1 text-3xl font-bold">Production readiness</h1>
      <p className="mt-2 max-w-[54ch] text-sm text-stone">
        Env gates only — does not claim DoIB, ads, or Sentry unless wired. Pattern borrowed from
        Watch launch desk; stricter about honesty.
      </p>

      <div className="mt-6">
        <CmsCanonicalBanner onPayload={onPayload} />
      </div>

      <AdminCard className="mt-8">
        <p className="text-sm font-semibold">
          Overall:{' '}
          <span className={ready ? 'text-accent' : 'text-holiday'}>
            {ready ? 'ready for Payload pitch' : 'blocked — fix failing checks'}
          </span>
        </p>
        <ul className="mt-4 divide-y divide-line">
          {checks.map((check) => (
            <li key={check.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-sm">
              <span className="font-medium">{check.label}</span>
              <span className={check.ok ? 'font-semibold text-accent' : 'font-semibold text-holiday'}>
                {check.ok ? 'ok' : 'fail'}
              </span>
              <span className="w-full text-xs text-stone">{check.detail}</span>
            </li>
          ))}
        </ul>
      </AdminCard>

      <p className="mt-6 text-xs text-stone">
        Cron: <code>POST /api/cron/ops-probe</code> and{' '}
        <code>POST /api/cron/scheduled-publish</code> with Bearer CRON_SECRET.
      </p>
    </div>
  )
}

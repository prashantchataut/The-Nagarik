import Link from 'next/link'
import { payloadBootstrap } from '@/payload/payload.config'

export default function CmsSetupPage() {
  return (
    <div className="min-h-[100dvh] bg-paper px-4 py-16 text-ink">
      <div className="mx-auto max-w-[720px]">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Payload CMS setup</h1>
        <p className="mt-4 text-stone">
          Collections and gates are defined in code. Connect Neon + Blob, install Payload packages, then
          mount the admin at <code>{payloadBootstrap.adminRoute}</code>.
        </p>
        <pre className="mt-8 overflow-auto rounded-[var(--radius-control)] border border-line bg-paper-elevated p-4 text-xs">
          {JSON.stringify(payloadBootstrap, null, 2)}
        </pre>
        <p className="mt-6 text-sm">
          <Link href="/admin" className="text-accent">
            ← Admin home
          </Link>
        </p>
      </div>
    </div>
  )
}

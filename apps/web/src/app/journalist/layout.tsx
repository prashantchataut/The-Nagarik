import type { ReactNode } from 'react'
import { JournalistShell } from '@/components/journalist/JournalistShell'
import { requireContributorSession } from '@/lib/journalist/session'
import { payloadDeskAvailable } from '@/lib/admin/payload-desk'
import { AdminCard } from '@/components/admin/primitives'

export const dynamic = 'force-dynamic'

export default async function JournalistLayout({ children }: { children: ReactNode }) {
  const session = await requireContributorSession('/journalist')

  if (!payloadDeskAvailable()) {
    return (
      <JournalistShell session={session}>
        <AdminCard>
          <p className="text-sm text-holiday">
            DATABASE_URL + PAYLOAD_SECRET required. Start{' '}
            <code>pnpm --filter @thenagarik/web local:pg</code> then refresh.
          </p>
        </AdminCard>
      </JournalistShell>
    )
  }

  return <JournalistShell session={session}>{children}</JournalistShell>
}

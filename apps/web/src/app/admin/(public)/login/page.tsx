import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { StaffAuthShell } from '@/components/auth/StaffAuthShell'
import { StaffLoginForm } from '@/components/auth/StaffLoginForm'
import { getStaffSession, staffAuthReady } from '@/lib/auth/staff-session'

export const metadata: Metadata = {
  title: 'Newsroom login | The Nagarik',
  description: 'Staff sign-in for The Nagarik ops desk and Payload CMS.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const query = await searchParams
  const nextPath =
    typeof query.next === 'string' &&
    (query.next.startsWith('/admin') || query.next.startsWith('/journalist'))
      ? query.next
      : '/admin'

  const session = await getStaffSession()
  if (session) redirect(nextPath)

  const authReady = staffAuthReady()
  const pitchHint = process.env.NODE_ENV !== 'production'

  return (
    <StaffAuthShell
      title="सम्पादकीय लगइन"
      lede="Editors, publishers, and journalists sign in here. Content is edited in Payload; this desk handles queue, launch, and operations."
      formTitle="Staff sign in"
      footer={
        <>
          <Link href="/journalist" className="hover:text-accent hover:underline">
            Journalist desk
          </Link>
          <Link href="/cms" className="hover:text-accent hover:underline">
            Open Payload /cms
          </Link>
          <Link href="/ne/login" className="hover:text-accent hover:underline">
            Locale login page
          </Link>
        </>
      }
    >
      {!authReady ? (
        <aside
          className="mb-4 border border-holiday/40 bg-paper-elevated px-3 py-2 text-sm text-holiday"
          role="status"
        >
          <strong>Login service unavailable.</strong> Connect <code>DATABASE_URL</code> and{' '}
          <code>PAYLOAD_SECRET</code>, then refresh.
        </aside>
      ) : null}

      <StaffLoginForm nextPath={nextPath} authReady={authReady} pitchHint={pitchHint} />
    </StaffAuthShell>
  )
}

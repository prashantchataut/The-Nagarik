import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { StaffAuthShell } from '@/components/auth/StaffAuthShell'
import { StaffLoginForm } from '@/components/auth/StaffLoginForm'
import { getStaffSession, staffAuthReady } from '@/lib/auth/staff-session'
import { resolveStaffRedirect } from '@/lib/auth/staff-login-paths'

export const metadata: Metadata = {
  title: 'पत्रकार लगइन | The Nagarik',
  description: 'Journalist and reporter sign-in for The Nagarik newsroom.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function JournalistLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const query = await searchParams
  const nextPath =
    typeof query.next === 'string' && query.next.startsWith('/journalist')
      ? query.next
      : '/journalist'

  const session = await getStaffSession()
  if (session) {
    redirect(resolveStaffRedirect({ portal: 'journalist', nextPath, roles: session.roles }))
  }

  const authReady = staffAuthReady()
  const pitchHint = process.env.NODE_ENV !== 'production'

  return (
    <StaffAuthShell
      title="पत्रकार लगइन"
      lede="पत्रकार, रिपोर्टर र समाचार लेखकका लागि लेखन डेस्क। मस्यौदा, तस्बिर र समीक्षा कतार यहीँबाट खुल्छ।"
      formTitle="पत्रकार खाताबाट प्रवेश गर्नुहोस्"
      kicker="पत्रकार डेस्क"
      footerNote="यो पृष्ठ पत्रकार र लेखकका लागि हो। सम्पादक वा प्रशासक भए प्रशासनिक प्रवेश प्रयोग गर्नुहोस्।"
      footer={
        <>
          <Link href="/admin/login" className="hover:text-accent hover:underline">
            प्रशासनिक लगइन
          </Link>
          <Link href="/ne/login" className="hover:text-accent hover:underline">
            पाठक लगइन
          </Link>
          <Link href="/ne/register" className="hover:text-accent hover:underline">
            पत्रकार आवेदन
          </Link>
        </>
      }
    >
      {!authReady ? (
        <aside
          className="mb-4 border border-holiday/40 bg-paper-elevated px-3 py-2 text-sm text-holiday"
          role="status"
        >
          <strong>पत्रकार लगइन उपलब्ध छैन।</strong> सेवा सक्रिय नभएसम्म प्रवेश गर्न सकिँदैन। सिस्टम
          प्रशासकलाई सम्पर्क गर्नुहोस्।
        </aside>
      ) : null}

      <StaffLoginForm
        portal="journalist"
        nextPath={nextPath}
        authReady={authReady}
        pitchHint={pitchHint}
        submitLabel="पत्रकार डेस्कमा प्रवेश गर्नुहोस्"
      />
    </StaffAuthShell>
  )
}

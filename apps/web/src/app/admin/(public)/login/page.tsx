import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { StaffAuthShell } from '@/components/auth/StaffAuthShell'
import { StaffLoginForm } from '@/components/auth/StaffLoginForm'
import { getStaffSession, staffAuthReady } from '@/lib/auth/staff-session'

export const metadata: Metadata = {
  title: 'सम्पादकीय प्रवेश | The Nagarik',
  description: 'Secure staff sign-in for The Nagarik newsroom.',
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
      title="सम्पादकीय प्रवेश"
      lede="पत्रकार, सम्पादक, प्रकाशक र प्रशासकका लागि सुरक्षित समाचारकक्ष प्रवेश। एउटै खाताले भूमिकाअनुसार लेखन, समीक्षा र प्रकाशन कार्य खोल्छ।"
      formTitle="आफ्नो खाताबाट प्रवेश गर्नुहोस्"
      footer={
        <>
          <Link href="/journalist" className="hover:text-accent hover:underline">
            पत्रकार डेस्क
          </Link>
          <Link href="/ne/login" className="hover:text-accent hover:underline">
            सार्वजनिक खाता पृष्ठ
          </Link>
        </>
      }
    >
      {!authReady ? (
        <aside
          className="mb-4 border border-holiday/40 bg-paper-elevated px-3 py-2 text-sm text-holiday"
          role="status"
        >
          <strong>समाचारकक्ष लगइन उपलब्ध छैन।</strong> सेवा सक्रिय नभएसम्म स्टाफ प्रवेश गर्न सक्दैन। सिस्टम प्रशासकलाई सम्पर्क गर्नुहोस्।
        </aside>
      ) : null}

      <StaffLoginForm nextPath={nextPath} authReady={authReady} pitchHint={pitchHint} />
    </StaffAuthShell>
  )
}

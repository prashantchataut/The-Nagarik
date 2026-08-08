import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { AdminShell } from '@/components/admin/AdminShell'
import { requireStaffSession } from '@/lib/auth/staff-session'

export const dynamic = 'force-dynamic'

export default async function AdminDeskLayout({ children }: { children: ReactNode }) {
  const hdrs = await headers()
  const pathname =
    hdrs.get('x-pathname') ??
    hdrs.get('next-url')?.replace(/^https?:\/\/[^/]+/, '') ??
    '/admin'

  const session = await requireStaffSession(
    pathname.startsWith('/admin') ? pathname : '/admin',
  )

  return <AdminShell session={session}>{children}</AdminShell>
}

import type { ReactNode } from 'react'

export const dynamic = 'force-dynamic'

export const metadata = {
  robots: { index: false, follow: false },
}

/** Root admin segment - route groups own shells and auth. */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return children
}

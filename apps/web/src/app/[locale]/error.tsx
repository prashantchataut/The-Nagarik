'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[locale-error]', error.digest ?? error.message)
  }, [error])

  return (
    <div className="mx-auto max-w-[40rem] px-4 py-20 md:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">Error</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink">सामग्री लोड हुन सकेन</h1>
      <p className="mt-3 text-sm leading-relaxed text-stone">
        The page could not load content from the CMS. Check network, then retry. If this persists after cutover,
        verify DATABASE_URL and CONTENT_SOURCE on the server.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-[var(--radius-control)] bg-accent px-4 py-2 text-sm font-semibold text-accent-fg"
        >
          Retry
        </button>
        <Link
          href="/ne"
          className="rounded-[var(--radius-control)] border border-line px-4 py-2 text-sm font-semibold text-ink"
        >
          Home
        </Link>
      </div>
    </div>
  )
}

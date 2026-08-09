'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const pathname = usePathname() || '/ne'
  const locale = pathname.startsWith('/en') ? 'en' : 'ne'

  useEffect(() => {
    console.error('[reader-error]', error.digest ?? error.message)
  }, [error])

  const copy = locale === 'en'
    ? {
        eyebrow: 'Something went wrong',
        title: 'This page could not be loaded',
        body: 'The page may be temporarily unavailable. Try again, or continue with the latest stories.',
        retry: 'Try again',
        latest: 'Latest news',
        home: 'Homepage',
      }
    : {
        eyebrow: 'लोड हुन सकेन',
        title: 'यो पृष्ठ अहिले खोल्न सकिएन',
        body: 'पृष्ठ अस्थायी रूपमा उपलब्ध नहुन सक्छ। फेरि प्रयास गर्नुहोस् वा पछिल्ला समाचारतर्फ जानुहोस्।',
        retry: 'फेरि प्रयास गर्नुहोस्',
        latest: 'ताजा समाचार',
        home: 'गृहपृष्ठ',
      }

  return (
    <section className="mx-auto max-w-[760px] px-4 py-16 md:px-6 md:py-24" aria-labelledby="reader-error-title">
      <div className="border-y border-line py-10">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-danger">{copy.eyebrow}</p>
        <h1 id="reader-error-title" className="mt-2 text-3xl font-bold leading-tight tracking-[-0.025em] text-ink md:text-4xl">
          {copy.title}
        </h1>
        <p className="mt-4 max-w-[56ch] text-base leading-7 text-stone">{copy.body}</p>
        <div className="mt-7 flex flex-wrap gap-2">
          <button type="button" onClick={reset} className="min-h-11 rounded-[var(--radius-control)] bg-accent px-4 text-sm font-bold text-accent-fg">
            {copy.retry}
          </button>
          <Link href={`/${locale}/latest`} className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] border border-line bg-paper-elevated px-4 text-sm font-semibold hover:border-accent hover:text-accent">
            {copy.latest}
          </Link>
          <Link href={`/${locale}`} className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-stone hover:text-accent">
            {copy.home}
          </Link>
        </div>
      </div>
    </section>
  )
}

'use client'

import { useEffect, useState } from 'react'
import type { AppLocale } from '@/lib/i18n'
import { relativeTime } from '@/lib/relative-time'

export { relativeTime } from '@/lib/relative-time'

/** Absolute date for SSR; relative label only after mount to avoid hydration #418. */
export function RelativeTime({
  iso,
  locale,
  className,
}: {
  iso?: string
  locale: AppLocale
  className?: string
}) {
  const [label, setLabel] = useState(() => absoluteLabel(iso))

  useEffect(() => {
    if (!iso) return
    setLabel(relativeTime(iso, locale))
  }, [iso, locale])

  if (!iso) return null
  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {label}
    </time>
  )
}

function absoluteLabel(iso: string | undefined): string {
  if (!iso) return ''
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kathmandu',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

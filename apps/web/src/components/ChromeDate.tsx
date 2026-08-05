'use client'

import { useEffect, useState } from 'react'
import type { AppLocale } from '@/lib/i18n'

/** Stable Kathmandu date for chrome; Latin digits avoid Node/browser ne-NP mismatch. */
export function ChromeDate({ locale }: { locale: AppLocale }) {
  const [label, setLabel] = useState(() => formatKtmDate(locale))

  useEffect(() => {
    setLabel(formatKtmDate(locale))
  }, [locale])

  return (
    <p className="truncate tabular-nums" suppressHydrationWarning>
      {label}
    </p>
  )
}

function formatKtmDate(locale: AppLocale): string {
  return new Intl.DateTimeFormat(locale === 'ne' ? 'en-GB' : 'en-GB', {
    timeZone: 'Asia/Kathmandu',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date())
}

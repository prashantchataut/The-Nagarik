'use client'

import { useEffect, useState } from 'react'
import type { AppLocale } from '@/lib/i18n'
import { BS_MONTHS_EN, BS_MONTHS_NE, WEEKDAYS_NE, todayBs } from '@/lib/bs-calendar'

const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

/** Kathmandu BS date for chrome. */
export function ChromeDate({ locale, className = '' }: { locale: AppLocale; className?: string }) {
  const [label, setLabel] = useState(() => formatBsChrome(locale))

  useEffect(() => {
    setLabel(formatBsChrome(locale))
  }, [locale])

  return (
    <p className={`truncate tabular-nums ${className}`} suppressHydrationWarning>
      {label}
    </p>
  )
}

function formatBsChrome(locale: AppLocale): string {
  const bs = todayBs()
  const ad = new Date()
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kathmandu',
    weekday: 'short',
  }).format(ad)
  const wdIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday)
  if (locale === 'ne') {
    const dayName = WEEKDAYS_NE[wdIndex >= 0 ? wdIndex : 0]
    return `${dayName}बार, ${bs.day} ${BS_MONTHS_NE[bs.month - 1]} ${bs.year}`
  }
  return `${WEEKDAYS_EN[wdIndex >= 0 ? wdIndex : 0]}, ${bs.day} ${BS_MONTHS_EN[bs.month - 1]} ${bs.year}`
}

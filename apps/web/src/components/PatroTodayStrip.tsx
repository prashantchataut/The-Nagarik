'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { adToBs, formatBs } from '@/lib/bs-calendar'
import { festivalsForBsDay, panchangForAd } from '@/lib/panchang'
import type { AppLocale, Dictionary } from '@/lib/i18n'
import { patroHref } from '@/lib/site'

function ktmAdToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  return { year: get('year'), month: get('month'), day: get('day') }
}

/** Compact civic utility strip: today's BS date, tithi, festival cue. */
export function PatroTodayStrip({
  locale,
  dict,
  href,
}: {
  locale: AppLocale
  dict: Dictionary
  href?: string
}) {
  const [ready, setReady] = useState(false)
  const [line, setLine] = useState('')
  const link = href ?? patroHref(locale)

  useEffect(() => {
    const ad = ktmAdToday()
    const bs = adToBs(ad)
    const panchang = panchangForAd(ad, locale)
    const festivals = festivalsForBsDay(bs, ad)
    const festivalLabel = festivals[0]
      ? locale === 'ne'
        ? festivals[0].nameNe
        : festivals[0].nameEn
      : null
    const parts = [formatBs(bs, locale), panchang.tithiLabel]
    if (festivalLabel) parts.push(festivalLabel)
    setLine(parts.join(' · '))
    setReady(true)
  }, [locale])

  return (
    <div className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <p className="text-sm text-ink" suppressHydrationWarning>
          <span className="rounded-[var(--radius-control)] bg-accent px-2 py-0.5 text-[0.7rem] font-semibold text-accent-fg">
            {dict.today}
          </span>
          {ready ? (
            <>
              <span className="mx-2 text-line">/</span>
              <span>{line}</span>
            </>
          ) : (
            <span className="ml-2 text-stone">…</span>
          )}
        </p>
        <Link href={link} className="shrink-0 text-xs font-medium text-accent hover:underline">
          {dict.nepaliPatro}
        </Link>
      </div>
    </div>
  )
}

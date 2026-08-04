import Link from 'next/link'
import { adToBs, formatBs } from '@/lib/bs-calendar'
import { festivalsForBsDay, panchangForAd } from '@/lib/panchang'
import type { AppLocale, Dictionary } from '@/lib/i18n'

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

/** Compact civic utility strip: today's BS date, tithi, next festival cue. */
export function PatroTodayStrip({ locale, dict }: { locale: AppLocale; dict: Dictionary }) {
  const ad = ktmAdToday()
  const bs = adToBs(ad)
  const panchang = panchangForAd(ad, locale)
  const festivals = festivalsForBsDay(bs, ad)
  const festivalLabel = festivals[0]
    ? locale === 'ne'
      ? festivals[0].nameNe
      : festivals[0].nameEn
    : null

  return (
    <div className="border-b border-line">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <p className="text-sm text-ink">
          <span className="font-medium">{dict.today}</span>
          <span className="mx-2 text-line">/</span>
          <span>{formatBs(bs, locale)}</span>
          <span className="mx-2 text-line">/</span>
          <span className="text-stone">{panchang.tithiLabel}</span>
          {festivalLabel ? (
            <>
              <span className="mx-2 text-line">/</span>
              <span className="text-accent">{festivalLabel}</span>
            </>
          ) : null}
        </p>
        <Link
          href={`/${locale}/utilities/nepali-patro`}
          className="shrink-0 text-xs font-medium text-accent hover:underline"
        >
          {dict.nepaliPatro}
        </Link>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  BS_MONTHS_EN,
  BS_MONTHS_NE,
  WEEKDAYS_NE,
  adToBs,
  bsToAd,
  formatBs,
  isSupportedBsYear,
  monthGrid,
  todayBs,
  type BsDate,
} from '@/lib/bs-calendar'
import {
  approximateTithi,
  festivalsForBsDay,
  festivalsInBsMonth,
  panchangForAd,
} from '@/lib/panchang'

function ktmParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
  }).formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: get('hour'),
    minute: get('minute'),
  }
}

export function NepaliPatroWidget({ locale = 'ne' }: { locale?: 'ne' | 'en' }) {
  const [tick, setTick] = useState(0)
  const [view, setView] = useState<BsDate>(() => todayBs())
  const [selected, setSelected] = useState<BsDate>(() => todayBs())
  const [adIn, setAdIn] = useState(() => {
    const p = ktmParts()
    return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
  })
  const [bsIn, setBsIn] = useState(() => {
    const t = todayBs()
    return `${t.year}-${String(t.month).padStart(2, '0')}-${String(t.day).padStart(2, '0')}`
  })
  const [convertMsg, setConvertMsg] = useState('')

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const ktm = useMemo(() => {
    void tick
    return ktmParts()
  }, [tick])

  const today = useMemo(
    () => adToBs({ year: ktm.year, month: ktm.month, day: ktm.day }),
    [ktm.day, ktm.month, ktm.year],
  )

  const todayAd = useMemo(
    () => ({ year: ktm.year, month: ktm.month, day: ktm.day }),
    [ktm.day, ktm.month, ktm.year],
  )

  const todayPanchang = useMemo(() => panchangForAd(todayAd, locale), [locale, todayAd])
  const todayFestivals = useMemo(() => festivalsForBsDay(today, todayAd), [today, todayAd])

  const selectedAd = useMemo(() => {
    try {
      return bsToAd(selected)
    } catch {
      return todayAd
    }
  }, [selected, todayAd])

  const selectedPanchang = useMemo(() => panchangForAd(selectedAd, locale), [locale, selectedAd])
  const selectedFestivals = useMemo(
    () => festivalsForBsDay(selected, selectedAd),
    [selected, selectedAd],
  )

  const grid = useMemo(() => monthGrid(view.year, view.month), [view.month, view.year])
  const monthFestivals = useMemo(
    () => festivalsInBsMonth(view.year, view.month),
    [view.month, view.year],
  )
  const festivalDays = useMemo(() => new Set(monthFestivals.map((f) => f.day)), [monthFestivals])

  const monthLabel =
    locale === 'ne' ? BS_MONTHS_NE[view.month - 1] : BS_MONTHS_EN[view.month - 1]

  function shiftMonth(delta: number) {
    let y = view.year
    let m = view.month + delta
    if (m < 1) {
      m = 12
      y -= 1
    }
    if (m > 12) {
      m = 1
      y += 1
    }
    if (!isSupportedBsYear(y)) return
    setView({ year: y, month: m, day: 1 })
  }

  function selectDay(day: number, ad: { year: number; month: number; day: number }) {
    const next = { year: view.year, month: view.month, day }
    setSelected(next)
    setView(next)
    setBsIn(`${view.year}-${String(view.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
    setAdIn(`${ad.year}-${String(ad.month).padStart(2, '0')}-${String(ad.day).padStart(2, '0')}`)
  }

  function convertAdToBs() {
    const [y, m, d] = adIn.split('-').map(Number)
    if (!y || !m || !d) {
      setConvertMsg(locale === 'ne' ? 'मान्य AD मिति हाल्नुहोस्' : 'Enter a valid AD date')
      return
    }
    const bs = adToBs({ year: y, month: m, day: d })
    setBsIn(`${bs.year}-${String(bs.month).padStart(2, '0')}-${String(bs.day).padStart(2, '0')}`)
    setConvertMsg(formatBs(bs, locale))
    if (isSupportedBsYear(bs.year)) {
      setView(bs)
      setSelected(bs)
    }
  }

  function convertBsToAd() {
    const [y, m, d] = bsIn.split('-').map(Number)
    try {
      const ad = bsToAd({ year: y, month: m, day: d })
      setAdIn(
        `${ad.year}-${String(ad.month).padStart(2, '0')}-${String(ad.day).padStart(2, '0')}`,
      )
      setConvertMsg(
        `${ad.year}-${String(ad.month).padStart(2, '0')}-${String(ad.day).padStart(2, '0')} AD`,
      )
      const next = { year: y, month: m, day: d }
      setView(next)
      setSelected(next)
    } catch {
      setConvertMsg(locale === 'ne' ? 'मान्य BS मिति हाल्नुहोस् (२०७०–२०९०)' : 'Valid BS date required (2070–2090)')
    }
  }

  return (
    <div className="grid gap-5">
      <div className="rounded-[12px] border border-line bg-paper-elevated p-4 md:p-5">
        <p className="text-xs text-stone">
          {locale === 'ne' ? 'काठमाडौं समय' : 'Kathmandu time'}
        </p>
        <p className="mt-2 font-[family-name:var(--font-display)] text-3xl tabular-nums text-ink">
          {ktm.hour}:{ktm.minute}
        </p>
        <p className="mt-3 text-lg text-ink">{formatBs(today, locale)}</p>
        <p className="mt-1 text-sm text-stone">
          {ktm.year}-{String(ktm.month).padStart(2, '0')}-{String(ktm.day).padStart(2, '0')} AD
        </p>
        <p className="mt-3 text-sm font-medium text-accent">{todayPanchang.tithiLabel}</p>
        <p className="mt-1 text-sm text-stone">
          {locale === 'ne' ? 'नक्षत्र' : 'Nakshatra'}: {todayPanchang.nakshatraLabel}
        </p>
        {todayFestivals.length ? (
          <ul className="mt-2 space-y-1">
            {todayFestivals.map((f) => (
              <li key={f.id} className="text-sm text-ink">
                {locale === 'ne' ? f.nameNe : f.nameEn}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="mt-3 text-xs text-stone">{todayPanchang.note}</p>
      </div>

      <div className="rounded-[12px] border border-line bg-paper p-4 md:p-5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="rounded-[var(--radius-control)] border border-line px-3 py-1.5 text-sm transition hover:border-accent active:scale-[0.98]"
            onClick={() => shiftMonth(-1)}
          >
            ←
          </button>
          <h2 className="font-[family-name:var(--font-display)] text-xl">
            {monthLabel} {view.year}
          </h2>
          <button
            type="button"
            className="rounded-[var(--radius-control)] border border-line px-3 py-1.5 text-sm transition hover:border-accent active:scale-[0.98]"
            onClick={() => shiftMonth(1)}
          >
            →
          </button>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[0.7rem] text-stone">
          {WEEKDAYS_NE.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {grid.map((cell, i) => {
            if (!cell) return <span key={`e-${i}`} className="aspect-square" />
            const isToday =
              cell.day === today.day && view.month === today.month && view.year === today.year
            const isSelected =
              cell.day === selected.day &&
              view.month === selected.month &&
              view.year === selected.year
            const hasFest = festivalDays.has(cell.day)
            return (
              <button
                key={`${view.year}-${view.month}-${cell.day}`}
                type="button"
                onClick={() => selectDay(cell.day, cell.ad)}
                className={`relative aspect-square rounded-[8px] border text-sm transition active:scale-[0.98] ${
                  isToday
                    ? 'border-accent bg-accent text-accent-fg'
                    : isSelected
                      ? 'border-accent bg-accent/10 text-ink'
                      : 'border-line bg-paper-elevated text-ink hover:border-accent'
                }`}
              >
                <span className="block leading-none tabular-nums">{cell.day}</span>
                <span
                  className={`mt-0.5 block text-[0.58rem] tabular-nums ${
                    isToday ? 'text-accent-fg/80' : 'text-stone'
                  }`}
                >
                  {cell.ad.day}
                </span>
                {hasFest ? (
                  <span
                    className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                      isToday ? 'bg-accent-fg' : 'bg-accent'
                    }`}
                    aria-hidden
                  />
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-[12px] border border-line bg-paper-elevated p-4 md:p-5">
        <h3 className="font-[family-name:var(--font-display)] text-lg">
          {locale === 'ne' ? 'चयनित दिनको पञ्चाङ्ग' : 'Selected day panchang'}
        </h3>
        <p className="mt-2 text-sm text-ink">{formatBs(selected, locale)}</p>
        <p className="mt-1 text-sm text-accent">{selectedPanchang.tithiLabel}</p>
        <p className="mt-1 text-sm text-stone">
          {locale === 'ne' ? 'नक्षत्र' : 'Nakshatra'}: {selectedPanchang.nakshatraLabel}
        </p>
        <p className="mt-1 text-xs text-stone">
          {locale === 'ne'
            ? `तिथि क्रम ${approximateTithi(selectedAd).index}/३०`
            : `Tithi index ${approximateTithi(selectedAd).index}/30`}
        </p>
        {selectedFestivals.length ? (
          <ul className="mt-3 space-y-1 border-t border-line pt-3">
            {selectedFestivals.map((f) => (
              <li key={f.id} className="text-sm text-ink">
                <span className="font-medium">{locale === 'ne' ? f.nameNe : f.nameEn}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-stone">
            {locale === 'ne' ? 'यो दिन कुनै सूचीकृत पर्व छैन।' : 'No listed festival on this day.'}
          </p>
        )}
      </div>

      {monthFestivals.length ? (
        <div className="rounded-[12px] border border-line bg-paper p-4 md:p-5">
          <h3 className="font-[family-name:var(--font-display)] text-lg">
            {locale === 'ne' ? 'यो महिनाका पर्व' : 'Festivals this month'}
          </h3>
          <ul className="mt-3 divide-y divide-line">
            {monthFestivals.map((f) => (
              <li key={`${f.id}-${f.day}`} className="flex items-baseline justify-between gap-3 py-2.5">
                <button
                  type="button"
                  className="text-left text-sm text-ink hover:text-accent"
                  onClick={() => {
                    try {
                      const ad = bsToAd({ year: view.year, month: view.month, day: f.day })
                      selectDay(f.day, ad)
                    } catch {
                      /* out of range */
                    }
                  }}
                >
                  {locale === 'ne' ? f.nameNe : f.nameEn}
                </button>
                <span className="shrink-0 text-xs tabular-nums text-stone">{f.day}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-[12px] border border-line bg-paper-elevated p-4 md:p-5">
        <h3 className="font-[family-name:var(--font-display)] text-lg">
          {locale === 'ne' ? 'मिति रूपान्तरण' : 'Date converter'}
        </h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-stone">AD (YYYY-MM-DD)</span>
            <input
              value={adIn}
              onChange={(e) => setAdIn(e.target.value)}
              className="rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2"
            />
            <button
              type="button"
              onClick={convertAdToBs}
              className="mt-1 rounded-[var(--radius-control)] border border-line px-3 py-2 text-sm transition hover:border-accent active:scale-[0.98]"
            >
              AD → BS
            </button>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-stone">BS (YYYY-MM-DD)</span>
            <input
              value={bsIn}
              onChange={(e) => setBsIn(e.target.value)}
              className="rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2"
            />
            <button
              type="button"
              onClick={convertBsToAd}
              className="mt-1 rounded-[var(--radius-control)] border border-line px-3 py-2 text-sm transition hover:border-accent active:scale-[0.98]"
            >
              BS → AD
            </button>
          </label>
        </div>
        {convertMsg ? <p className="mt-3 text-sm text-ink">{convertMsg}</p> : null}
      </div>
    </div>
  )
}

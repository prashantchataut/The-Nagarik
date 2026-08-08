'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  BS_MONTHS_EN,
  BS_MONTHS_NE,
  WEEKDAYS_NE,
  adToBs,
  bsToAd,
  daysInBsMonth,
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
import type { AppLocale } from '@/lib/i18n'
import { BRAND_NE, newsHomeHref } from '@/lib/site'
import { SAMPLE_BULLION, SAMPLE_USD_NPR } from '@/lib/market-rates'

const WEEKDAYS_EN_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const

const GOLD_FIXTURE = SAMPLE_BULLION

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

function daysUntilBs(from: BsDate, to: BsDate): number {
  try {
    const a = bsToAd(from)
    const b = bsToAd(to)
    const ms =
      Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)
    return Math.round(ms / 86_400_000)
  } catch {
    return 0
  }
}

type NewsItem = { id: string; title: string; href: string }

export function NepaliPatroWidget({
  locale = 'ne',
  news = [],
}: {
  locale?: AppLocale
  news?: NewsItem[]
}) {
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
  const [forexAmount, setForexAmount] = useState('1')
  const usdRate = SAMPLE_USD_NPR

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
  const festivalByDay = useMemo(() => {
    const map = new Map<number, string>()
    for (const f of monthFestivals) {
      map.set(f.day, locale === 'ne' ? f.nameNe : f.nameEn)
    }
    return map
  }, [locale, monthFestivals])

  const upcoming = useMemo(() => {
    const items: Array<{ day: number; month: number; year: number; name: string; days: number }> = []
    for (let offset = 0; offset < 3 && items.length < 8; offset++) {
      let y = today.year
      let m = today.month + offset
      while (m > 12) {
        m -= 12
        y += 1
      }
      if (!isSupportedBsYear(y)) continue
      const fest = festivalsInBsMonth(y, m)
      for (const f of fest) {
        if (offset === 0 && f.day < today.day) continue
        const target = { year: y, month: m, day: f.day }
        items.push({
          day: f.day,
          month: m,
          year: y,
          name: locale === 'ne' ? f.nameNe : f.nameEn,
          days: daysUntilBs(today, target),
        })
        if (items.length >= 8) break
      }
    }
    return items
  }, [locale, today])

  const monthLabel = locale === 'ne' ? BS_MONTHS_NE[view.month - 1] : BS_MONTHS_EN[view.month - 1]
  const todayWeekday = (() => {
    const wd = new Date(Date.UTC(todayAd.year, todayAd.month - 1, todayAd.day)).getUTCDay()
    return locale === 'ne' ? `${WEEKDAYS_NE[wd]}बार` : WEEKDAYS_EN_SHORT[wd]
  })()

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
      setAdIn(`${ad.year}-${String(ad.month).padStart(2, '0')}-${String(ad.day).padStart(2, '0')}`)
      setConvertMsg(
        `${ad.year}-${String(ad.month).padStart(2, '0')}-${String(ad.day).padStart(2, '0')} AD`,
      )
      const next = { year: y, month: m, day: d }
      setView(next)
      setSelected(next)
    } catch {
      setConvertMsg(
        locale === 'ne' ? 'मान्य BS मिति हाल्नुहोस् (२०७०–२०९०)' : 'Valid BS date required (2070–2090)',
      )
    }
  }

  const years = useMemo(() => {
    const list: number[] = []
    for (let y = 2070; y <= 2090; y++) list.push(y)
    return list
  }, [])

  const utilityTiles = [
    {
      href: `#sait`,
      label: locale === 'ne' ? 'शुभ साइत' : 'Auspicious times',
      className: 'from-teal-700 to-teal-500',
    },
    {
      href: `#holidays`,
      label: locale === 'ne' ? 'सार्वजनिक बिदा' : 'Public holidays',
      className: 'from-emerald-800 to-emerald-600',
    },
    {
      href: `#rashifal`,
      label: locale === 'ne' ? 'राशिफल' : 'Horoscope',
      className: 'from-cyan-800 to-cyan-600',
    },
    {
      href: `#converter`,
      label: locale === 'ne' ? 'मिति रूपान्तरण' : 'Date converter',
      className: 'from-slate-700 to-slate-500',
    },
    {
      href: `#gold`,
      label: locale === 'ne' ? 'सुनचाँदी' : 'Gold & silver',
      className: 'from-amber-800 to-amber-600',
    },
    {
      href: `#forex`,
      label: locale === 'ne' ? 'मुद्रा' : 'Forex',
      className: 'from-indigo-800 to-indigo-600',
    },
    {
      href: `/${locale}/utilities/preeti-unicode`,
      label: locale === 'ne' ? 'प्रीति युनिकोड' : 'Preeti Unicode',
      className: 'from-accent to-teal-600',
    },
  ]

  const forexOut = (Number(forexAmount) || 0) * usdRate

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Sidebar */}
      <aside className="space-y-4 lg:col-span-3">
        <section className="border border-line bg-paper-elevated p-4">
          <h2 className="border-b border-line pb-2 text-sm font-semibold">
            {locale === 'ne' ? 'आगामी पर्वहरू' : 'Upcoming festivals'}
          </h2>
          <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto">
            {upcoming.map((u) => (
              <li key={`${u.year}-${u.month}-${u.day}-${u.name}`} className="flex gap-2 text-sm">
                <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center bg-paper text-center text-[0.65rem] leading-tight text-stone">
                  <span className="text-base font-semibold tabular-nums text-ink">{u.day}</span>
                  {(locale === 'ne' ? BS_MONTHS_NE : BS_MONTHS_EN)[u.month - 1].slice(0, 3)}
                </span>
                <span className="min-w-0">
                  <span className="block font-medium leading-snug text-ink">{u.name}</span>
                  <span className="text-xs text-accent">
                    {u.days === 0
                      ? locale === 'ne'
                        ? 'आज'
                        : 'Today'
                      : locale === 'ne'
                        ? `${u.days} दिन बाँकी`
                        : `${u.days} days left`}
                  </span>
                </span>
              </li>
            ))}
            {!upcoming.length ? (
              <li className="text-sm text-stone">
                {locale === 'ne' ? 'सूचीमा पर्व छैन।' : 'No festivals listed.'}
              </li>
            ) : null}
          </ul>
        </section>

        <section id="converter" className="scroll-mt-24 border border-line bg-paper p-4">
          <h2 className="border-b border-line pb-2 text-sm font-semibold">
            {locale === 'ne' ? 'मिति रूपान्तरण' : 'Date converter'}
          </h2>
          <div className="mt-3 grid gap-2">
            <label className="grid gap-1 text-xs text-stone">
              AD (YYYY-MM-DD)
              <input
                value={adIn}
                onChange={(e) => setAdIn(e.target.value)}
                className="rounded-[var(--radius-control)] border border-line bg-paper-elevated px-2 py-2 text-sm text-ink"
              />
            </label>
            <button
              type="button"
              onClick={convertAdToBs}
              className="rounded-[var(--radius-control)] bg-accent px-3 py-2 text-sm font-medium text-accent-fg active:scale-[0.98]"
            >
              AD → BS
            </button>
            <label className="grid gap-1 text-xs text-stone">
              BS (YYYY-MM-DD)
              <input
                value={bsIn}
                onChange={(e) => setBsIn(e.target.value)}
                className="rounded-[var(--radius-control)] border border-line bg-paper-elevated px-2 py-2 text-sm text-ink"
              />
            </label>
            <button
              type="button"
              onClick={convertBsToAd}
              className="rounded-[var(--radius-control)] border border-line px-3 py-2 text-sm active:scale-[0.98] hover:border-accent"
            >
              BS → AD
            </button>
            {convertMsg ? <p className="text-sm text-ink">{convertMsg}</p> : null}
          </div>
        </section>

        <section id="gold" className="scroll-mt-24 border border-line bg-paper-elevated p-4">
          <h2 className="border-b border-line pb-2 text-sm font-semibold">
            {locale === 'ne' ? 'सुनचाँदी भाउ' : 'Gold & silver'}
          </h2>
          <p className="mt-1 text-[0.65rem] text-stone">
            {locale === 'ne' ? 'नमूना दर — लाइभ फिड चाँडै' : 'Sample rates — live feed soon'}
          </p>
          <ul className="mt-3 space-y-2">
            {GOLD_FIXTURE.map((g) => (
              <li key={g.labelEn} className="flex items-center justify-between gap-2 text-sm">
                <span>{locale === 'ne' ? g.labelNe : g.labelEn}</span>
                <span className="tabular-nums font-medium">{g.today}</span>
              </li>
            ))}
          </ul>
        </section>

        <section id="forex" className="scroll-mt-24 border border-line bg-paper p-4">
          <h2 className="border-b border-line pb-2 text-sm font-semibold">
            {locale === 'ne' ? 'विदेशी मुद्रा' : 'Foreign exchange'}
          </h2>
          <p className="mt-1 text-[0.65rem] text-stone">
            {locale === 'ne' ? 'नमूना दर — लाइभ फिड चाँडै' : 'Sample rates — live feed soon'}
          </p>
          <div className="mt-3 grid gap-2 text-sm">
            <label className="grid gap-1 text-xs text-stone">
              {locale === 'ne' ? 'रकम (USD)' : 'Amount (USD)'}
              <input
                value={forexAmount}
                onChange={(e) => setForexAmount(e.target.value)}
                className="rounded-[var(--radius-control)] border border-line bg-paper-elevated px-2 py-2"
              />
            </label>
            <p className="text-xs text-stone">1 USD = {usdRate} NPR</p>
            <p className="text-lg font-semibold tabular-nums text-accent">
              {forexOut.toLocaleString('en-NP', { maximumFractionDigits: 2 })} NPR
            </p>
          </div>
        </section>
      </aside>

      {/* Main */}
      <div className="min-w-0 space-y-5 lg:col-span-9">
        {/* Today hero */}
        <div className="grid gap-4 border border-line sm:grid-cols-[auto_1fr]">
          <div className="flex min-h-[120px] flex-col items-center justify-center bg-accent px-8 py-6 text-accent-fg">
            <p className="text-5xl font-semibold tabular-nums leading-none">{today.day}</p>
            <p className="mt-2 text-lg font-medium">
              {locale === 'ne' ? BS_MONTHS_NE[today.month - 1] : BS_MONTHS_EN[today.month - 1]},{' '}
              {today.year}
            </p>
            <p className="mt-1 text-sm opacity-90">{todayWeekday}</p>
          </div>
          <div className="p-4">
            <p className="text-sm text-stone">
              {todayAd.year}-{String(todayAd.month).padStart(2, '0')}-
              {String(todayAd.day).padStart(2, '0')} AD
            </p>
            <p className="mt-2 text-base font-medium text-ink">{todayPanchang.tithiLabel}</p>
            <p className="mt-1 text-sm text-stone">
              {locale === 'ne' ? 'नक्षत्र' : 'Nakshatra'}: {todayPanchang.nakshatraLabel}
            </p>
            <p className="mt-1 text-sm text-stone" suppressHydrationWarning>
              {locale === 'ne' ? 'समय' : 'Time'}: {ktm.hour}:{ktm.minute}
            </p>
            {todayFestivals.length ? (
              <ul className="mt-2 space-y-1">
                {todayFestivals.map((f) => (
                  <li key={f.id} className="text-sm font-medium text-accent">
                    {locale === 'ne' ? f.nameNe : f.nameEn}
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-3 text-xs text-stone">{todayPanchang.note}</p>
          </div>
        </div>

        {/* Month controls + grid */}
        <div className="border border-line p-3 md:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Year"
                value={view.year}
                onChange={(e) => {
                  const y = Number(e.target.value)
                  const max = daysInBsMonth(y, view.month)
                  setView({ year: y, month: view.month, day: Math.min(view.day, max || 1) })
                }}
                className="rounded-[var(--radius-control)] border border-line bg-paper px-2 py-1.5 text-sm"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <select
                aria-label="Month"
                value={view.month}
                onChange={(e) => {
                  const m = Number(e.target.value)
                  const max = daysInBsMonth(view.year, m)
                  setView({ year: view.year, month: m, day: Math.min(view.day, max || 1) })
                }}
                className="rounded-[var(--radius-control)] border border-line bg-paper px-2 py-1.5 text-sm"
              >
                {(locale === 'ne' ? BS_MONTHS_NE : BS_MONTHS_EN).map((name, i) => (
                  <option key={name} value={i + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-[var(--radius-control)] border border-line px-3 py-1.5 text-sm hover:border-accent"
                onClick={() => shiftMonth(-1)}
              >
                ←
              </button>
              <p className="min-w-[8rem] text-center text-sm font-semibold">
                {monthLabel} {view.year}
              </p>
              <button
                type="button"
                className="rounded-[var(--radius-control)] border border-line px-3 py-1.5 text-sm hover:border-accent"
                onClick={() => shiftMonth(1)}
              >
                →
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 border-b border-line text-center text-[0.7rem] font-medium text-stone">
            {WEEKDAYS_NE.map((d, i) => (
              <span key={d} className={`py-2 ${i === 6 ? 'text-holiday' : ''}`}>
                <span className="hidden sm:inline">{d}</span>
                <span className="sm:hidden">{d.slice(0, 1)}</span>
                <span className="ml-0.5 hidden text-[0.6rem] opacity-70 md:inline">
                  /{WEEKDAYS_EN_SHORT[i].slice(0, 1)}
                </span>
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {grid.map((cell, i) => {
              if (!cell) {
                return <div key={`e-${i}`} className="min-h-[4.5rem] border-b border-r border-line bg-paper-elevated/50" />
              }
              const isToday =
                cell.day === today.day && view.month === today.month && view.year === today.year
              const isSelected =
                cell.day === selected.day &&
                view.month === selected.month &&
                view.year === selected.year
              const isSat = i % 7 === 6
              const fest = festivalByDay.get(cell.day)
              const tithi = panchangForAd(cell.ad, locale).tithiLabel

              return (
                <button
                  key={`${view.year}-${view.month}-${cell.day}`}
                  type="button"
                  onClick={() => selectDay(cell.day, cell.ad)}
                  className={`relative flex min-h-[4.5rem] flex-col border-b border-r border-line p-1 text-left transition active:scale-[0.99] sm:min-h-[5.5rem] sm:p-1.5 ${
                    isToday
                      ? 'bg-accent text-accent-fg'
                      : isSelected
                        ? 'bg-accent/10'
                        : 'bg-paper hover:bg-paper-elevated'
                  }`}
                >
                  {fest ? (
                    <span
                      className={`mb-0.5 line-clamp-1 text-[0.55rem] leading-tight sm:text-[0.65rem] ${
                        isToday ? 'text-accent-fg/90' : 'text-accent'
                      }`}
                    >
                      {fest}
                    </span>
                  ) : (
                    <span className="mb-0.5 h-3" />
                  )}
                  <span
                    className={`text-center text-lg font-semibold tabular-nums leading-none sm:text-2xl ${
                      isToday ? '' : isSat || fest ? 'text-holiday' : 'text-ink'
                    }`}
                  >
                    {cell.day}
                  </span>
                  <span className="mt-auto flex items-end justify-between gap-0.5">
                    <span
                      className={`line-clamp-1 text-[0.5rem] sm:text-[0.6rem] ${
                        isToday ? 'text-accent-fg/80' : 'text-stone'
                      }`}
                    >
                      {tithi.replace(/^.*?:\s*/, '').slice(0, 8)}
                    </span>
                    <span
                      className={`text-[0.55rem] tabular-nums sm:text-[0.65rem] ${
                        isToday ? 'text-accent-fg/80' : isSat ? 'text-holiday' : 'text-stone'
                      }`}
                    >
                      {cell.ad.day}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected day detail */}
        <div className="border border-line bg-paper-elevated p-4">
          <h3 className="text-sm font-semibold">
            {locale === 'ne' ? 'चयनित दिन' : 'Selected day'}: {formatBs(selected, locale)}
          </h3>
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
            <ul className="mt-2 space-y-1">
              {selectedFestivals.map((f) => (
                <li key={f.id} className="text-sm font-medium">
                  {locale === 'ne' ? f.nameNe : f.nameEn}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* Month festivals / holidays */}
        <section id="holidays" className="scroll-mt-24 border border-line bg-paper p-4">
          <h2 className="border-b border-line pb-2 text-sm font-semibold">
            {locale === 'ne' ? 'यस महिनाका पर्व / बिदा' : 'Festivals & holidays this month'}
          </h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {monthFestivals.length ? (
              monthFestivals.map((f) => (
                <li
                  key={`${f.day}-${f.nameNe}`}
                  className="flex items-baseline justify-between gap-2 border-b border-line pb-1 text-sm"
                >
                  <span className="font-medium text-ink">
                    {locale === 'ne' ? f.nameNe : f.nameEn}
                  </span>
                  <span className="shrink-0 tabular-nums text-stone">
                    {f.day}{' '}
                    {(locale === 'ne' ? BS_MONTHS_NE : BS_MONTHS_EN)[view.month - 1]}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-sm text-stone">
                {locale === 'ne'
                  ? 'यो महिना सूचीमा पर्व छैन।'
                  : 'No festivals listed for this month.'}
              </li>
            )}
          </ul>
        </section>

        <section id="rashifal" className="scroll-mt-24 border border-line bg-paper-elevated p-4">
          <h2 className="text-sm font-semibold">
            {locale === 'ne' ? 'राशिफल' : 'Horoscope'}
          </h2>
          <p className="mt-2 text-sm text-stone">
            {locale === 'ne'
              ? 'दैनिक राशिफल अहिले समाचार कक्षसँग बराबर रेलमा छैन (Phase 1)। पात्रो र पर्व उपकरण प्राथमिक छन्।'
              : 'Daily horoscope is intentionally not an equal home-rail in Phase 1. Calendar and festival tools ship first.'}
          </p>
        </section>

        <section id="sait" className="scroll-mt-24 border border-line bg-paper p-4">
          <h2 className="text-sm font-semibold">
            {locale === 'ne' ? 'शुभ साइत' : 'Auspicious times'}
          </h2>
          <p className="mt-2 text-sm text-stone">
            {locale === 'ne'
              ? 'शुभ साइत तालिका चाँडै। अहिले तिथि/नक्षत्र चयनित दिनमा देखिन्छ।'
              : 'Auspicious-timing tables come later. Tithi and nakshatra already appear on the selected day.'}
          </p>
        </section>

        {/* Utility tiles */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {utilityTiles.map((t) => (
            <Link
              key={t.label}
              href={t.href}
              className={`flex min-h-[4.5rem] items-center justify-center rounded-[var(--radius-control)] bg-gradient-to-br px-2 text-center text-sm font-semibold text-white ${t.className}`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* News re-entry */}
        {news.length ? (
          <section>
            <div className="mb-3 flex items-baseline justify-between border-b-2 border-accent pb-2">
              <h2 className="text-lg font-semibold">
                {locale === 'ne' ? 'ताजा समाचार' : 'Latest news'}
              </h2>
              <Link href={newsHomeHref(locale)} className="text-xs font-medium text-accent hover:underline">
                {BRAND_NE}
              </Link>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {news.slice(0, 6).map((n) => (
                <li key={n.id} className="border-b border-line pb-2">
                  <Link href={n.href} className="text-sm font-medium leading-snug hover:text-accent">
                    {n.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* SEO block */}
        <section className="border-t border-line pt-6 text-sm leading-relaxed text-stone">
          <h2 className="text-lg font-semibold text-ink">
            {locale === 'ne' ? 'द नागरिक पात्रो' : 'The Nagarik Patro'}
          </h2>
          <p className="mt-2 max-w-[70ch]">
            {locale === 'ne'
              ? 'द नागरिक पात्रो नेपाली पात्रो (विक्रम संवत्), पर्व–बिदा, मिति रूपान्तरण, र दैनिक उपयोगी जानकारीको एक स्थान हो। क्यालेन्डर सेलमा ठूलो मिति BS, कुनामा AD, र तिथि देखिन्छ। आजको दिन ब्रान्ड रङले चिन्हित हुन्छ; शनिबार र बिदा रातोमा।'
              : 'The Nagarik Patro is a Bikram Sambat calendar with festivals, date conversion, and daily utilities. Each cell shows a large BS date, AD in the corner, and tithi. Today is marked in brand teal; Saturdays and holidays use red.'}
          </p>
        </section>
      </div>
    </div>
  )
}

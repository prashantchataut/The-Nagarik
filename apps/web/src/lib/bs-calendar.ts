/**
 * Bikram Sambat calendar helpers for newsroom Patro.
 * Covers BS 2070–2090 with published month-length tables.
 * Epoch: BS 2000-01-01 ≈ AD 1943-04-14.
 */

export type BsDate = { year: number; month: number; day: number }
export type AdDate = { year: number; month: number; day: number }

export const BS_MONTHS_NE = [
  'बैशाख',
  'जेठ',
  'असार',
  'साउन',
  'भदौ',
  'असोज',
  'कात्तिक',
  'मंसिर',
  'पुष',
  'माघ',
  'फागुन',
  'चैत',
] as const

export const BS_MONTHS_EN = [
  'Baisakh',
  'Jestha',
  'Ashadh',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
] as const

export const WEEKDAYS_NE = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिही', 'शुक्र', 'शनि'] as const

/** Month lengths for BS years. Index 0 = Baisakh. */
const MONTH_LEN: Record<number, number[]> = {
  2070: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2071: [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
  2072: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2073: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2074: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2075: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2076: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2077: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2078: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2079: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2081: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2082: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2083: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2084: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2085: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2086: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2087: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2088: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2089: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2090: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
}

const AD_EPOCH = Date.UTC(2013, 3, 14) // approx BS 2070-01-01
const BS_EPOCH_YEAR = 2070

function daysInBsYear(year: number): number {
  const months = MONTH_LEN[year]
  if (!months) throw new Error(`BS year ${year} not in table`)
  return months.reduce((a, b) => a + b, 0)
}

function daysBeforeBsYear(year: number): number {
  let total = 0
  for (let y = BS_EPOCH_YEAR; y < year; y++) total += daysInBsYear(y)
  return total
}

function utcDay(y: number, m: number, d: number): number {
  return Date.UTC(y, m - 1, d)
}

export function isSupportedBsYear(year: number): boolean {
  return Boolean(MONTH_LEN[year])
}

export function daysInBsMonth(year: number, month: number): number {
  const months = MONTH_LEN[year]
  if (!months || month < 1 || month > 12) return 0
  return months[month - 1]
}

export function adToBs(ad: AdDate): BsDate {
  const target = utcDay(ad.year, ad.month, ad.day)
  let offset = Math.floor((target - AD_EPOCH) / 86_400_000)
  if (offset < 0) {
    // Clamp to earliest supported year for older dates
    return { year: BS_EPOCH_YEAR, month: 1, day: 1 }
  }

  let year = BS_EPOCH_YEAR
  while (year <= 2090 && offset >= daysInBsYear(year)) {
    offset -= daysInBsYear(year)
    year++
  }
  if (!MONTH_LEN[year]) year = 2090

  let month = 1
  while (month <= 12 && offset >= daysInBsMonth(year, month)) {
    offset -= daysInBsMonth(year, month)
    month++
  }
  return { year, month, day: offset + 1 }
}

export function bsToAd(bs: BsDate): AdDate {
  if (!MONTH_LEN[bs.year]) throw new Error(`BS year ${bs.year} not in table`)
  const max = daysInBsMonth(bs.year, bs.month)
  if (bs.month < 1 || bs.month > 12 || bs.day < 1 || bs.day > max) {
    throw new Error('Invalid BS date')
  }
  let offset = daysBeforeBsYear(bs.year)
  for (let m = 1; m < bs.month; m++) offset += daysInBsMonth(bs.year, m)
  offset += bs.day - 1
  const ms = AD_EPOCH + offset * 86_400_000
  const d = new Date(ms)
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }
}

export function todayBs(now = new Date()): BsDate {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  return adToBs({ year: get('year'), month: get('month'), day: get('day') })
}

export function formatBs(bs: BsDate, locale: 'ne' | 'en' = 'ne'): string {
  const month = locale === 'ne' ? BS_MONTHS_NE[bs.month - 1] : BS_MONTHS_EN[bs.month - 1]
  return `${bs.day} ${month} ${bs.year}`
}

export function monthGrid(year: number, month: number): Array<{ day: number; ad: AdDate } | null> {
  const days = daysInBsMonth(year, month)
  if (!days) return []
  const firstAd = bsToAd({ year, month, day: 1 })
  const firstWeekday = new Date(Date.UTC(firstAd.year, firstAd.month - 1, firstAd.day)).getUTCDay()
  const cells: Array<{ day: number; ad: AdDate } | null> = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let day = 1; day <= days; day++) {
    cells.push({ day, ad: bsToAd({ year, month, day }) })
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

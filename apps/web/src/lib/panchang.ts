import type { AdDate, BsDate } from './bs-calendar'
import { bsToAd } from './bs-calendar'

export type Paksha = 'shukla' | 'krishna'

export type TithiInfo = {
  index: number // 1-30 raw lunar day index
  number: number // 1-15 within paksha
  paksha: Paksha
  nameNe: string
  nameEn: string
  pakshaNe: string
  pakshaEn: string
}

export type NakshatraInfo = {
  index: number // 1-27
  nameNe: string
  nameEn: string
}

export type Festival = {
  id: string
  nameNe: string
  nameEn: string
  /** Recurring by Bikram Sambat month/day */
  bsMonth?: number
  bsDay?: number
  /** Optional AD fixed date (month/day) for national days */
  adMonth?: number
  adDay?: number
  kind: 'religious' | 'national' | 'cultural'
}

const TITHI_NE = [
  'प्रतिपदा',
  'द्वितीया',
  'तृतीया',
  'चतुर्थी',
  'पञ्चमी',
  'षष्ठी',
  'सप्तमी',
  'अष्टमी',
  'नवमी',
  'दशमी',
  'एकादशी',
  'द्वादशी',
  'त्रयोदशी',
  'चतुर्दशी',
  'पूर्णिमा',
] as const

const TITHI_EN = [
  'Pratipada',
  'Dwitiya',
  'Tritiya',
  'Chaturthi',
  'Panchami',
  'Shashthi',
  'Saptami',
  'Ashtami',
  'Navami',
  'Dashami',
  'Ekadashi',
  'Dwadashi',
  'Trayodashi',
  'Chaturdashi',
  'Purnima',
] as const

const KRISHNA_15_NE = 'औंसी'
const KRISHNA_15_EN = 'Amavasya'

const NAKSHATRA_NE = [
  'अश्विनी',
  'भरणी',
  'कृत्तिका',
  'रोहिणी',
  'मृगशिरा',
  'आर्द्रा',
  'पुनर्वसु',
  'पुष्य',
  'अश्लेषा',
  'मघा',
  'पूर्व फाल्गुनी',
  'उत्तर फाल्गुनी',
  'हस्त',
  'चित्रा',
  'स्वाती',
  'विशाखा',
  'अनुराधा',
  'ज्येष्ठा',
  'मूल',
  'पूर्वाषाढा',
  'उत्तराषाढा',
  'श्रवण',
  'धनिष्ठा',
  'शतभिषा',
  'पूर्व भाद्रपद',
  'उत्तर भाद्रपद',
  'रेवती',
] as const

const NAKSHATRA_EN = [
  'Ashwini',
  'Bharani',
  'Krittika',
  'Rohini',
  'Mrigashira',
  'Ardra',
  'Punarvasu',
  'Pushya',
  'Ashlesha',
  'Magha',
  'Purva Phalguni',
  'Uttara Phalguni',
  'Hasta',
  'Chitra',
  'Swati',
  'Vishakha',
  'Anuradha',
  'Jyeshtha',
  'Mula',
  'Purva Ashadha',
  'Uttara Ashadha',
  'Shravana',
  'Dhanishta',
  'Shatabhisha',
  'Purva Bhadrapada',
  'Uttara Bhadrapada',
  'Revati',
] as const

/**
 * Approximate tithi from synodic month age.
 * Good enough for civic utility display; not a temple-grade ephemeris.
 * Reference new moon: 2000-01-06 18:14 UTC.
 */
export function approximateTithi(ad: AdDate): TithiInfo {
  const synodic = 29.530588853
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14)
  const target = Date.UTC(ad.year, ad.month - 1, ad.day, 12, 0)
  const age = ((target - knownNewMoon) / 86_400_000) % synodic
  const lunarAge = age < 0 ? age + synodic : age
  const index = Math.min(30, Math.max(1, Math.floor(lunarAge / (synodic / 30)) + 1))
  const paksha: Paksha = index <= 15 ? 'shukla' : 'krishna'
  const number = index <= 15 ? index : index - 15
  const isAmavasya = paksha === 'krishna' && number === 15
  const nameNe = isAmavasya ? KRISHNA_15_NE : TITHI_NE[number - 1]
  const nameEn = isAmavasya ? KRISHNA_15_EN : TITHI_EN[number - 1]
  return {
    index,
    number,
    paksha,
    nameNe,
    nameEn,
    pakshaNe: paksha === 'shukla' ? 'शुक्ल पक्ष' : 'कृष्ण पक्ष',
    pakshaEn: paksha === 'shukla' ? 'Shukla paksha' : 'Krishna paksha',
  }
}

/** Approximate nakshatra from lunar age within the synodic cycle. */
export function approximateNakshatra(ad: AdDate): NakshatraInfo {
  const synodic = 29.530588853
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14)
  const target = Date.UTC(ad.year, ad.month - 1, ad.day, 12, 0)
  const age = ((target - knownNewMoon) / 86_400_000) % synodic
  const lunarAge = age < 0 ? age + synodic : age
  const index = Math.min(27, Math.max(1, Math.floor((lunarAge / synodic) * 27) + 1))
  return {
    index,
    nameNe: NAKSHATRA_NE[index - 1],
    nameEn: NAKSHATRA_EN[index - 1],
  }
}

/** Major Nepali festivals / observances keyed mostly by BS month-day. */
export const FESTIVALS: Festival[] = [
  { id: 'naya-barsha', nameNe: 'नयाँ वर्ष', nameEn: 'Nepali New Year', bsMonth: 1, bsDay: 1, kind: 'national' },
  { id: 'loktantra', nameNe: 'लोकतन्त्र दिवस', nameEn: 'Democracy Day', adMonth: 2, adDay: 19, kind: 'national' },
  { id: 'international-womens', nameNe: 'अन्तर्राष्ट्रिय महिला दिवस', nameEn: "International Women's Day", adMonth: 3, adDay: 8, kind: 'cultural' },
  { id: 'chaite-dashain', nameNe: 'चैते दशैं', nameEn: 'Chaite Dashain', bsMonth: 12, bsDay: 8, kind: 'religious' },
  { id: 'ram-navami', nameNe: 'राम नवमी', nameEn: 'Ram Navami', bsMonth: 12, bsDay: 9, kind: 'religious' },
  { id: 'buddha-jayanti', nameNe: 'बुद्ध जयन्ती', nameEn: 'Buddha Jayanti', bsMonth: 1, bsDay: 15, kind: 'religious' },
  { id: 'republic-day', nameNe: 'गणतन्त्र दिवस', nameEn: 'Republic Day', adMonth: 5, adDay: 29, kind: 'national' },
  { id: 'nag-panchami', nameNe: 'नाग पञ्चमी', nameEn: 'Nag Panchami', bsMonth: 4, bsDay: 5, kind: 'religious' },
  { id: 'janai-purnima', nameNe: 'जनै पूर्णिमा', nameEn: 'Janai Purnima', bsMonth: 4, bsDay: 15, kind: 'religious' },
  { id: 'gaura', nameNe: 'गौरा पर्व', nameEn: 'Gaura Parva', bsMonth: 4, bsDay: 15, kind: 'cultural' },
  { id: 'krishna-janmashtami', nameNe: 'कृष्ण जन्माष्टमी', nameEn: 'Krishna Janmashtami', bsMonth: 5, bsDay: 8, kind: 'religious' },
  { id: 'teej', nameNe: 'हरितालिका तीज', nameEn: 'Haritalika Teej', bsMonth: 5, bsDay: 3, kind: 'religious' },
  { id: 'rishi-panchami', nameNe: 'ऋषि पञ्चमी', nameEn: 'Rishi Panchami', bsMonth: 5, bsDay: 5, kind: 'religious' },
  { id: 'constitution-day', nameNe: 'संविधान दिवस', nameEn: 'Constitution Day', adMonth: 9, adDay: 19, kind: 'national' },
  { id: 'ghatasthapana', nameNe: 'घटस्थापना', nameEn: 'Ghatasthapana', bsMonth: 6, bsDay: 1, kind: 'religious' },
  { id: 'phulpati', nameNe: 'फूलपाती', nameEn: 'Phulpati', bsMonth: 6, bsDay: 7, kind: 'religious' },
  { id: 'maha-ashtami', nameNe: 'महाअष्टमी', nameEn: 'Maha Ashtami', bsMonth: 6, bsDay: 8, kind: 'religious' },
  { id: 'maha-navami', nameNe: 'महानवमी', nameEn: 'Maha Navami', bsMonth: 6, bsDay: 9, kind: 'religious' },
  { id: 'vijaya-dashami', nameNe: 'विजया दशमी', nameEn: 'Vijaya Dashami', bsMonth: 6, bsDay: 10, kind: 'religious' },
  { id: 'kag-tihar', nameNe: 'काग तिहार', nameEn: 'Kag Tihar', bsMonth: 7, bsDay: 13, kind: 'religious' },
  { id: 'kukur-tihar', nameNe: 'कुकुर तिहार', nameEn: 'Kukur Tihar', bsMonth: 7, bsDay: 14, kind: 'religious' },
  { id: 'laxmi-puja', nameNe: 'लक्ष्मी पूजा', nameEn: 'Laxmi Puja', bsMonth: 7, bsDay: 15, kind: 'religious' },
  { id: 'gobardhan', nameNe: 'गोवर्धन पूजा', nameEn: 'Gobardhan Puja', bsMonth: 7, bsDay: 16, kind: 'religious' },
  { id: 'bhai-tika', nameNe: 'भाइ टीका', nameEn: 'Bhai Tika', bsMonth: 7, bsDay: 17, kind: 'religious' },
  { id: 'chhath', nameNe: 'छठ पर्व', nameEn: 'Chhath', bsMonth: 7, bsDay: 20, kind: 'religious' },
  { id: 'udhauli', nameNe: 'उधौली', nameEn: 'Udhauli', bsMonth: 8, bsDay: 15, kind: 'cultural' },
  { id: 'christmas', nameNe: 'क्रिसमस', nameEn: 'Christmas', adMonth: 12, adDay: 25, kind: 'cultural' },
  { id: 'tamu-lhosar', nameNe: 'तमु ल्होसार', nameEn: 'Tamu Lhosar', bsMonth: 9, bsDay: 15, kind: 'cultural' },
  { id: 'sonam-lhosar', nameNe: 'सोनाम ल्होसार', nameEn: 'Sonam Lhosar', bsMonth: 10, bsDay: 1, kind: 'cultural' },
  { id: 'maghe-sankranti', nameNe: 'माघे संक्रान्ति', nameEn: 'Maghe Sankranti', bsMonth: 10, bsDay: 1, kind: 'cultural' },
  { id: 'sonam-losar-alt', nameNe: 'ग्याल्पो ल्होसार', nameEn: 'Gyalpo Lhosar', bsMonth: 11, bsDay: 1, kind: 'cultural' },
  { id: 'shivaratri', nameNe: 'महाशिवरात्रि', nameEn: 'Maha Shivaratri', bsMonth: 11, bsDay: 14, kind: 'religious' },
  { id: 'fagu-purnima', nameNe: 'फागु पूर्णिमा', nameEn: 'Fagu Purnima / Holi', bsMonth: 11, bsDay: 15, kind: 'religious' },
  { id: 'ghode-jatra', nameNe: 'घोडेजात्रा', nameEn: 'Ghode Jatra', bsMonth: 12, bsDay: 15, kind: 'cultural' },
  { id: 'labor-day', nameNe: 'अन्तर्राष्ट्रिय श्रमिक दिवस', nameEn: 'International Workers Day', adMonth: 5, adDay: 1, kind: 'national' },
  { id: 'martyrs-day', nameNe: 'शहीद दिवस', nameEn: 'Martyrs Day', adMonth: 1, adDay: 30, kind: 'national' },
]

export function festivalsForBsDay(bs: BsDate, ad?: AdDate): Festival[] {
  const adDate = ad ?? (() => {
    try {
      return bsToAd(bs)
    } catch {
      return undefined
    }
  })()

  return FESTIVALS.filter((f) => {
    if (f.bsMonth === bs.month && f.bsDay === bs.day) return true
    if (adDate && f.adMonth === adDate.month && f.adDay === adDate.day) return true
    return false
  })
}

export function festivalsInBsMonth(year: number, month: number): Array<Festival & { day: number }> {
  const out: Array<Festival & { day: number }> = []
  for (const f of FESTIVALS) {
    if (f.bsMonth === month && f.bsDay) {
      out.push({ ...f, day: f.bsDay })
      continue
    }
    if (f.adMonth && f.adDay) {
      // Map AD fixed festival into this BS month if it falls here
      for (let day = 1; day <= 32; day++) {
        try {
          const ad = bsToAd({ year, month, day })
          if (ad.month === f.adMonth && ad.day === f.adDay) {
            out.push({ ...f, day })
            break
          }
        } catch {
          break
        }
      }
    }
  }
  return out.sort((a, b) => a.day - b.day)
}

export function panchangForAd(ad: AdDate, locale: 'ne' | 'en' = 'ne') {
  const tithi = approximateTithi(ad)
  const nakshatra = approximateNakshatra(ad)
  return {
    tithi,
    nakshatra,
    tithiLabel: locale === 'ne' ? `${tithi.pakshaNe} ${tithi.nameNe}` : `${tithi.pakshaEn} ${tithi.nameEn}`,
    nakshatraLabel: locale === 'ne' ? nakshatra.nameNe : nakshatra.nameEn,
    note:
      locale === 'ne'
        ? 'तिथि र नक्षत्र अनुमानित गणना हुन्; मन्दिर/पञ्चाङ्ग पुस्तक सँग फरक हुनसक्छ।'
        : 'Tithi and nakshatra are approximated; temple almanacs may differ by a day.',
  }
}

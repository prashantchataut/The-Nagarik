import type { AdDate, BsDate } from './bs-calendar'
import {
  BS_MAX_YEAR,
  BS_MIN_YEAR,
  BS_MONTHS_EN,
  BS_MONTHS_NE,
  bsToAd,
  daysInBsMonth,
  isSupportedBsYear,
} from './bs-calendar'


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

/* -------------------------------------------------------------------------- */
/* Autonomous multi-year event engine (BS 2070–2095)                          */
/* -------------------------------------------------------------------------- */

export type PatroEventKind = 'religious' | 'national' | 'cultural' | 'lunar'

export type PatroEvent = {
  id: string
  year: number
  month: number
  day: number
  nameNe: string
  nameEn: string
  kind: PatroEventKind
  /** Marked public rest day in most calendars. */
  holiday?: boolean
}

type LunarRule = {
  id: string
  nameNe: string
  nameEn: string
  /** Anchor BS month where the tithi is expected to begin its search window. */
  bsMonth: number
  paksha: Paksha
  /** 1-15 within the paksha (15 = Purnima on shukla, Amavasya on krishna). */
  tithi: number
  kind: PatroEventKind
  holiday?: boolean
}

/**
 * Major movable (lunar) festivals defined by tithi rules.
 * The engine resolves each rule to a civil day per year by scanning the
 * anchor BS month plus a spill window into the following month, mirroring
 * how lunar months drift across solar Bikram Sambat months.
 */
const LUNAR_RULES: LunarRule[] = [
  { id: 'buddha-jayanti', nameNe: 'बुद्ध जयन्ती', nameEn: 'Buddha Jayanti', bsMonth: 1, paksha: 'shukla', tithi: 15, kind: 'religious', holiday: true },
  { id: 'mata-tirtha-aunsi', nameNe: 'मातातीर्थ औंसी (आमाको मुख हेर्ने दिन)', nameEn: 'Mata Tirtha Aunsi', bsMonth: 1, paksha: 'krishna', tithi: 15, kind: 'cultural' },
  { id: 'harishayani-ekadashi', nameNe: 'हरिशयनी एकादशी', nameEn: 'Harishayani Ekadashi', bsMonth: 3, paksha: 'shukla', tithi: 11, kind: 'religious' },
  { id: 'nag-panchami', nameNe: 'नाग पञ्चमी', nameEn: 'Nag Panchami', bsMonth: 4, paksha: 'shukla', tithi: 5, kind: 'religious' },
  { id: 'janai-purnima', nameNe: 'जनै पूर्णिमा / रक्षाबन्धन', nameEn: 'Janai Purnima', bsMonth: 4, paksha: 'shukla', tithi: 15, kind: 'religious', holiday: true },
  { id: 'gai-jatra', nameNe: 'गाईजात्रा', nameEn: 'Gai Jatra', bsMonth: 5, paksha: 'krishna', tithi: 1, kind: 'cultural' },
  { id: 'krishna-janmashtami', nameNe: 'कृष्ण जन्माष्टमी', nameEn: 'Krishna Janmashtami', bsMonth: 5, paksha: 'krishna', tithi: 8, kind: 'religious', holiday: true },
  { id: 'kushe-aunsi', nameNe: 'कुशे औंसी (बुवाको मुख हेर्ने दिन)', nameEn: 'Kushe Aunsi', bsMonth: 5, paksha: 'krishna', tithi: 15, kind: 'cultural' },
  { id: 'teej', nameNe: 'हरितालिका तीज', nameEn: 'Haritalika Teej', bsMonth: 5, paksha: 'shukla', tithi: 3, kind: 'religious', holiday: true },
  { id: 'rishi-panchami', nameNe: 'ऋषि पञ्चमी', nameEn: 'Rishi Panchami', bsMonth: 5, paksha: 'shukla', tithi: 5, kind: 'religious' },
  { id: 'indra-jatra', nameNe: 'इन्द्रजात्रा', nameEn: 'Indra Jatra', bsMonth: 5, paksha: 'shukla', tithi: 14, kind: 'cultural' },
  { id: 'ghatasthapana', nameNe: 'घटस्थापना', nameEn: 'Ghatasthapana', bsMonth: 6, paksha: 'shukla', tithi: 1, kind: 'religious', holiday: true },
  { id: 'phulpati', nameNe: 'फूलपाती', nameEn: 'Phulpati', bsMonth: 6, paksha: 'shukla', tithi: 7, kind: 'religious', holiday: true },
  { id: 'maha-ashtami', nameNe: 'महाअष्टमी', nameEn: 'Maha Ashtami', bsMonth: 6, paksha: 'shukla', tithi: 8, kind: 'religious', holiday: true },
  { id: 'maha-navami', nameNe: 'महानवमी', nameEn: 'Maha Navami', bsMonth: 6, paksha: 'shukla', tithi: 9, kind: 'religious', holiday: true },
  { id: 'vijaya-dashami', nameNe: 'विजया दशमी', nameEn: 'Vijaya Dashami', bsMonth: 6, paksha: 'shukla', tithi: 10, kind: 'religious', holiday: true },
  { id: 'kojagrat-purnima', nameNe: 'कोजाग्रत पूर्णिमा', nameEn: 'Kojagrat Purnima', bsMonth: 6, paksha: 'shukla', tithi: 15, kind: 'religious' },
  { id: 'kag-tihar', nameNe: 'काग तिहार', nameEn: 'Kag Tihar', bsMonth: 7, paksha: 'krishna', tithi: 13, kind: 'religious' },
  { id: 'kukur-tihar', nameNe: 'कुकुर तिहार', nameEn: 'Kukur Tihar', bsMonth: 7, paksha: 'krishna', tithi: 14, kind: 'religious' },
  { id: 'laxmi-puja', nameNe: 'लक्ष्मी पूजा', nameEn: 'Laxmi Puja', bsMonth: 7, paksha: 'krishna', tithi: 15, kind: 'religious', holiday: true },
  { id: 'gobardhan-puja', nameNe: 'गोवर्धन पूजा / म्हः पूजा', nameEn: 'Gobardhan Puja', bsMonth: 7, paksha: 'shukla', tithi: 1, kind: 'religious', holiday: true },
  { id: 'bhai-tika', nameNe: 'भाइटीका', nameEn: 'Bhai Tika', bsMonth: 7, paksha: 'shukla', tithi: 2, kind: 'religious', holiday: true },
  { id: 'chhath', nameNe: 'छठ पर्व', nameEn: 'Chhath Parva', bsMonth: 7, paksha: 'shukla', tithi: 6, kind: 'religious', holiday: true },
  { id: 'haribodhini-ekadashi', nameNe: 'हरिबोधिनी एकादशी', nameEn: 'Haribodhini Ekadashi', bsMonth: 7, paksha: 'shukla', tithi: 11, kind: 'religious' },
  { id: 'yomari-punhi', nameNe: 'योमरी पुन्ही / उधौली', nameEn: 'Yomari Punhi / Udhauli', bsMonth: 8, paksha: 'shukla', tithi: 15, kind: 'cultural' },
  { id: 'swasthani-start', nameNe: 'स्वस्थानी व्रत आरम्भ', nameEn: 'Swasthani Vrata begins', bsMonth: 9, paksha: 'shukla', tithi: 15, kind: 'religious' },
  { id: 'shree-panchami', nameNe: 'श्रीपञ्चमी / सरस्वती पूजा', nameEn: 'Shree Panchami / Saraswati Puja', bsMonth: 10, paksha: 'shukla', tithi: 5, kind: 'religious' },
  { id: 'maha-shivaratri', nameNe: 'महाशिवरात्रि', nameEn: 'Maha Shivaratri', bsMonth: 11, paksha: 'krishna', tithi: 14, kind: 'religious', holiday: true },
  { id: 'fagu-purnima', nameNe: 'फागु पूर्णिमा / होली', nameEn: 'Fagu Purnima / Holi', bsMonth: 11, paksha: 'shukla', tithi: 15, kind: 'religious', holiday: true },
  { id: 'ghode-jatra', nameNe: 'घोडेजात्रा', nameEn: 'Ghode Jatra', bsMonth: 12, paksha: 'krishna', tithi: 15, kind: 'cultural' },
  { id: 'chaite-dashain', nameNe: 'चैते दशैं', nameEn: 'Chaite Dashain', bsMonth: 12, paksha: 'shukla', tithi: 8, kind: 'religious' },
  { id: 'ram-navami', nameNe: 'राम नवमी', nameEn: 'Ram Navami', bsMonth: 12, paksha: 'shukla', tithi: 9, kind: 'religious', holiday: true },
]

/** Fixed events keyed by the solar Bikram Sambat month/day. */
const FIXED_BS_EVENTS: Array<{ id: string; nameNe: string; nameEn: string; month: number; day: number; kind: PatroEventKind; holiday?: boolean }> = [
  { id: 'naya-barsha', nameNe: 'नयाँ वर्ष', nameEn: 'Nepali New Year', month: 1, day: 1, kind: 'national', holiday: true },
  { id: 'gaura-parva', nameNe: 'गौरा पर्व', nameEn: 'Gaura Parva', month: 5, day: 8, kind: 'cultural' },
  { id: 'tamu-lhosar', nameNe: 'तमु ल्होसार', nameEn: 'Tamu Lhosar', month: 9, day: 15, kind: 'cultural', holiday: true },
  { id: 'maghe-sankranti', nameNe: 'माघे संक्रान्ति', nameEn: 'Maghe Sankranti', month: 10, day: 1, kind: 'cultural', holiday: true },
  { id: 'sonam-lhosar', nameNe: 'सोनाम ल्होसार', nameEn: 'Sonam Lhosar', month: 10, day: 18, kind: 'cultural', holiday: true },
  { id: 'gyalpo-lhosar', nameNe: 'ग्याल्पो ल्होसार', nameEn: 'Gyalpo Lhosar', month: 11, day: 18, kind: 'cultural', holiday: true },
]

/** Fixed national/international days on the Gregorian calendar. */
const FIXED_AD_EVENTS: Array<{ id: string; nameNe: string; nameEn: string; month: number; day: number; kind: PatroEventKind; holiday?: boolean }> = [
  { id: 'martyrs-day', nameNe: 'शहीद दिवस', nameEn: 'Martyrs Day', month: 1, day: 30, kind: 'national', holiday: true },
  { id: 'loktantra-diwas', nameNe: 'लोकतन्त्र दिवस', nameEn: 'Democracy Day', month: 2, day: 19, kind: 'national', holiday: true },
  { id: 'womens-day', nameNe: 'अन्तर्राष्ट्रिय महिला दिवस', nameEn: "International Women's Day", month: 3, day: 8, kind: 'cultural', holiday: true },
  { id: 'labour-day', nameNe: 'अन्तर्राष्ट्रिय श्रमिक दिवस', nameEn: 'International Workers Day', month: 5, day: 1, kind: 'national', holiday: true },
  { id: 'republic-day', nameNe: 'गणतन्त्र दिवस', nameEn: 'Republic Day', month: 5, day: 29, kind: 'national', holiday: true },
  { id: 'constitution-day', nameNe: 'संविधान दिवस', nameEn: 'Constitution Day', month: 9, day: 19, kind: 'national', holiday: true },
  { id: 'christmas', nameNe: 'क्रिसमस', nameEn: 'Christmas', month: 12, day: 25, kind: 'cultural', holiday: true },
]

const SANKRANTI_SPECIAL: Record<number, { nameNe: string; nameEn: string }> = {
  4: { nameNe: 'साउने संक्रान्ति / लुतो फाल्ने', nameEn: 'Saune Sankranti' },
}

function tithiForBs(bs: BsDate): TithiInfo | null {
  try {
    return approximateTithi(bsToAd(bs))
  } catch {
    return null
  }
}

function* iterateBsDays(start: BsDate, count: number): Generator<BsDate> {
  let { year, month, day } = start
  for (let i = 0; i < count; i++) {
    const len = daysInBsMonth(year, month)
    if (!len) return
    yield { year, month, day }
    day += 1
    if (day > len) {
      day = 1
      month += 1
      if (month > 12) {
        month = 1
        year += 1
      }
      if (!isSupportedBsYear(year)) return
    }
  }
}

function* iterateBsDaysBackward(start: BsDate, count: number): Generator<BsDate> {
  let { year, month, day } = start
  for (let i = 0; i < count; i++) {
    day -= 1
    if (day < 1) {
      month -= 1
      if (month < 1) {
        month = 12
        year -= 1
      }
      if (!isSupportedBsYear(year)) return
      day = daysInBsMonth(year, month)
    }
    yield { year, month, day }
  }
}

/**
 * Resolve a lunar rule to a civil BS day for a given year.
 * Scans the anchor month plus a spill window into the next month so festivals
 * that drift past the solar month boundary (e.g. Dashain in early Kartik)
 * still resolve to their true day.
 */
export function resolveLunarRule(year: number, rule: LunarRule): BsDate | null {
  if (!isSupportedBsYear(year)) return null
  const monthLen = daysInBsMonth(year, rule.bsMonth)
  if (!monthLen) return null

  // Locate the new moon within the anchor month (take the last occurrence).
  let amavasya: BsDate | null = null
  for (let day = 1; day <= monthLen; day++) {
    const tithi = tithiForBs({ year, month: rule.bsMonth, day })
    if (tithi && tithi.paksha === 'krishna' && tithi.number === 15) {
      amavasya = { year, month: rule.bsMonth, day }
    }
  }

  if (amavasya) {
    if (rule.paksha === 'krishna') {
      if (rule.tithi === 15) return amavasya
      // Scan backward across the waning fortnight before the new moon.
      for (const bs of iterateBsDaysBackward(amavasya, 17)) {
        const tithi = tithiForBs(bs)
        if (tithi && tithi.paksha === 'krishna' && tithi.number === rule.tithi) return bs
      }
    } else {
      // Scan forward across the waxing fortnight that follows the new moon.
      let skippedSelf = false
      for (const bs of iterateBsDays(amavasya, 19)) {
        if (!skippedSelf) {
          skippedSelf = true
          continue
        }
        const tithi = tithiForBs(bs)
        if (tithi && tithi.paksha === 'shukla' && tithi.number === rule.tithi) return bs
      }
    }
  }

  // Fallback: plain window scan over the anchor month plus spill days.
  for (const bs of iterateBsDays({ year, month: rule.bsMonth, day: 1 }, monthLen + 16)) {
    const tithi = tithiForBs(bs)
    if (!tithi) continue
    if (tithi.paksha === rule.paksha && tithi.number === rule.tithi) return bs
  }
  return null
}


/**
 * Lunar day markers (Ekadashi, Purnima, Amavasya) generated for every day of
 * the requested BS month. Consecutive duplicate tithis are deduped.
 */
export function lunarMarkersInBsMonth(year: number, month: number): PatroEvent[] {
  const len = daysInBsMonth(year, month)
  if (!len || !isSupportedBsYear(year)) return []
  const out: PatroEvent[] = []
  let previousKey = ''
  for (let day = 1; day <= len; day++) {
    const tithi = tithiForBs({ year, month, day })
    if (!tithi) continue
    const key = `${tithi.paksha}-${tithi.number}`
    const isRepeat = key === previousKey
    previousKey = key
    if (isRepeat) continue
    if (tithi.number === 11) {
      out.push({
        id: `ekadashi-${tithi.paksha}-${year}-${month}-${day}`,
        year, month, day,
        nameNe: `${tithi.pakshaNe} एकादशी व्रत`,
        nameEn: `${tithi.pakshaEn} Ekadashi`,
        kind: 'lunar',
      })
    } else if (tithi.paksha === 'shukla' && tithi.number === 15) {
      out.push({
        id: `purnima-${year}-${month}-${day}`,
        year, month, day,
        nameNe: 'पूर्णिमा',
        nameEn: 'Purnima (full moon)',
        kind: 'lunar',
      })
    } else if (tithi.paksha === 'krishna' && tithi.number === 15) {
      out.push({
        id: `amavasya-${year}-${month}-${day}`,
        year, month, day,
        nameNe: 'औंसी',
        nameEn: 'Amavasya (new moon)',
        kind: 'lunar',
      })
    }
  }
  return out
}

/**
 * Full autonomous event set for any supported BS month:
 * Sankranti, fixed BS/AD observances, tithi-rule festivals, and lunar markers.
 */
export function eventsInBsMonth(year: number, month: number): PatroEvent[] {
  if (!isSupportedBsYear(year) || month < 1 || month > 12) return []
  const len = daysInBsMonth(year, month)
  const out: PatroEvent[] = []
  const seen = new Set<string>()
  const push = (event: PatroEvent) => {
    if (event.day < 1 || event.day > len) return
    if (seen.has(event.id)) return
    seen.add(event.id)
    out.push(event)
  }

  // 1. Sankranti: first day of every solar BS month.
  const special = SANKRANTI_SPECIAL[month]
  push({
    id: `sankranti-${year}-${month}`,
    year, month, day: 1,
    nameNe: special ? special.nameNe : `${BS_MONTHS_NE[month - 1]} संक्रान्ति`,
    nameEn: special ? special.nameEn : `${BS_MONTHS_EN[month - 1]} Sankranti`,
    kind: 'cultural',
  })

  // 2. Fixed BS-date observances.
  for (const f of FIXED_BS_EVENTS) {
    if (f.month === month) {
      push({ id: f.id, year, month, day: f.day, nameNe: f.nameNe, nameEn: f.nameEn, kind: f.kind, holiday: f.holiday })
    }
  }

  // 3. Fixed AD-date observances mapped into this BS month.
  for (let day = 1; day <= len; day++) {
    let ad: AdDate
    try {
      ad = bsToAd({ year, month, day })
    } catch {
      break
    }
    for (const f of FIXED_AD_EVENTS) {
      if (f.month === ad.month && f.day === ad.day) {
        push({ id: f.id, year, month, day, nameNe: f.nameNe, nameEn: f.nameEn, kind: f.kind, holiday: f.holiday })
      }
    }
  }

  // 4. Movable lunar-rule festivals: rules anchored to the previous, current,
  //    or next month may resolve to a day inside this month.
  for (const offset of [-1, 0, 1]) {
    let anchorMonth = month + offset
    let anchorYear = year
    if (anchorMonth < 1) {
      anchorMonth = 12
      anchorYear = year - 1
    } else if (anchorMonth > 12) {
      anchorMonth = 1
      anchorYear = year + 1
    }
    for (const rule of LUNAR_RULES) {
      if (rule.bsMonth !== anchorMonth) continue
      const resolved = resolveLunarRule(anchorYear, rule)
      if (resolved && resolved.year === year && resolved.month === month) {
        push({
          id: rule.id,
          year, month, day: resolved.day,
          nameNe: rule.nameNe, nameEn: rule.nameEn,
          kind: rule.kind, holiday: rule.holiday,
        })
      }
    }
  }


  // 5. Ekadashi / Purnima / Amavasya markers.
  const majorByDay = new Map(out.map((e) => [e.day, e.kind]))
  for (const marker of lunarMarkersInBsMonth(year, month)) {
    const existing = majorByDay.get(marker.day)
    // Skip a plain marker when a named festival already owns the day.
    if (existing && existing !== 'lunar') continue
    push(marker)
  }

  return out.sort((a, b) => a.day - b.day)
}

/** Events for a single BS day, computed from the autonomous month engine. */
export function eventsForBsDay(bs: BsDate): PatroEvent[] {
  return eventsInBsMonth(bs.year, bs.month).filter((e) => e.day === bs.day)
}

/**
 * Upcoming events relative to any BS anchor date (defaults to scanning
 * forward from the given day across up to `monthSpan` months).
 */
export function upcomingPatroEvents(
  from: BsDate,
  opts?: { limit?: number; monthSpan?: number; includeSameDay?: boolean },
): PatroEvent[] {
  const limit = opts?.limit ?? 10
  const monthSpan = opts?.monthSpan ?? 4
  const includeSameDay = opts?.includeSameDay ?? true
  const items: PatroEvent[] = []
  let year = from.year
  let month = from.month
  for (let i = 0; i < monthSpan && items.length < limit; i++) {
    if (!isSupportedBsYear(year)) break
    for (const event of eventsInBsMonth(year, month)) {
      if (i === 0) {
        if (includeSameDay ? event.day < from.day : event.day <= from.day) continue
      }
      items.push(event)
      if (items.length >= limit) break
    }
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }
  return items
}

export const PATRO_SUPPORTED_RANGE = { min: BS_MIN_YEAR, max: BS_MAX_YEAR }

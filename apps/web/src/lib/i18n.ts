import type { Locale } from '@thenagarik/content'

export const locales = ['ne', 'en'] as const
export type AppLocale = (typeof locales)[number]

export function isLocale(value: string): value is AppLocale {
  return locales.includes(value as AppLocale)
}

export function toContentLocale(locale: AppLocale): Locale {
  return locale
}

export const dictionaries = {
  ne: {
    siteName: 'द नागरिक',
    tagline: 'नेपालको नागरिक समाचार',
    latest: 'ताजा',
    latestUpdates: 'ताजा अपडेट',
    trending: 'चर्चित',
    mostRead: 'धेरै पढिएको',
    search: 'खोज',
    about: 'हाम्रो बारे',
    readMore: 'पढ्नुहोस्',
    related: 'सम्बन्धित',
    share: 'लिङ्क कपी',
    copied: 'कपी भयो',
    minutesRead: 'मिनेट पढाइ',
    updated: 'अद्यावधिक',
    breaking: 'ब्रेकिङ',
    empty: 'अहिले कुनै सामग्री छैन।',
    language: 'English',
    home: 'गृह',
    categories: 'वर्ग',
    trust: 'विश्वास',
    corrections: 'सच्याइएको',
    authors: 'लेखक',
    searchPlaceholder: 'समाचार खोज्नुहोस्',
    searchResults: 'नतिजा',
    fixtureBanner: 'डेभ फिक्स्चर - वास्तविक समाचार होइन',
    coldStart: 'अहिले पर्याप्त पाठक संकेत छैन, ताजा क्रममा देखाइँदै',
    forYou: 'तपाईंका लागि',
    algorithmDesk: 'एल्गोरिदम डेस्क',
    provinces: 'प्रदेश',
    opinion: 'विचार',
    visual: 'दृश्य',
    menu: 'मेनु',
    close: 'बन्द',
    consentBody: 'तपाईंले अनुमति दिएपछि मात्र पहिलो-पक्ष विश्लेषण चल्छ। सहमति बिना र्याङ्किङ बनाइँदैन।',
    consentReject: 'अस्वीकार',
    consentAccept: 'स्वीकार',
    liveLabel: 'लाइभ',
    textSize: 'अक्षर आकार',
    textSmall: 'सानो',
    textMedium: 'मध्यम',
    textLarge: 'ठूलो',
    seeAll: 'सबै हेर्नुहोस्',
    today: 'आज',
    continueReading: 'पढाइ जारी',
  },
  en: {
    siteName: 'The Nagarik',
    tagline: 'Civic news for Nepal',
    latest: 'Latest',
    latestUpdates: 'Latest updates',
    trending: 'Trending',
    mostRead: 'Most read',
    search: 'Search',
    about: 'About',
    readMore: 'Read',
    related: 'Related',
    share: 'Copy link',
    copied: 'Copied',
    minutesRead: 'min read',
    updated: 'Updated',
    breaking: 'Breaking',
    empty: 'No stories yet.',
    language: 'नेपाली',
    home: 'Home',
    categories: 'Sections',
    trust: 'Trust',
    corrections: 'Corrections',
    authors: 'Authors',
    searchPlaceholder: 'Search the news',
    searchResults: 'Results',
    fixtureBanner: 'DEV fixtures - not real newsroom content',
    coldStart: 'Not enough reader signals yet, showing recent order',
    forYou: 'For you',
    algorithmDesk: 'Algorithm desk',
    provinces: 'Provinces',
    opinion: 'Opinion',
    visual: 'Visual',
    menu: 'Menu',
    close: 'Close',
    consentBody:
      'We use first-party analytics only after you opt in. Rankings stay empty until real events arrive.',
    consentReject: 'Reject',
    consentAccept: 'Accept',
    liveLabel: 'Live',
    textSize: 'Text size',
    textSmall: 'S',
    textMedium: 'M',
    textLarge: 'L',
    seeAll: 'See all',
    continueReading: 'Continue reading',
    today: 'Today',
  },
} as const

export type Dictionary = (typeof dictionaries)[AppLocale]

export function getDictionary(locale: AppLocale): Dictionary {
  return dictionaries[locale]
}

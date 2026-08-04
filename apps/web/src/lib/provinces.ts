import type { AppLocale } from '@/lib/i18n'

const labels = {
  bagmati: { ne: 'बागमती', en: 'Bagmati' },
  madhesh: { ne: 'मधेश', en: 'Madhesh' },
  gandaki: { ne: 'गण्डकी', en: 'Gandaki' },
  lumbini: { ne: 'लुम्बिनी', en: 'Lumbini' },
  karnali: { ne: 'कर्णाली', en: 'Karnali' },
  sudurpashchim: { ne: 'सुदूरपश्चिम', en: 'Sudurpashchim' },
  koshi: { ne: 'कोशी', en: 'Koshi' },
} as const

export function provinceLabel(slug: string | undefined, locale: AppLocale): string | undefined {
  if (!slug) return undefined
  const row = labels[slug as keyof typeof labels]
  if (!row) return slug
  return locale === 'en' ? row.en : row.ne
}

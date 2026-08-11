import type { AppLocale } from '@/lib/i18n'
import { SITE } from '@/site.config'

/** Brand constants derive from site.config - never hardcode brand strings. */
export const BRAND_EN = SITE.brand.en
export const BRAND_NE = SITE.brand.ne
export const SITE_DOMAIN = SITE.domain
export const SITE_ID = SITE.id

/** Patro product URL — subdomain when configured, else in-app route. */
export function patroHref(locale: AppLocale): string {
  const base = process.env.NEXT_PUBLIC_CALENDAR_URL?.replace(/\/$/, '')
  if (base) return base
  return `/${locale}/utilities/nepali-patro`
}

export function newsHomeHref(locale: AppLocale): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (site) return `${site}/${locale}`
  return `/${locale}`
}

/** Swap locale segment in a pathname; keep rest of path when possible. */
export function swapLocalePath(pathname: string, nextLocale: AppLocale): string {
  const parts = pathname.split('/')
  if (parts.length >= 2 && (parts[1] === 'ne' || parts[1] === 'en')) {
    parts[1] = nextLocale
    return parts.join('/') || `/${nextLocale}`
  }
  return `/${nextLocale}`
}

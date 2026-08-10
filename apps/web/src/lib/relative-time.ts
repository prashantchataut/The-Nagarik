/** Shared relative-time helper (safe for SSR absolute use via RelativeTime client wrapper). */
import type { AppLocale } from '@/lib/i18n'

const NEP_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']
function toNepDigit(n: number): string {
  return String(n)
    .split('')
    .map((d) => NEP_DIGITS[parseInt(d, 10)] ?? d)
    .join('')
}

export function relativeTime(iso: string | undefined, locale: AppLocale): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.max(1, Math.round(diff / 60_000))
  if (locale === 'ne') {
    if (mins < 60) return `${toNepDigit(mins)} मिनेट अगाडि`
    const hours = Math.round(mins / 60)
    if (hours < 24) return `${toNepDigit(hours)} घण्टा अगाडि`
    return `${toNepDigit(Math.round(hours / 24))} दिन अगाडि`
  }
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

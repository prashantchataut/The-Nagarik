/**
 * Market rate helpers for Patro.
 * Live fetchers stay behind LIVE_MARKET_RATES — default is labeled fixtures.
 */

export type BullionRow = {
  labelNe: string
  labelEn: string
  today: string
  yesterday: string
}

export const SAMPLE_BULLION: BullionRow[] = [
  { labelNe: 'हलो सुन', labelEn: 'Fine gold', today: '२,१५,५००', yesterday: '२,१४,८००' },
  { labelNe: 'तेजाबी सुन', labelEn: 'Tejabi gold', today: '२,१४,२००', yesterday: '२,१३,५००' },
  { labelNe: 'चाँदी', labelEn: 'Silver', today: '३,२५०', yesterday: '३,२२०' },
]

export const SAMPLE_USD_NPR = 133.45

export function marketRatesLiveEnabled(): boolean {
  return process.env.LIVE_MARKET_RATES === 'true'
}

/** Placeholder for a future NRB / vendor fetch. */
export async function fetchLiveBullion(): Promise<BullionRow[] | null> {
  if (!marketRatesLiveEnabled()) return null
  // No vendor wired yet — callers must fall back to SAMPLE_BULLION.
  return null
}

/** Placeholder for a future NRB / vendor fetch. */
export async function fetchLiveUsdNpr(): Promise<number | null> {
  if (!marketRatesLiveEnabled()) return null
  // No vendor wired yet — callers must fall back to SAMPLE_USD_NPR.
  return null
}

export async function resolveBullion(): Promise<{ rows: BullionRow[]; live: boolean }> {
  const live = await fetchLiveBullion()
  if (live?.length) return { rows: live, live: true }
  return { rows: SAMPLE_BULLION, live: false }
}

export async function resolveUsdNpr(): Promise<{ rate: number; live: boolean }> {
  const live = await fetchLiveUsdNpr()
  if (typeof live === 'number' && Number.isFinite(live)) return { rate: live, live: true }
  return { rate: SAMPLE_USD_NPR, live: false }
}

import { Coins, TrendUp } from '@phosphor-icons/react/dist/ssr'
import type { Dictionary } from '@/lib/i18n'
import { resolveBullion, resolveUsdNpr } from '@/lib/market-rates'

/**
 * Compact bullion/forex band — the Ratopati-style civic utility Nepali
 * portals carry on the front page. Server-rendered; labeled honestly as
 * sample data until LIVE_MARKET_RATES is wired to a real vendor.
 */
export async function MarketRatesStrip({
  locale,
  dict,
}: {
  locale: 'ne' | 'en'
  dict: Dictionary
}) {
  const [{ rows, live: bullionLive }, { rate: usd, live: forexLive }] = await Promise.all([
    resolveBullion(),
    resolveUsdNpr(),
  ])
  const sample = !bullionLive || !forexLive
  const gold = rows.find((r) => r.labelEn === 'Fine gold') ?? rows[0]
  const silver = rows.find((r) => r.labelEn === 'Silver') ?? rows[1]

  return (
    <section
      className="border-b border-line bg-paper-elevated"
      aria-label={dict.goldSilver}
    >
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-xs font-semibold md:px-6">
        <span className="inline-flex items-center gap-1.5 font-bold text-ink">
          <Coins size={15} weight="fill" className="text-accent" aria-hidden="true" />
          <span className="uppercase tracking-wider">{dict.goldSilver}</span>
        </span>

        {gold ? (
          <span className="inline-flex items-center gap-1.5 text-ink">
            <span className="text-stone">{locale === 'ne' ? gold.labelNe : gold.labelEn}</span>
            <span className="font-bold">
              {locale === 'ne' ? gold.today : gold.today}
            </span>
            <span className="text-success">
              <TrendUp size={12} weight="bold" aria-hidden="true" />
            </span>
          </span>
        ) : null}

        {silver ? (
          <span className="inline-flex items-center gap-1.5 text-ink">
            <span className="text-stone">{locale === 'ne' ? silver.labelNe : silver.labelEn}</span>
            <span className="font-bold">{silver.today}</span>
          </span>
        ) : null}

        <span className="hidden h-3.5 w-px bg-line sm:inline-block" aria-hidden="true" />

        <span className="inline-flex items-center gap-1.5 text-ink">
          <span className="text-stone">{dict.forexRates}</span>
          <span className="font-bold">
            USD {usd.toFixed(2)} <span className="text-stone">/ NPR</span>
          </span>
        </span>

        {sample ? (
          <span className="ml-auto rounded-full bg-paper px-2.5 py-0.5 text-[0.66rem] font-bold text-stone border border-line">
            {locale === 'ne' ? 'नमुना दर' : 'sample rates'}
          </span>
        ) : null}
      </div>
    </section>
  )
}

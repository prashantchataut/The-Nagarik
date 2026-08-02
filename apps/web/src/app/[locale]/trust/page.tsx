import { notFound } from 'next/navigation'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

export default async function TrustPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)

  return (
    <div className="mx-auto max-w-[65ch] px-4 py-16 md:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">{dict.trust}</h1>
      <div className="mt-6 space-y-4 text-lg leading-relaxed text-stone">
        {locale === 'ne' ? (
          <>
            <p>सच्याइएका कुरा लेखमा देखिन्छन्। र्याङ्किङ सहमति बिना बनाइँदैन।</p>
            <p>कानुनी दर्ता विवरण सार्वजनिक हुनुअघि हामी अनुपालन दाबी गर्दैनौं।</p>
          </>
        ) : (
          <>
            <p>Corrections stay visible on the story. Rankings are never invented without consented events.</p>
            <p>We do not claim legal compliance until publisher identity is verified in environment.</p>
          </>
        )}
      </div>
    </div>
  )
}

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { HistoryPanel } from '@/components/account/HistoryPanel'
import { isLocale, type AppLocale } from '@/lib/i18n'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Reading History',
  robots: { index: false, follow: false },
}

export default async function ReadingHistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale

  return (
    <>
      <h2 className="sr-only">{locale === 'ne' ? 'पढाइ इतिहास' : 'Reading history'}</h2>
      <HistoryPanel locale={locale} variant="full" />
    </>
  )
}

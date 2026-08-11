import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { SavedStoriesPanel } from '@/components/account/SavedStoriesPanel'
import { isLocale, type AppLocale } from '@/lib/i18n'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Saved Stories',
  robots: { index: false, follow: false },
}

export default async function SavedStoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale

  return (
    <>
      <h2 className="sr-only">{locale === 'ne' ? 'सुरक्षित समाचार' : 'Saved stories'}</h2>
      <SavedStoriesPanel locale={locale} variant="full" />
    </>
  )
}

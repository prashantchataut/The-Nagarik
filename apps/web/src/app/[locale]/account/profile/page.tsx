import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ReaderProfileForm } from '@/components/account/ReaderProfileForm'
import { getReaderSession } from '@/lib/auth/reader-session'
import { getContent } from '@/lib/content'
import { isLocale, type AppLocale } from '@/lib/i18n'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Profile',
  robots: { index: false, follow: false },
}

export default async function ReaderProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale

  const content = getContent()
  const [categories, reader] = await Promise.all([
    content.listCategories().then((list) =>
      list.map((category) => ({
        slug: category.slug,
        ne: category.nameNe,
        en: category.nameEn,
      })),
    ),
    getReaderSession(),
  ])

  return (
    <>
      <h2 className="sr-only">{locale === 'ne' ? 'पाठक प्रोफाइल' : 'Reader profile'}</h2>
      <ReaderProfileForm locale={locale} categories={categories} account={reader} />
    </>
  )
}

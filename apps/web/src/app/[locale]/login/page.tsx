import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { isLocale } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

/** Locale login entry → branded staff login (avoids nesting StaffAuthShell inside reader chrome). */
export default async function LocaleLoginRedirect({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  redirect('/admin/login')
}

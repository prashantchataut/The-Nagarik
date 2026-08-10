import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  BookmarkSimple,
  ShieldCheck,
  User,
  ArrowRight,
  House,
  SignOut,
} from '@phosphor-icons/react/dist/ssr'
import { StaffLogoutButton } from '@/components/auth/StaffLogoutButton'
import { primaryRole } from '@/lib/auth/staff-roles'
import { getStaffSession } from '@/lib/auth/staff-session'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Account · The Nagarik',
  robots: { index: false, follow: false },
}

export default async function LocaleAccountPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()

  const locale = raw as AppLocale
  const dict = getDictionary(locale)
  const session = await getStaffSession()
  const isNe = locale === 'ne'

  return (
    <main className="mx-auto max-w-[1040px] px-4 py-8 md:px-6 md:py-14">
      <header className="border-b-2 border-accent pb-6 mb-10">
        <p className="text-xs font-bold uppercase tracking-wider text-accent">
          {dict.siteName}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-ink md:text-5xl">
          {dict.account}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-stone">
          {isNe
            ? 'पाठक प्राथमिकता, सुरक्षित गरिएका समाचार र समाचारकक्ष पहुँच व्यवस्थापन।'
            : 'Reader preferences, saved reading lists, and newsroom staff access.'}
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Reader Profile & Bookmarks Card */}
        <section className="surface-card p-6 md:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-accent">
              <BookmarkSimple size={22} weight="bold" />
              <h2 className="text-xl font-bold text-ink">
                {isNe ? 'सुरक्षित गरिएका समाचार' : 'Saved Reading List'}
              </h2>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-stone">
              {isNe
                ? 'तपाईंले समाचार पढ्दा ‘सेभ’ बटन थिचेर सुरक्षित गरेका लेखहरू तपाईंको उपकरणको स्थानीय भण्डारमा सुरक्षित रहन्छन्।'
                : 'Stories you save using the bookmark button are preserved locally on your device for offline reading.'}
            </p>

            <div className="mt-6 rounded-[var(--radius-control)] bg-paper-elevated border border-line p-4 text-xs text-stone">
              <p className="font-semibold text-ink">
                {isNe ? 'गोपनीयता पहिलो:' : 'Privacy First:'}
              </p>
              <p className="mt-1">
                {isNe
                  ? 'हामी पाठकलाई अनावश्यक खाता बनाउन वा व्यक्तिगत डेटा दिन बाध्य गर्दैनौं। सबै पढाइ खुला र ट्रयाकिङ-मुक्त छ।'
                  : 'No account required. Your reading history and bookmarks stay completely private on your browser.'}
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-line/60 pt-4">
            <Link
              href={`/${locale}/latest`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline"
            >
              <span>{isNe ? 'ताजा समाचार पढ्न जानुहोस्' : 'Browse latest stories'}</span>
              <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        </section>

        {/* Staff & Newsroom Desk Access Card */}
        <section className="surface-card p-6 md:p-8 flex flex-col justify-between border-accent/40 bg-paper-elevated">
          <div>
            <div className="flex items-center gap-2 text-accent">
              <ShieldCheck size={22} weight="bold" />
              <h2 className="text-xl font-bold text-ink">
                {isNe ? 'समाचारकक्ष स्टाफ पहुँच' : 'Staff Newsroom Access'}
              </h2>
            </div>

            {session ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-fg font-black text-lg">
                    {(session.name || session.email || 'U').slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-base font-bold text-ink">{session.name || 'Staff User'}</p>
                    <p className="text-xs text-stone">{session.email}</p>
                    <span className="mt-1 inline-block rounded-full bg-accent-muted px-2.5 py-0.5 text-[0.68rem] font-bold text-accent">
                      {primaryRole(session.roles) ?? 'staff'}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2.5">
                  <Link
                    href="/journalist"
                    className="inline-flex min-h-10 items-center rounded-[var(--radius-control)] accent-solid px-4 text-xs font-bold shadow-sm"
                  >
                    {isNe ? 'पत्रकार डेस्क खोल्नुहोस्' : 'Open Journalist Desk'}
                  </Link>

                  <Link
                    href="/admin"
                    className="inline-flex min-h-10 items-center rounded-[var(--radius-control)] border border-line bg-paper px-4 text-xs font-bold text-ink hover:border-accent"
                  >
                    {isNe ? 'सञ्चालन डेस्क' : 'Admin Desk'}
                  </Link>

                  <StaffLogoutButton className="rounded-[var(--radius-control)] border border-line bg-paper px-3 text-xs font-bold text-stone hover:text-danger hover:border-danger" />
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-xs leading-relaxed text-stone">
                  {isNe
                    ? 'पत्रकार, सम्पादक र प्रकाशकहरूले आफ्नो आधिकारिक खाताबाट समाचारकक्षमा सुरक्षित प्रवेश गर्न सक्नुहुन्छ।'
                    : 'Journalists, editors, and publishers can sign in to compose stories, review queues, and publish news.'}
                </p>

                <div className="mt-6">
                  <Link
                    href={`/${locale}/login`}
                    className="inline-flex min-h-10 items-center rounded-[var(--radius-control)] accent-solid px-5 text-xs font-bold shadow-sm"
                  >
                    {dict.login} →
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-line/60 pt-4 text-xs text-stone">
            <span>The Nagarik Newsroom Identity System</span>
          </div>
        </section>
      </div>
    </main>
  )
}

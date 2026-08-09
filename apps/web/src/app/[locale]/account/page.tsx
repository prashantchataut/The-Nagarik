import Link from 'next/link'
import { notFound } from 'next/navigation'
import { StaffLogoutButton } from '@/components/auth/StaffLogoutButton'
import { primaryRole } from '@/lib/auth/staff-roles'
import { getStaffSession } from '@/lib/auth/staff-session'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

export const dynamic = 'force-dynamic'
export const metadata = { robots: { index: false, follow: false } }

export default async function LocaleAccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()

  const locale = raw as AppLocale
  const dict = getDictionary(locale)
  const session = await getStaffSession()
  const copy =
    locale === 'ne'
      ? {
          kicker: 'व्यक्तिगत पहुँच',
          title: 'खाता',
          readerTitle: 'पाठक खाता अझै सुरु भएको छैन',
          readerBody:
            'बुकमार्क, सदस्यता वा निजीकरण सुरु नभएसम्म हामी पाठकलाई अनावश्यक खाता बनाउन बाध्य गर्दैनौं। समाचार पढ्न वा खोज्न लगइन आवश्यक छैन।',
          newsroomTitle: 'समाचारकक्ष पहुँच',
          newsroomBody: 'पत्रकार, सम्पादक र प्रकाशकले सुरक्षित समाचारकक्षबाट आफ्नो काम जारी राख्न सक्छन्।',
          desk: 'समाचारकक्ष खोल्नुहोस्',
          login: 'स्टाफ लगइन',
          session: 'सक्रिय समाचारकक्ष सत्र',
          privacy: 'पाठक खाता सुरु गर्दा यसको प्रयोजन, डेटा प्रयोग र नियन्त्रण स्पष्ट रूपमा यही पृष्ठमा बताइनेछ।',
        }
      : {
          kicker: 'Personal access',
          title: 'Account',
          readerTitle: 'Reader accounts are not launched yet',
          readerBody:
            'Until bookmarks, membership, or personalization have a real purpose, readers are not required to create an account. Reading and search remain open.',
          newsroomTitle: 'Newsroom access',
          newsroomBody: 'Journalists, editors, and publishers can continue their work in the secure newsroom.',
          desk: 'Open newsroom',
          login: 'Staff login',
          session: 'Active newsroom session',
          privacy: 'When reader accounts launch, their purpose, data use, and controls will be explained here before sign-up.',
        }

  return (
    <main className="mx-auto max-w-[900px] px-4 py-10 md:px-6 md:py-14">
      <header className="max-w-[680px]">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">{copy.kicker}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-0.035em] text-ink md:text-5xl">{copy.title}</h1>
      </header>

      <div className="mt-9 grid gap-8 md:grid-cols-2 md:gap-10">
        <section className="border-t-2 border-ink pt-5">
          <h2 className="text-xl font-bold tracking-[-0.02em] text-ink">{copy.readerTitle}</h2>
          <p className="mt-3 text-base leading-relaxed text-stone">{copy.readerBody}</p>
          <p className="mt-5 text-sm leading-relaxed text-stone">{copy.privacy}</p>
          <Link href={`/${locale}`} className="mt-6 inline-flex min-h-11 items-center font-bold text-accent hover:underline">
            {dict.home} →
          </Link>
        </section>

        <section className="border-t-2 border-accent pt-5">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-stone">
            {session ? copy.session : copy.newsroomTitle}
          </p>
          {session ? (
            <>
              <h2 className="mt-2 text-xl font-bold text-ink">{session.name || session.email}</h2>
              <p className="mt-1 text-sm text-stone">
                {session.email}
                {primaryRole(session.roles) ? ` · ${primaryRole(session.roles)}` : ''}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/journalist"
                  className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] accent-solid px-4 text-sm font-bold "
                >
                  {copy.desk}
                </Link>
                <StaffLogoutButton className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] border border-line px-4 text-sm font-semibold text-ink hover:border-danger hover:text-danger" />
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-2 text-xl font-bold text-ink">{copy.newsroomTitle}</h2>
              <p className="mt-3 text-base leading-relaxed text-stone">{copy.newsroomBody}</p>
              <Link
                href={`/${locale}/login`}
                className="mt-6 inline-flex min-h-11 items-center rounded-[var(--radius-control)] accent-solid px-4 text-sm font-bold "
              >
                {copy.login}
              </Link>
            </>
          )}
        </section>
      </div>
    </main>
  )
}

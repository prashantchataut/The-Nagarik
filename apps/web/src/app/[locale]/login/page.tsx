import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  ArrowRight,
  CheckCircle,
  Newspaper,
  ShieldCheck,
  UserCircle,
} from '@phosphor-icons/react/dist/ssr'
import { StaffLoginForm } from '@/components/auth/StaffLoginForm'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'
import { siteUrl } from '@/lib/content'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Staff Login | The Nagarik',
  description: 'The Nagarik staff newsroom and editorial portal access.',
  robots: { index: false, follow: false },
}

export default async function LocaleLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)
  const isNe = locale === 'ne'

  return (
    <div className="bg-paper-elevated py-8 md:py-14">
      <section className="mx-auto grid max-w-[1140px] overflow-hidden rounded-[var(--radius-lg)] border border-line bg-paper shadow-[0_24px_70px_rgb(16_32_29_/_0.08)] lg:grid-cols-[0.95fr_1.05fr]">
        {/* Visual Brand Side (Alpine Teal) */}
        <div className="relative min-h-[300px] overflow-hidden bg-nav lg:min-h-[640px]">
          <Image
            src="/media/demo/pradesh-2.jpg"
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-nav/75 backdrop-blur-[2px]" aria-hidden="true" />

          <div className="relative flex h-full flex-col justify-between p-6 text-nav-fg md:p-10">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-nav-accent">
                THE NAGARIK - NEWSROOM
              </p>
              <h1 className="mt-4 max-w-[14ch] text-3xl font-black leading-[1.18] tracking-[-0.035em] text-nav-fg md:text-4xl lg:text-5xl">
                {isNe ? 'समाचारकक्षमा सुरक्षित प्रवेश' : 'Secure Access to the Newsroom'}
              </h1>
              <p className="mt-4 max-w-[42ch] text-sm leading-relaxed text-nav-fg/85 md:text-base">
                {isNe
                  ? 'रिपोर्टिङ, सम्पादन, समीक्षा र प्रकाशनका लागि एउटै सुरक्षित स्टाफ प्रवेशद्वार।'
                  : 'Unified newsroom authentication for reporters, editors, and publishers.'}
              </p>
            </div>

            <div className="mt-10 space-y-3 text-xs font-bold text-nav-fg/90">
              <p className="flex items-center gap-2.5">
                <ShieldCheck size={18} weight="bold" className="text-nav-accent shrink-0" />
                <span>{isNe ? 'भूमिकाअनुसार सुरक्षित पहुँच (RBAC)' : 'Role-based access control'}</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Newspaper size={18} weight="bold" className="text-nav-accent shrink-0" />
                <span>{isNe ? 'मस्यौदादेखि प्रकाशनसम्म एउटै कार्यप्रवाह' : 'One unified workflow from draft to live news'}</span>
              </p>
              <p className="flex items-center gap-2.5">
                <CheckCircle size={18} weight="bold" className="text-nav-accent shrink-0" />
                <span>{isNe ? 'प्रमाणित बाइलाइन र मिडिया क्रेडिट' : 'Enforced author attribution & media gates'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Login Form Side */}
        <div className="p-6 md:p-10 lg:p-12">
          <div className="mx-auto max-w-[28rem]">
            <p className="text-xs font-bold uppercase tracking-wider text-accent">
              {dict.login}
            </p>
            <h2 className="mt-1.5 text-2xl font-black tracking-tight text-ink md:text-3xl">
              {isNe ? 'स्टाफ लगइन' : 'Staff Sign In'}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-stone">
              {isNe
                ? 'द नागरिकको आधिकारिक सम्पादकीय इमेल र पासवर्डबाट प्रवेश गर्नुहोस्।'
                : 'Enter your verified newsroom credentials to access your workbench.'}
            </p>

            <div className="mt-6">
              <StaffLoginForm nextPath="/journalist" />
            </div>

            <div className="my-8 border-t border-line" />

            {/* Reader Note */}
            <div className="rounded-[var(--radius-panel)] border border-line bg-paper-elevated p-4">
              <div className="flex gap-3 items-start">
                <UserCircle size={22} weight="bold" className="shrink-0 text-accent mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-ink">
                    {isNe ? 'पाठक सूचना' : 'Reader Notice'}
                  </h3>
                  <p className="mt-1 text-[0.72rem] leading-relaxed text-stone">
                    {isNe
                      ? 'समाचार पढ्न वा सुरक्षित गर्न पाठक लगइन आवश्यक छैन। सबै सामग्री खुला र निःशुल्क उपलब्ध छ।'
                      : 'No reader account is required to browse, search, or save articles. Everything is open.'}
                  </p>
                  <Link
                    href={`/${locale}/account`}
                    className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
                  >
                    <span>{isNe ? 'खाता स्थिति हेर्नुहोस्' : 'View account status'}</span>
                    <ArrowRight size={12} weight="bold" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

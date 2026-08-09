import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowRight, Newspaper, ShieldCheck, UserCircle } from '@phosphor-icons/react/dist/ssr'
import { StaffLoginForm } from '@/components/auth/StaffLoginForm'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Login | The Nagarik', description: 'The Nagarik account and newsroom access.', robots: { index: false, follow: false } }

export default async function LocaleLoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)
  const ne = locale === 'ne'

  return (
    <div className="bg-paper-elevated py-8 md:py-12">
      <section className="mx-auto grid max-w-[1120px] overflow-hidden rounded-[12px] border border-line bg-paper shadow-[0_24px_70px_rgb(15_50_44_/_10%)] lg:grid-cols-[0.92fr_1.08fr]">
        <div className="relative min-h-[300px] overflow-hidden bg-nav lg:min-h-[680px]">
          <Image src="/media/demo/pradesh-2.jpg" alt="" fill priority sizes="(max-width:1024px) 100vw, 46vw" className="object-cover opacity-65" />
          <div className="absolute inset-0 bg-nav/60" aria-hidden="true" />
          <div className="relative flex h-full flex-col justify-between p-6 text-nav-fg md:p-9 lg:p-10">
            <div>
              <p className="text-sm font-extrabold tracking-[0.08em] text-nav-accent">THE NAGARIK</p>
              <h1 className="mt-4 max-w-[12ch] text-4xl font-extrabold leading-[1.15] tracking-[-0.035em] md:text-5xl">
                {ne ? 'समाचारकक्षमा सुरक्षित प्रवेश' : 'Secure access to the newsroom'}
              </h1>
              <p className="mt-4 max-w-[40ch] text-base leading-7 text-nav-fg/82">
                {ne ? 'रिपोर्टिङ, सम्पादन, समीक्षा र प्रकाशनका लागि एउटै सुरक्षित स्टाफ प्रवेश।' : 'One secure staff entrance for reporting, editing, review and publishing.'}
              </p>
            </div>
            <div className="mt-10 grid gap-3 text-sm font-semibold text-nav-fg/88">
              <p className="flex items-center gap-2"><ShieldCheck size={20} weight="duotone" aria-hidden="true" />{ne ? 'भूमिकाअनुसार पहुँच' : 'Role-based access'}</p>
              <p className="flex items-center gap-2"><Newspaper size={20} weight="duotone" aria-hidden="true" />{ne ? 'ड्राफ्टदेखि प्रकाशनसम्म एउटै कार्यप्रवाह' : 'One workflow from draft to publish'}</p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-9 lg:p-12">
          <div className="mx-auto max-w-[30rem]">
            <p className="section-kicker">{dict.login}</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-ink md:text-4xl">{ne ? 'स्टाफ लगइन' : 'Staff sign in'}</h2>
            <p className="mt-3 text-sm leading-6 text-stone">{ne ? 'द नागरिकको सम्पादकीय खाताबाट प्रवेश गर्नुहोस्।' : 'Use your editorial account to continue.'}</p>

            <div className="mt-7"><StaffLoginForm nextPath="/journalist" /></div>

            <div className="my-8 border-t border-line" />

            <div className="rounded-[9px] bg-paper-elevated p-4">
              <div className="flex gap-3"><UserCircle size={24} weight="duotone" className="mt-0.5 shrink-0 text-accent" aria-hidden="true" /><div><h3 className="font-extrabold text-ink">{ne ? 'पाठक खाता' : 'Reader account'}</h3><p className="mt-1 text-sm leading-6 text-stone">{ne ? 'पाठक सदस्यता र saved stories सेवा अझै सार्वजनिक गरिएको छैन। उपलब्ध भएपछि यहीँबाट पहुँच हुनेछ।' : 'Reader membership and saved stories are not public yet. Access will appear here when the service launches.'}</p><Link href={`/${locale}/account`} className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-accent hover:underline">{ne ? 'खाता स्थिति हेर्नुहोस्' : 'View account status'}<ArrowRight size={16} weight="bold" aria-hidden="true" /></Link></div></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

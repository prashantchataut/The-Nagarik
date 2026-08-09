import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, LockKey, ShieldCheck } from '@phosphor-icons/react/dist/ssr'

export function StaffAuthShell({ title, lede, formTitle, children, footer }: { title: string; lede: string; formTitle: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-paper text-ink">
      <div className="grid min-h-[100dvh] lg:grid-cols-[minmax(23rem,0.88fr)_minmax(29rem,1.12fr)]">
        <aside className="relative flex min-h-[22rem] flex-col justify-between overflow-hidden bg-nav px-6 py-8 text-nav-fg md:px-10 md:py-10 lg:min-h-[100dvh] lg:px-[clamp(2.5rem,5vw,5rem)] lg:py-12">
          <Image src="/media/demo/rajniti-2.jpg" alt="" fill priority sizes="(max-width:1024px) 100vw, 45vw" className="object-cover opacity-25" />
          <div className="absolute inset-0 bg-nav/80" aria-hidden="true" />
          <div className="relative">
            <Link href="/ne" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-nav-fg/82 hover:text-nav-fg"><ArrowLeft size={17} weight="bold" aria-hidden="true" />पाठक साइट</Link>
            <div className="mt-10 max-w-[34rem] lg:mt-[clamp(6rem,14vh,10rem)]">
              <div className="flex items-center gap-2 text-xs font-extrabold tracking-[0.08em] text-nav-accent"><LockKey size={16} weight="bold" aria-hidden="true" />सम्पादकीय समाचारकक्ष</div>
              <p className="mt-4 text-2xl font-extrabold leading-none tracking-[-0.025em] text-nav-fg">द नागरिक</p>
              <h1 className="mt-5 max-w-[11ch] text-[clamp(2.5rem,4.7vw,4.8rem)] font-extrabold leading-[1.02] tracking-[-0.04em] text-nav-fg">{title}</h1>
              <p className="mt-5 max-w-[46ch] text-[1rem] leading-7 text-nav-fg/82">{lede}</p>
            </div>
          </div>
          <div className="relative mt-10 border-t border-nav-fg/20 pt-5 text-sm text-nav-fg/78"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-nav-accent" size={19} weight="bold" aria-hidden="true" /><p className="max-w-[44ch] leading-6">एउटै स्टाफ खाताले भूमिकाअनुसार आवश्यक लेखन, समीक्षा र प्रकाशन पहुँच मात्र दिन्छ।</p></div></div>
        </aside>

        <main className="flex items-center bg-paper-elevated px-5 py-10 sm:px-8 md:px-12 lg:px-[clamp(3rem,7vw,7rem)]">
          <div className="mx-auto w-full max-w-[31rem] rounded-[12px] border border-line bg-paper p-6 shadow-[0_20px_60px_rgb(15_50_44_/_8%)] sm:p-8">
            <p className="section-kicker">समाचारकक्ष पहुँच</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em]">{formTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-stone">आफ्नो समाचारकक्ष खाता प्रयोग गर्नुहोस्। सफल प्रवेशपछि तपाईंको भूमिकाअनुसार सही कार्यक्षेत्र खुल्छ।</p>
            <div className="mt-7">{children}</div>
            {footer ? <div className="mt-7 border-t border-line pt-5 text-sm text-stone"><div className="flex flex-wrap gap-x-5 gap-y-2">{footer}</div></div> : null}
          </div>
        </main>
      </div>
    </div>
  )
}

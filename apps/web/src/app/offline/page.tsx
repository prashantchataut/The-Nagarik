import Link from 'next/link'

export const metadata = {
  title: 'Offline · The Nagarik',
  robots: { index: false, follow: false },
}

export default function OfflinePage() {
  return (
    <main className="min-h-[70dvh] bg-paper px-4 py-16 text-ink md:px-6 md:py-24">
      <div className="mx-auto max-w-[760px] border-y border-line py-12">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-warning">Offline</p>
        <h1 className="mt-3 text-4xl font-bold leading-[1.25] tracking-[-0.03em]">इन्टरनेट जडान छैन</h1>
        <p className="mt-4 max-w-[56ch] text-base leading-7 text-stone">
          पहिले खुलेका केही समाचार cache बाट उपलब्ध हुन सक्छन्। जडान फर्किएपछि नयाँ पृष्ठ र ताजा अपडेट स्वचालित रूपमा फेरि उपलब्ध हुन्छन्।
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          <Link href="/ne" className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-accent px-4 text-sm font-bold text-accent-fg">
            गृहपृष्ठ खोल्नुहोस्
          </Link>
          <Link href="/ne/latest" className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] border border-line bg-paper-elevated px-4 text-sm font-semibold hover:border-accent hover:text-accent">
            ताजा समाचार
          </Link>
        </div>
      </div>
    </main>
  )
}

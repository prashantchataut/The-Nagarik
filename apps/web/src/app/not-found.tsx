import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-[70dvh] bg-paper px-4 py-16 text-ink md:px-6 md:py-24">
      <div className="mx-auto max-w-[760px] border-y border-line py-12">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">404 · Page not found</p>
        <h1 className="mt-3 text-4xl font-bold leading-[1.25] tracking-[-0.03em] md:text-5xl">पृष्ठ भेटिएन</h1>
        <p className="mt-4 max-w-[56ch] text-base leading-7 text-stone">
          यो लिंक पुरानो भएको, सारिएको वा उपलब्ध नभएको हुन सक्छ। गृहपृष्ठ वा ताजा समाचारबाट पढाइ जारी राख्नुहोस्।
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          <Link href="/ne" className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] accent-solid px-4 text-sm font-bold ">
            गृहपृष्ठ
          </Link>
          <Link href="/ne/latest" className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] border border-line bg-paper-elevated px-4 text-sm font-semibold hover:border-accent hover:text-accent">
            ताजा समाचार
          </Link>
          <Link href="/ne/search" className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-stone hover:text-accent">
            खोज्नुहोस्
          </Link>
        </div>
      </div>
    </main>
  )
}

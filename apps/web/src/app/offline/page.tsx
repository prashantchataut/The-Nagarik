import Link from 'next/link'

export default function OfflinePage() {
  return (
    <main className="mx-auto max-w-[760px] px-4 py-20 text-center md:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-[-0.03em] text-ink">Offline</h1>
      <p className="mx-auto mt-4 max-w-[52ch] text-base leading-relaxed text-stone">
        You are offline right now. Cached stories may still open, and new pages will load once connection is back.
      </p>
      <p className="mt-6 text-sm">
        <Link href="/ne" className="text-accent hover:underline">
          Go to homepage
        </Link>
      </p>
    </main>
  )
}

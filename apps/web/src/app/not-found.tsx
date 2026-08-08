import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[40rem] px-4 py-20 md:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink">पृष्ठ भेटिएन</h1>
      <p className="mt-3 text-sm leading-relaxed text-stone">
        This URL has no published story or page. English articles need englishStatus=published in the CMS.
      </p>
      <p className="mt-8">
        <Link href="/ne" className="font-semibold text-accent hover:underline">
          ← द नागरिक home
        </Link>
      </p>
    </div>
  )
}

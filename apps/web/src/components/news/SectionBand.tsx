import Link from 'next/link'

/** Section band header with teal accent rule (OK/Techpana grammar) */
export function SectionBand({
  title,
  href,
  seeAll,
  children,
  className = '',
}: {
  title: string
  href?: string
  seeAll?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`border-b border-line ${className}`}>
      <div className="mx-auto max-w-[1240px] px-4 py-5 md:px-6 md:py-6">
        <div className="mb-4 flex items-baseline justify-between gap-4 border-b-2 border-accent pb-2">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink md:text-xl">
            {href ? <Link href={href}>{title}</Link> : title}
          </h2>
          {href && seeAll ? (
            <Link href={href} className="text-xs font-medium text-accent hover:underline">
              {seeAll}
            </Link>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  )
}

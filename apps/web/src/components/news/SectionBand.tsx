import Link from 'next/link'

export function SectionBand({ title, href, seeAll, children, className = '' }: { title: string; href?: string; seeAll?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`border-b border-line ${className}`}>
      <div className="mx-auto max-w-[1280px] px-4 py-7 md:px-6 md:py-9">
        <div className="mb-5 flex items-end justify-between gap-4 border-b-[3px] border-accent pb-2.5">
          <h2 className="text-[1.45rem] font-extrabold tracking-[-0.025em] text-ink md:text-[1.75rem]">{href ? <Link href={href} className="hover:text-accent">{title}</Link> : title}</h2>
          {href && seeAll ? <Link href={href} className="inline-flex min-h-11 items-center text-xs font-extrabold text-accent hover:underline">{seeAll}</Link> : null}
        </div>
        {children}
      </div>
    </section>
  )
}

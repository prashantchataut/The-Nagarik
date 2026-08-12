import Link from 'next/link'
import { CaretLeft, CaretRight } from '@phosphor-icons/react/dist/ssr'

/**
 * Server-rendered archive pagination. Plain links (SEO-crawlable), Nepali or
 * English labels, and bounded page windows.
 */
export function Pager({
  basePath,
  page,
  totalPages,
  locale = 'ne',
}: {
  /** Path without query, e.g. /ne/latest */
  basePath: string
  page: number
  totalPages: number
  locale?: 'ne' | 'en'
}) {
  if (totalPages <= 1) return null
  const isNe = locale === 'ne'
  const hrefFor = (target: number) => (target <= 1 ? basePath : `${basePath}?page=${target}`)

  const windowPages: number[] = []
  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
  for (let p = start; p <= Math.min(totalPages, start + 4); p++) windowPages.push(p)

  return (
    <nav
      aria-label={isNe ? 'पृष्ठ नेभिगेसन' : 'Pagination'}
      className="mt-10 flex items-center justify-center gap-1.5"
    >
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          rel="prev"
          className="inline-flex min-h-11 items-center gap-1 rounded-[var(--radius-control)] border border-line bg-paper px-3.5 text-xs font-bold text-ink hover:border-accent hover:text-accent"
        >
          <CaretLeft size={13} weight="bold" aria-hidden="true" />
          {isNe ? 'अघिल्लो' : 'Previous'}
        </Link>
      ) : null}

      {windowPages.map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          aria-current={p === page ? 'page' : undefined}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] text-sm font-bold tabular-nums ${
            p === page
              ? 'accent-solid'
              : 'border border-line bg-paper text-ink hover:border-accent hover:text-accent'
          }`}
        >
          {p}
        </Link>
      ))}

      {page < totalPages ? (
        <Link
          href={hrefFor(page + 1)}
          rel="next"
          className="inline-flex min-h-11 items-center gap-1 rounded-[var(--radius-control)] border border-line bg-paper px-3.5 text-xs font-bold text-ink hover:border-accent hover:text-accent"
        >
          {isNe ? 'अर्को' : 'Next'}
          <CaretRight size={13} weight="bold" aria-hidden="true" />
        </Link>
      ) : null}
    </nav>
  )
}

/** Clamp and parse a ?page= query value. */
export function parsePage(raw: string | undefined, totalItems: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const parsed = Number.parseInt(raw ?? '1', 10)
  const page = Number.isFinite(parsed) ? Math.min(Math.max(1, parsed), totalPages) : 1
  return {
    page,
    totalPages,
    slice: <T,>(items: T[]) => items.slice((page - 1) * pageSize, page * pageSize),
  }
}

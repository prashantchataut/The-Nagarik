import Link from 'next/link'
import type { AppLocale, Dictionary } from '@/lib/i18n'
import type { Category } from '@thenagarik/content'

export function SiteHeader({
  locale,
  dict,
  categories,
  otherLocaleHref,
}: {
  locale: AppLocale
  dict: Dictionary
  categories: Category[]
  otherLocaleHref: string
}) {
  return (
    <header className="border-b border-line bg-paper/90 backdrop-blur-md sticky top-0 z-40">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-4 md:px-6">
        <Link href={`/${locale}`} className="font-[family-name:var(--font-display)] text-xl tracking-tight md:text-2xl">
          {dict.siteName}
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-stone lg:flex" aria-label="Primary">
          {categories.slice(0, 6).map((c) => (
            <Link key={c.id} href={`/${locale}/${c.slug}`} className="hover:text-ink">
              {locale === 'en' ? c.nameEn : c.nameNe}
            </Link>
          ))}
          <Link href={`/${locale}/latest`} className="hover:text-ink">
            {dict.latest}
          </Link>
          <Link href={`/${locale}/search`} className="hover:text-ink">
            {dict.search}
          </Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <Link
            href={otherLocaleHref}
            className="rounded-[var(--radius-control)] border border-line px-3 py-1.5 hover:border-accent"
          >
            {dict.language}
          </Link>
        </div>
      </div>
    </header>
  )
}

export function SiteFooter({ locale, dict }: { locale: AppLocale; dict: Dictionary }) {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-10 text-sm text-stone md:flex-row md:items-center md:justify-between md:px-6">
        <p className="font-[family-name:var(--font-display)] text-ink">{dict.siteName}</p>
        <div className="flex flex-wrap gap-4">
          <Link href={`/${locale}/about`}>{dict.about}</Link>
          <Link href={`/${locale}/trust`}>{dict.trust}</Link>
          <Link href={locale === 'en' ? '/en/rss.xml' : '/rss.xml'}>RSS</Link>
        </div>
        <p className="max-w-sm">
          Publication identity appears here only after legal/DoIB values are verified in env. Until then, no compliance claim.
        </p>
      </div>
    </footer>
  )
}

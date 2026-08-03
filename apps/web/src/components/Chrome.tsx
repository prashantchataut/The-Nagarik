'use client'

import Link from 'next/link'
import { useState } from 'react'
import { List, MagnifyingGlass, X } from '@phosphor-icons/react'
import type { AppLocale, Dictionary } from '@/lib/i18n'
import type { Category } from '@thenagarik/content'
import { ThemeToggle } from '@/components/ThemeToggle'

function todayLabel(locale: AppLocale): string {
  return new Date().toLocaleDateString(locale === 'ne' ? 'ne-NP' : 'en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

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
  const [open, setOpen] = useState(false)
  const sections = categories.map((c) => ({
    href: `/${locale}/${c.slug}`,
    label: locale === 'en' ? c.nameEn : c.nameNe,
  }))

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-md">
      {/* Utility strip — Online Khabar lesson: tools above brand */}
      <div className="hidden border-b border-line/70 bg-paper-elevated/90 text-xs text-stone md:block">
        <div className="mx-auto flex h-9 max-w-[1400px] items-center justify-between gap-4 px-4 md:px-6">
          <p className="truncate">{todayLabel(locale)}</p>
          <div className="flex items-center gap-4">
            <ThemeToggle dict={dict} />
            <Link href={`/${locale}/search`} className="inline-flex items-center gap-1.5 hover:text-ink">
              <MagnifyingGlass size={14} weight="regular" />
              {dict.search}
            </Link>
            <Link href={otherLocaleHref} className="hover:text-ink">
              {dict.language}
            </Link>
            <Link href={locale === 'en' ? '/en/rss.xml' : '/rss.xml'} className="hover:text-ink">
              RSS
            </Link>
          </div>
        </div>
      </div>

      {/* Brand row */}
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 md:h-16 md:px-6">
        <Link
          href={`/${locale}`}
          className="shrink-0 font-[family-name:var(--font-display)] text-[1.45rem] tracking-[-0.03em] text-ink md:text-[1.85rem]"
        >
          {dict.siteName}
        </Link>

        <form action={`/${locale}/search`} method="get" className="hidden max-w-md flex-1 lg:block">
          <label className="sr-only" htmlFor="masthead-search">
            {dict.search}
          </label>
          <div className="relative">
            <MagnifyingGlass
              size={16}
              weight="regular"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone"
            />
            <input
              id="masthead-search"
              name="q"
              type="search"
              placeholder={dict.searchPlaceholder}
              className="w-full rounded-[var(--radius-control)] border border-line bg-paper-elevated py-2 pl-9 pr-3 text-sm text-ink placeholder:text-stone focus:border-accent"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <div className="md:hidden">
            <ThemeToggle dict={dict} />
          </div>
          <Link
            href={`/${locale}/search`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] text-ink lg:hidden"
            aria-label={dict.search}
          >
            <MagnifyingGlass size={22} weight="regular" />
          </Link>
          <Link
            href={otherLocaleHref}
            className="hidden rounded-[var(--radius-control)] border border-line px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent sm:inline-flex lg:hidden"
          >
            {dict.language}
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] border border-line text-ink lg:hidden active:scale-[0.98]"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? dict.close : dict.menu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} weight="regular" /> : <List size={22} weight="regular" />}
          </button>
        </div>
      </div>

      {/* Category nav — second band */}
      <nav
        className="hidden border-t border-line/80 lg:block"
        aria-label={dict.categories}
      >
        <div className="mx-auto flex max-w-[1400px] items-center gap-1 overflow-x-auto px-4 md:px-6">
          <Link
            href={`/${locale}`}
            className="whitespace-nowrap px-3 py-2.5 text-sm font-medium text-ink hover:text-accent"
          >
            {dict.home}
          </Link>
          {sections.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap px-3 py-2.5 text-sm text-stone hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={`/${locale}/latest`}
            className="whitespace-nowrap px-3 py-2.5 text-sm text-stone hover:text-ink"
          >
            {dict.latest}
          </Link>
        </div>
      </nav>

      {open ? (
        <div id="mobile-nav" className="border-t border-line bg-paper px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            <Link
              href={`/${locale}`}
              className="rounded-[var(--radius-control)] px-3 py-3 text-base text-ink hover:bg-paper-elevated"
              onClick={() => setOpen(false)}
            >
              {dict.home}
            </Link>
            {sections.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[var(--radius-control)] px-3 py-3 text-base text-ink hover:bg-paper-elevated"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={`/${locale}/latest`}
              className="rounded-[var(--radius-control)] px-3 py-3 text-base text-ink hover:bg-paper-elevated"
              onClick={() => setOpen(false)}
            >
              {dict.latest}
            </Link>
            <Link
              href={otherLocaleHref}
              className="rounded-[var(--radius-control)] px-3 py-3 text-base text-ink hover:bg-paper-elevated sm:hidden"
              onClick={() => setOpen(false)}
            >
              {dict.language}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  )
}

export function SiteFooter({
  locale,
  dict,
  categories = [],
}: {
  locale: AppLocale
  dict: Dictionary
  categories?: Category[]
}) {
  return (
    <footer className="mt-12 border-t border-line bg-paper-elevated/50">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-12 md:grid-cols-12 md:px-6">
        <div className="md:col-span-4">
          <p className="font-[family-name:var(--font-display)] text-2xl text-ink">{dict.siteName}</p>
          <p className="mt-3 max-w-[36ch] text-sm leading-relaxed text-stone">{dict.tagline}</p>
        </div>
        <div className="md:col-span-4">
          <p className="text-sm font-medium text-ink">{dict.categories}</p>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm text-stone">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/${locale}/${c.slug}`} className="hover:text-accent">
                  {locale === 'en' ? c.nameEn : c.nameNe}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-3 text-sm md:col-span-4">
          <Link href={`/${locale}/latest`} className="hover:text-accent">
            {dict.latest}
          </Link>
          <Link href={`/${locale}/search`} className="hover:text-accent">
            {dict.search}
          </Link>
          <Link href={`/${locale}/about`} className="hover:text-accent">
            {dict.about}
          </Link>
          <Link href={`/${locale}/trust`} className="hover:text-accent">
            {dict.trust}
          </Link>
          <Link href={locale === 'en' ? '/en/rss.xml' : '/rss.xml'} className="hover:text-accent">
            RSS
          </Link>
        </div>
      </div>
    </footer>
  )
}

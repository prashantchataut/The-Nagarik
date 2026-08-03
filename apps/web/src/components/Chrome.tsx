'use client'

import Link from 'next/link'
import { useState } from 'react'
import { List, MagnifyingGlass, X } from '@phosphor-icons/react'
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
  const [open, setOpen] = useState(false)
  const navItems = [
    ...categories.slice(0, 5).map((c) => ({
      href: `/${locale}/${c.slug}`,
      label: locale === 'en' ? c.nameEn : c.nameNe,
    })),
    { href: `/${locale}/latest`, label: dict.latest },
    { href: `/${locale}/search`, label: dict.search },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-4 md:px-6">
        <Link
          href={`/${locale}`}
          className="shrink-0 font-[family-name:var(--font-display)] text-[1.35rem] tracking-[-0.03em] text-ink md:text-[1.6rem]"
        >
          {dict.siteName}
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-end gap-5 text-[0.92rem] text-stone lg:flex" aria-label="Primary">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap transition-colors hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/search`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] text-ink lg:hidden"
            aria-label={dict.search}
          >
            <MagnifyingGlass size={22} weight="regular" />
          </Link>
          <Link
            href={otherLocaleHref}
            className="hidden rounded-[var(--radius-control)] border border-line px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent sm:inline-flex"
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

      {open ? (
        <div id="mobile-nav" className="border-t border-line bg-paper px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {navItems.map((item) => (
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

export function SiteFooter({ locale, dict }: { locale: AppLocale; dict: Dictionary }) {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-12 md:grid-cols-[1.2fr_1fr_1fr] md:px-6">
        <div>
          <p className="font-[family-name:var(--font-display)] text-2xl text-ink">{dict.siteName}</p>
          <p className="mt-3 max-w-[36ch] text-sm leading-relaxed text-stone">{dict.tagline}</p>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <Link href={`/${locale}/latest`} className="hover:text-accent">
            {dict.latest}
          </Link>
          <Link href={`/${locale}/search`} className="hover:text-accent">
            {dict.search}
          </Link>
          <Link href={`/${locale}/about`} className="hover:text-accent">
            {dict.about}
          </Link>
        </div>
        <div className="flex flex-col gap-3 text-sm">
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

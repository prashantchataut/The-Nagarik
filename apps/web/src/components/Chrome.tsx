'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { CalendarBlank, List, MagnifyingGlass, X } from '@phosphor-icons/react'
import type { AppLocale, Dictionary } from '@/lib/i18n'
import type { Category } from '@thenagarik/content'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ChromeDate } from '@/components/ChromeDate'

const BRAND_EN = 'The Nagarik'
const BRAND_NE = 'द नागरिक'

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
  const pathname = usePathname() ?? ''
  const sections = categories.map((c) => ({
    href: `/${locale}/${c.slug}`,
    label: locale === 'en' ? c.nameEn : c.nameNe,
  }))
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper">
      <div className="hidden border-b border-line text-xs text-stone md:block">
        <div className="mx-auto flex h-8 max-w-[1400px] items-center justify-between gap-4 px-4 md:px-6">
          <ChromeDate locale={locale} />
          <div className="flex items-center gap-4">
            <ThemeToggle dict={dict} />
            <Link href={`/${locale}/utilities/nepali-patro`} className="hover:text-ink">
              {dict.nepaliPatro}
            </Link>
            <Link href={`/${locale}/trust`} className="hover:text-ink">
              {dict.trust}
            </Link>
            <Link href={otherLocaleHref} className="font-medium hover:text-ink">
              {locale === 'ne' ? 'EN' : 'NE'}
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-2.5 md:px-6 md:py-3">
        <Link href={`/${locale}`} className="group min-w-0 shrink-0">
          <span className="block font-[family-name:var(--font-sans)] text-[1.25rem] font-semibold tracking-[-0.02em] text-ink md:text-[1.5rem]">
            {BRAND_EN}
          </span>
          {locale === 'ne' ? (
            <span className="mt-0.5 block font-[family-name:var(--font-display)] text-[0.75rem] leading-none text-stone md:text-[0.8rem]">
              {BRAND_NE}
            </span>
          ) : (
            <span className="mt-0.5 block text-[0.7rem] leading-none text-stone">{dict.tagline}</span>
          )}
        </Link>

        <form action={`/${locale}/search`} method="get" className="hidden max-w-sm flex-1 lg:block">
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
              className="w-full border border-line bg-paper py-2 pl-9 pr-3 text-sm text-ink placeholder:text-stone focus:border-accent"
            />
          </div>
        </form>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href={`/${locale}/utilities/nepali-patro`}
            className="inline-flex h-9 items-center gap-1.5 border border-line px-2.5 text-sm text-ink hover:border-accent md:hidden"
            aria-label={dict.nepaliPatro}
          >
            <CalendarBlank size={18} weight="regular" className="text-accent" />
          </Link>
          <div className="md:hidden">
            <ThemeToggle dict={dict} />
          </div>
          <Link
            href={`/${locale}/search`}
            className="inline-flex h-9 w-9 items-center justify-center text-ink lg:hidden"
            aria-label={dict.search}
          >
            <MagnifyingGlass size={22} weight="regular" />
          </Link>
          <Link
            href={otherLocaleHref}
            className="hidden border border-line px-3 py-1.5 text-sm font-medium text-ink hover:border-accent sm:inline-flex md:hidden"
          >
            {locale === 'ne' ? 'EN' : 'NE'}
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center border border-line text-ink hover:border-accent lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? dict.close : dict.menu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} weight="regular" /> : <List size={22} weight="regular" />}
          </button>
        </div>
      </div>

      <nav className="hidden border-t border-line lg:block" aria-label={dict.categories}>
        <div className="mx-auto flex h-10 max-w-[1400px] items-center gap-0.5 overflow-x-auto px-4 md:px-6">
          <Link
            href={`/${locale}`}
            className={`relative whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors ${
              isHome ? 'text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-accent' : 'text-stone hover:text-ink'
            }`}
          >
            {dict.home}
          </Link>
          {sections.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative whitespace-nowrap px-3 py-2 text-sm transition-colors ${
                isActive(item.href)
                  ? 'text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-accent'
                  : 'text-stone hover:text-ink'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={`/${locale}/latest`}
            className={`relative whitespace-nowrap px-3 py-2 text-sm transition-colors ${
              isActive(`/${locale}/latest`)
                ? 'text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-accent'
                : 'text-stone hover:text-ink'
            }`}
          >
            {dict.latest}
          </Link>
          <span className="mx-2 h-4 w-px shrink-0 bg-line" aria-hidden />
          <Link
            href={`/${locale}/utilities`}
            className={`relative whitespace-nowrap px-3 py-2 text-sm transition-colors ${
              isActive(`/${locale}/utilities`)
                ? 'text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-accent'
                : 'text-stone hover:text-ink'
            }`}
          >
            {dict.utilities}
          </Link>
        </div>
      </nav>

      {open ? (
        <div id="mobile-nav" className="border-t border-line bg-paper px-4 py-3 lg:hidden">
          <nav className="flex flex-col" aria-label="Mobile">
            <Link
              href={`/${locale}`}
              className={`border-b border-line py-3 text-base ${isHome ? 'font-medium text-accent' : 'text-stone'}`}
              onClick={() => setOpen(false)}
            >
              {dict.home}
            </Link>
            {sections.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`border-b border-line py-3 text-base ${
                  isActive(item.href) ? 'font-medium text-accent' : 'text-stone'
                }`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={`/${locale}/latest`}
              className={`border-b border-line py-3 text-base ${
                isActive(`/${locale}/latest`) ? 'font-medium text-accent' : 'text-stone'
              }`}
              onClick={() => setOpen(false)}
            >
              {dict.latest}
            </Link>
            <Link
              href={`/${locale}/utilities`}
              className={`border-b border-line py-3 text-base ${
                isActive(`/${locale}/utilities`) ? 'font-medium text-accent' : 'text-stone'
              }`}
              onClick={() => setOpen(false)}
            >
              {dict.utilities}
            </Link>
            <Link
              href={otherLocaleHref}
              className="py-3 text-base font-medium text-ink sm:hidden"
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
    <footer className="mt-10 border-t border-line pb-24 lg:pb-0">
      <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-[family-name:var(--font-sans)] text-lg font-semibold tracking-[-0.02em] text-ink">
              {BRAND_EN}
            </p>
            <p className="mt-0.5 font-[family-name:var(--font-display)] text-sm text-stone">{BRAND_NE}</p>
            <p className="mt-2 max-w-[36ch] text-sm leading-relaxed text-stone">{dict.tagline}</p>
          </div>
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-stone" aria-label={dict.categories}>
            {categories.slice(0, 6).map((c) => (
              <Link key={c.id} href={`/${locale}/${c.slug}`} className="hover:text-accent">
                {locale === 'en' ? c.nameEn : c.nameNe}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5 text-sm text-stone sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href={`/${locale}/about`} className="hover:text-accent">
              {dict.about}
            </Link>
            <Link href={`/${locale}/trust`} className="hover:text-accent">
              {dict.trust}
            </Link>
            <Link href={`/${locale}/utilities`} className="hover:text-accent">
              {dict.utilities}
            </Link>
            <Link href={locale === 'en' ? '/en/rss.xml' : '/rss.xml'} className="hover:text-accent">
              RSS
            </Link>
          </div>
          <p className="text-xs" suppressHydrationWarning>
            © {new Date().getFullYear()} The Nagarik
          </p>
        </div>
      </div>
    </footer>
  )
}

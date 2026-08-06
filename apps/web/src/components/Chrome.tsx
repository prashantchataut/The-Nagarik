'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { CalendarBlank, House, List, MagnifyingGlass, X } from '@phosphor-icons/react'
import type { AppLocale, Dictionary } from '@/lib/i18n'
import type { Category } from '@thenagarik/content'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ChromeDate } from '@/components/ChromeDate'
import { AdSlot } from '@/components/news/AdSlot'
import { BRAND_EN, BRAND_NE, patroHref, swapLocalePath } from '@/lib/site'

export function SiteHeader({
  locale,
  dict,
  categories,
  trendingTags = [],
}: {
  locale: AppLocale
  dict: Dictionary
  categories: Category[]
  trendingTags?: string[]
}) {
  const [open, setOpen] = useState(false)
  const [compact, setCompact] = useState(false)
  const pathname = usePathname() ?? ''
  const otherLocale: AppLocale = locale === 'ne' ? 'en' : 'ne'
  const otherLocaleHref = swapLocalePath(pathname, otherLocale)
  const sections = categories.map((c) => ({
    href: `/${locale}/${c.slug}`,
    label: locale === 'en' ? c.nameEn : c.nameNe,
  }))
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`
  const calendarUrl = patroHref(locale)

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 72)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="z-40 bg-paper">
      {/* Utility + masthead — collapse on scroll */}
      <div
        className={`border-b border-line transition-[max-height,opacity] duration-200 ${
          compact ? 'pointer-events-none max-h-0 overflow-hidden opacity-0 md:max-h-0' : 'max-h-[200px] opacity-100'
        }`}
      >
        <div className="hidden bg-paper-elevated text-xs text-stone md:block">
          <div className="mx-auto flex h-8 max-w-[1240px] items-center justify-between gap-4 px-4 md:px-6">
            <ChromeDate locale={locale} />
            <div className="flex items-center gap-4">
              <ThemeToggle dict={dict} />
              <Link href={`/${locale}/utilities/preeti-unicode`} className="hover:text-ink">
                {dict.preetiTranslator}
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

        {/* Mobile teal brand bar */}
        <div className="flex items-center justify-between gap-2 bg-accent px-3 py-2.5 text-accent-fg md:hidden">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? dict.close : dict.menu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
          </button>
          <Link href={`/${locale}`} className="min-w-0 text-center">
            <span className="block text-xl font-semibold leading-none tracking-[-0.02em]">{BRAND_NE}</span>
            <span className="mt-0.5 block text-[0.65rem] opacity-90">{BRAND_EN}</span>
          </Link>
          <Link
            href={`/${locale}/search`}
            className="inline-flex h-9 w-9 items-center justify-center"
            aria-label={dict.search}
          >
            <MagnifyingGlass size={22} weight="bold" />
          </Link>
        </div>
        <div className="border-b border-accent/30 bg-accent/90 px-3 py-1 md:hidden">
          <ChromeDate locale={locale} className="text-center text-[0.7rem] text-accent-fg" />
        </div>

        {/* Desktop masthead — Devanagari-first */}
        <div className="mx-auto hidden max-w-[1240px] items-center gap-6 px-4 py-4 md:flex md:px-6">
          <Link href={`/${locale}`} className="min-w-0 shrink-0">
            <span className="block text-[2rem] font-semibold leading-none tracking-[-0.03em] text-ink lg:text-[2.35rem]">
              {BRAND_NE}
            </span>
            <span className="mt-1 block text-sm font-medium text-stone">{BRAND_EN}</span>
            <span className="mt-0.5 block text-xs text-stone">{dict.tagline}</span>
          </Link>
          <div className="hidden min-w-0 flex-1 lg:block">
            <AdSlot variant="leaderboard" label="Leaderboard" className="h-[90px]" />
          </div>
          <form action={`/${locale}/search`} method="get" className="hidden w-56 shrink-0 xl:block">
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
                className="w-full rounded-[var(--radius-control)] border border-line bg-paper py-2 pl-9 pr-3 text-sm text-ink placeholder:text-stone focus:border-accent"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Sticky teal category nav */}
      <nav
        className={`sticky top-0 z-40 bg-accent text-accent-fg ${compact ? 'shadow-md' : ''}`}
        aria-label={dict.categories}
      >
        <div className="mx-auto flex h-11 max-w-[1240px] items-center gap-0.5 overflow-x-auto px-2 md:h-12 md:px-4">
          <Link
            href={`/${locale}`}
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-2.5 py-2 text-sm font-medium md:px-3 ${
              isHome ? 'bg-black/15 underline decoration-2 underline-offset-4' : 'hover:bg-black/10'
            }`}
          >
            <House size={16} weight="fill" className="hidden sm:inline" />
            {dict.home}
          </Link>
          {sections.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`hidden whitespace-nowrap px-2.5 py-2 text-sm md:inline-flex md:px-3 ${
                isActive(item.href)
                  ? 'bg-black/15 underline decoration-2 underline-offset-4'
                  : 'hover:bg-black/10'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={`/${locale}/latest`}
            className={`whitespace-nowrap px-2.5 py-2 text-sm md:px-3 ${
              isActive(`/${locale}/latest`)
                ? 'bg-black/15 underline decoration-2 underline-offset-4'
                : 'hover:bg-black/10'
            }`}
          >
            {dict.latest}
          </Link>
          <div className="ml-auto flex shrink-0 items-center gap-1.5 pl-2">
            <Link
              href={calendarUrl}
              className="inline-flex items-center gap-1 rounded-[var(--radius-control)] bg-paper px-2.5 py-1 text-xs font-semibold text-accent hover:opacity-90 md:text-sm"
            >
              <CalendarBlank size={14} weight="bold" />
              {dict.patroShort}
            </Link>
            <Link
              href={`/${locale}/search`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] hover:bg-black/10 xl:hidden"
              aria-label={dict.search}
            >
              <MagnifyingGlass size={18} weight="bold" />
            </Link>
          </div>
        </div>
      </nav>

      {trendingTags.length ? (
        <div className="border-b border-line bg-paper-elevated">
          <div className="mx-auto flex max-w-[1240px] gap-2 overflow-x-auto px-4 py-2 md:px-6">
            {trendingTags.map((tag) => (
              <Link
                key={tag}
                href={`/${locale}/search?q=${encodeURIComponent(tag)}`}
                className="shrink-0 rounded-full bg-paper px-3 py-1 text-xs text-stone ring-1 ring-line hover:text-accent"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {open ? (
        <div id="mobile-nav" className="border-b border-line bg-paper px-4 py-3 lg:hidden">
          <nav className="flex flex-col" aria-label="Mobile">
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
              href={`/${locale}/utilities`}
              className="border-b border-line py-3 text-base text-stone"
              onClick={() => setOpen(false)}
            >
              {dict.utilities}
            </Link>
            <Link
              href={calendarUrl}
              className="border-b border-line py-3 text-base font-medium text-accent"
              onClick={() => setOpen(false)}
            >
              {dict.nepaliPatro}
            </Link>
            <Link
              href={otherLocaleHref}
              className="py-3 text-base font-medium text-ink"
              onClick={() => setOpen(false)}
            >
              {dict.language}
            </Link>
            <div className="py-3">
              <ThemeToggle dict={dict} />
            </div>
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
  const calendarUrl = patroHref(locale)
  return (
    <footer className="mt-10 border-t border-line bg-paper-elevated pb-24 lg:pb-0">
      <div className="mx-auto max-w-[1240px] px-4 py-10 md:px-6">
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="text-2xl font-semibold tracking-[-0.02em] text-ink">{BRAND_NE}</p>
            <p className="mt-0.5 text-sm font-medium text-stone">{BRAND_EN}</p>
            <p className="mt-2 max-w-[36ch] text-sm leading-relaxed text-stone">{dict.tagline}</p>
          </div>
          <nav className="md:col-span-4" aria-label={dict.categories}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone">{dict.categories}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink">
              {categories.map((c) => (
                <Link key={c.id} href={`/${locale}/${c.slug}`} className="hover:text-accent">
                  {locale === 'en' ? c.nameEn : c.nameNe}
                </Link>
              ))}
            </div>
          </nav>
          <nav className="md:col-span-4" aria-label={dict.utilities}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone">{dict.utilities}</p>
            <div className="flex flex-col gap-2 text-sm">
              <Link href={calendarUrl} className="hover:text-accent">
                {dict.nepaliPatro}
              </Link>
              <Link href={`/${locale}/utilities/preeti-unicode`} className="hover:text-accent">
                {dict.preetiTranslator}
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
          </nav>
        </div>
        <div className="mt-8 border-t border-line pt-5 text-xs text-stone">
          <p suppressHydrationWarning>© {new Date().getFullYear()} {BRAND_EN} · {BRAND_NE}</p>
        </div>
      </div>
    </footer>
  )
}

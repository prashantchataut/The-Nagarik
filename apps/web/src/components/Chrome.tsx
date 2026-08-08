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
    const onScroll = () => setCompact(window.scrollY > 88)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const navLinkClass = (active: boolean) =>
    `inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-control)] px-2.5 py-1.5 text-sm font-medium transition-colors md:px-3 ${
      active
        ? 'bg-paper text-accent shadow-sm'
        : 'text-accent-fg/95 hover:bg-black/15 hover:text-accent-fg'
    }`

  return (
    <header className="z-40 bg-paper">
      {/* Desktop utility — collapses on scroll */}
      <div
        className={`hidden border-b border-line bg-paper-elevated text-sm text-stone md:block ${
          compact ? 'pointer-events-none max-h-0 overflow-hidden opacity-0' : 'max-h-10 opacity-100'
        } transition-[max-height,opacity] duration-200`}
      >
        <div className="mx-auto flex h-9 max-w-[1240px] items-center justify-between gap-4 px-4 md:px-6">
          <ChromeDate locale={locale} className="font-medium text-ink" />
          <div className="flex items-center gap-4">
            <ThemeToggle dict={dict} />
            <Link href={`/${locale}/utilities/preeti-unicode`} className="hover:text-accent">
              {dict.preetiTranslator}
            </Link>
            <Link href={`/${locale}/trust`} className="hover:text-accent">
              {dict.trust}
            </Link>
            <Link href="/admin/login" className="hover:text-accent">
              {dict.staffLogin}
            </Link>
            <Link
              href={otherLocaleHref}
              className="rounded-[var(--radius-control)] border border-line bg-paper px-2 py-0.5 font-semibold text-ink hover:border-accent hover:text-accent"
            >
              {locale === 'ne' ? 'EN' : 'NE'}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile brand bar — always visible (does not collapse) */}
      <div className="border-b border-accent md:hidden">
        <div className="flex items-center justify-between gap-2 bg-accent px-2 py-2.5 text-accent-fg">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] hover:bg-black/15"
            aria-expanded={open}
            aria-controls="mobile-nav-drawer"
            aria-label={open ? dict.close : dict.menu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
          </button>
          <Link href={`/${locale}`} className="min-w-0 flex-1 text-center">
            <span className="block text-[1.35rem] font-bold leading-none tracking-[-0.02em]">
              {BRAND_NE}
            </span>
            <span className="mt-0.5 block text-[0.7rem] font-medium opacity-95">{BRAND_EN}</span>
          </Link>
          <Link
            href={`/${locale}/search`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] hover:bg-black/15"
            aria-label={dict.search}
          >
            <MagnifyingGlass size={22} weight="bold" />
          </Link>
        </div>
        <div className="bg-accent/95 px-3 py-1.5">
          <ChromeDate locale={locale} className="text-center text-xs font-medium text-accent-fg" />
        </div>
      </div>

      {/* Desktop masthead — collapses on scroll */}
      <div
        className={`hidden border-b border-line md:block ${
          compact ? 'pointer-events-none max-h-0 overflow-hidden opacity-0' : 'max-h-[140px] opacity-100'
        } transition-[max-height,opacity] duration-200`}
      >
        <div className="mx-auto flex max-w-[1240px] items-center gap-6 px-4 py-4 md:px-6">
          <Link href={`/${locale}`} className="min-w-0 shrink-0">
            <span className="block text-[2rem] font-bold leading-none tracking-[-0.03em] text-ink lg:text-[2.35rem]">
              {BRAND_NE}
            </span>
            <span className="mt-1 block text-sm font-semibold text-ink/80">{BRAND_EN}</span>
            <span className="mt-0.5 block text-xs font-medium text-stone">{dict.tagline}</span>
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
                weight="bold"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone"
              />
              <input
                id="masthead-search"
                name="q"
                type="search"
                placeholder={dict.searchPlaceholder}
                className="w-full rounded-[var(--radius-control)] border border-line bg-paper py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-stone focus:border-accent"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Sticky category nav — always present */}
      <nav
        className={`sticky top-0 z-40 border-b border-black/10 bg-accent text-accent-fg ${
          compact ? 'shadow-md' : ''
        }`}
        aria-label={dict.categories}
      >
        <div className="mx-auto flex h-12 max-w-[1240px] items-center gap-1 overflow-x-auto px-2 md:px-4">
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] hover:bg-black/15 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav-drawer"
            aria-label={open ? dict.close : dict.menu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
          </button>
          <Link href={`/${locale}`} className={navLinkClass(isHome)}>
            <House size={16} weight="fill" className="hidden sm:inline" />
            {dict.home}
          </Link>
          {sections.map((item) => (
            <Link key={item.href} href={item.href} className={navLinkClass(isActive(item.href))}>
              {item.label}
            </Link>
          ))}
          <Link
            href={`/${locale}/latest`}
            className={navLinkClass(isActive(`/${locale}/latest`))}
          >
            {dict.latest}
          </Link>
          <div className="ml-auto flex shrink-0 items-center gap-1.5 pl-2">
            <Link
              href={calendarUrl}
              className="inline-flex items-center gap-1 rounded-[var(--radius-control)] bg-paper px-2.5 py-1.5 text-xs font-bold text-accent ring-1 ring-black/5 hover:bg-accent-muted md:text-sm"
            >
              <CalendarBlank size={15} weight="bold" />
              {dict.patroShort}
            </Link>
            <Link
              href={`/${locale}/search`}
              className="hidden h-9 w-9 items-center justify-center rounded-[var(--radius-control)] hover:bg-black/15 md:inline-flex xl:hidden"
              aria-label={dict.search}
            >
              <MagnifyingGlass size={18} weight="bold" />
            </Link>
          </div>
        </div>
      </nav>

      {trendingTags.length ? (
        <div className="border-b border-line bg-paper-elevated">
          <div className="mx-auto flex max-w-[1240px] gap-2 overflow-x-auto px-4 py-2.5 md:px-6">
            {trendingTags.map((tag) => (
              <Link
                key={tag}
                href={`/${locale}/search?q=${encodeURIComponent(tag)}`}
                className="shrink-0 rounded-[var(--radius-control)] border border-line bg-paper px-3 py-1 text-xs font-medium text-ink hover:border-accent hover:text-accent"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* Mobile drawer overlay */}
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden" id="mobile-nav-drawer">
          <button
            type="button"
            className="absolute inset-0 bg-ink/45"
            aria-label={dict.close}
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col border-r border-line bg-paper shadow-xl">
            <div className="flex items-center justify-between border-b border-line bg-accent px-4 py-3 text-accent-fg">
              <span className="text-lg font-bold">{BRAND_NE}</span>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] hover:bg-black/15"
                aria-label={dict.close}
                onClick={() => setOpen(false)}
              >
                <X size={22} weight="bold" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-2 py-2" aria-label="Mobile">
              <Link
                href={`/${locale}`}
                className={`block rounded-[var(--radius-control)] px-3 py-3 text-base font-medium ${
                  isHome ? 'bg-accent-muted text-accent' : 'text-ink hover:bg-paper-elevated'
                }`}
                onClick={() => setOpen(false)}
              >
                {dict.home}
              </Link>
              {sections.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-[var(--radius-control)] px-3 py-3 text-base font-medium ${
                    isActive(item.href)
                      ? 'bg-accent-muted text-accent'
                      : 'text-ink hover:bg-paper-elevated'
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href={`/${locale}/latest`}
                className={`block rounded-[var(--radius-control)] px-3 py-3 text-base font-medium ${
                  isActive(`/${locale}/latest`)
                    ? 'bg-accent-muted text-accent'
                    : 'text-ink hover:bg-paper-elevated'
                }`}
                onClick={() => setOpen(false)}
              >
                {dict.latest}
              </Link>
              <div className="my-2 border-t border-line" />
              <Link
                href={`/${locale}/utilities`}
                className="block rounded-[var(--radius-control)] px-3 py-3 text-base font-medium text-ink hover:bg-paper-elevated"
                onClick={() => setOpen(false)}
              >
                {dict.utilities}
              </Link>
              <Link
                href={calendarUrl}
                className="block rounded-[var(--radius-control)] px-3 py-3 text-base font-bold text-accent hover:bg-accent-muted"
                onClick={() => setOpen(false)}
              >
                {dict.nepaliPatro}
              </Link>
              <Link
                href={otherLocaleHref}
                className="block rounded-[var(--radius-control)] px-3 py-3 text-base font-semibold text-ink hover:bg-paper-elevated"
                onClick={() => setOpen(false)}
              >
                {dict.language}
              </Link>
              <Link
                href={`/${locale}/account`}
                className="block rounded-[var(--radius-control)] px-3 py-3 text-base font-medium text-ink hover:bg-paper-elevated"
                onClick={() => setOpen(false)}
              >
                {dict.account}
              </Link>
              <Link
                href="/admin/login"
                className="block rounded-[var(--radius-control)] px-3 py-3 text-base font-semibold text-accent hover:bg-accent-muted"
                onClick={() => setOpen(false)}
              >
                {dict.staffLogin}
              </Link>
              <div className="px-3 py-3">
                <ThemeToggle dict={dict} />
              </div>
            </nav>
          </div>
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
    <footer className="mt-10 border-t-2 border-line bg-paper-elevated pb-24 lg:pb-0">
      <div className="mx-auto max-w-[1240px] px-4 py-10 md:px-6">
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="text-2xl font-bold tracking-[-0.02em] text-ink">{BRAND_NE}</p>
            <p className="mt-0.5 text-sm font-semibold text-ink/80">{BRAND_EN}</p>
            <p className="mt-2 max-w-[36ch] text-sm leading-relaxed text-stone">{dict.tagline}</p>
          </div>
          <nav className="md:col-span-4" aria-label={dict.categories}>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink">{dict.categories}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-ink">
              {categories.map((c) => (
                <Link key={c.id} href={`/${locale}/${c.slug}`} className="hover:text-accent">
                  {locale === 'en' ? c.nameEn : c.nameNe}
                </Link>
              ))}
            </div>
          </nav>
          <nav className="md:col-span-4" aria-label={dict.utilities}>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink">{dict.utilities}</p>
            <div className="flex flex-col gap-2 text-sm font-medium">
              <Link href={calendarUrl} className="text-ink hover:text-accent">
                {dict.nepaliPatro}
              </Link>
              <Link href={`/${locale}/utilities/preeti-unicode`} className="text-ink hover:text-accent">
                {dict.preetiTranslator}
              </Link>
              <Link href={`/${locale}/about`} className="text-ink hover:text-accent">
                {dict.about}
              </Link>
              <Link href={`/${locale}/trust`} className="text-ink hover:text-accent">
                {dict.trust}
              </Link>
              <Link href={`/${locale}/account`} className="text-ink hover:text-accent">
                {dict.account}
              </Link>
              <Link href="/admin/login" className="text-ink hover:text-accent">
                {dict.staffLogin}
              </Link>
              <Link href={locale === 'en' ? '/en/rss.xml' : '/rss.xml'} className="text-ink hover:text-accent">
                RSS
              </Link>
            </div>
          </nav>
        </div>
        <div className="mt-8 border-t border-line pt-5 text-xs font-medium text-stone">
          <p suppressHydrationWarning>
            © {new Date().getFullYear()} {BRAND_EN} · {BRAND_NE}
          </p>
        </div>
      </div>
    </footer>
  )
}

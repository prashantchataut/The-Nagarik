import Image from 'next/image'
import Link from 'next/link'
import type { Category, StoryCard } from '@thenagarik/content'
import type { AppLocale, Dictionary } from '@/lib/i18n'
import { RelativeTime } from '@/components/RelativeTime'
import { StoryByline } from '@/components/news/StoryByline'
import { SectionBand } from '@/components/news/SectionBand'
import { HomeSignalRail } from '@/components/home/HomeSignalRail'
import { HomeProvinceTabs } from '@/components/home/HomeProvinceTabs'

const hrefFor = (locale: AppLocale, story: StoryCard) => `/${locale}/${story.categorySlug}/${story.slug}`

export function HomeBreakingStrip({ locale, dict, stories }: { locale: AppLocale; dict: Dictionary; stories: StoryCard[] }) {
  if (!stories.length) return null
  const [lead, ...rest] = stories.slice(0, 4)
  return (
    <section className="border-b border-line bg-paper-strong" aria-label={dict.latestUpdates}>
      <div className="mx-auto flex min-h-11 max-w-[1280px] items-center gap-3 px-4 md:px-6">
        <span className={`shrink-0 rounded-[5px] px-2 py-1 text-xs font-extrabold ${lead.isBreaking ? 'bg-danger text-[var(--danger-fg)]' : 'accent-solid '}`}>
          {lead.isBreaking ? dict.breaking : dict.latestUpdates}
        </span>
        <Link href={hrefFor(locale, lead)} className="min-w-0 flex-1 truncate text-[0.95rem] font-bold text-ink hover:text-accent">{lead.title}</Link>
        {rest.length ? (
          <div className="hidden items-center gap-4 border-l border-line pl-4 text-xs font-medium text-stone xl:flex">
            {rest.slice(0, 2).map((story) => <Link key={story.id} href={hrefFor(locale, story)} className="max-w-[16rem] truncate hover:text-ink">{story.title}</Link>)}
          </div>
        ) : null}
      </div>
    </section>
  )
}

export function HomeHero({ locale, dict, lead, latest, popular, popularLive, categoryLabel }: {
  locale: AppLocale; dict: Dictionary; lead: StoryCard; latest: StoryCard[]; popular: StoryCard[]; popularLive: boolean; categoryLabel: (slug: string) => string
}) {
  const href = hrefFor(locale, lead)
  return (
    <section className="border-b border-line bg-paper">
      <div className="mx-auto grid max-w-[1280px] lg:grid-cols-[minmax(0,1.78fr)_minmax(330px,0.82fr)]">
        <article className="min-w-0 px-4 py-6 md:px-6 md:py-8 lg:pr-8">
          {lead.hero ? (
            <Link href={href} className="editorial-image relative block aspect-[16/8.8] rounded-[8px] shadow-[0_10px_30px_rgb(20_44_39_/_8%)]">
              <Image src={lead.hero.url} alt={lead.hero.alt} fill priority sizes="(max-width:1024px) 100vw, 68vw" className="object-cover" />
            </Link>
          ) : null}
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-extrabold">
            <Link href={`/${locale}/${lead.categorySlug}`} className="text-accent hover:underline">{categoryLabel(lead.categorySlug)}</Link>
            {lead.isBreaking ? <span className="text-danger">{dict.breaking}</span> : null}
          </div>
          <h1 className="mt-2 max-w-[26ch] text-[2.15rem] font-extrabold leading-[1.28] tracking-[-0.035em] text-ink sm:text-[2.55rem] md:text-[3.05rem] lg:text-[3.35rem]">
            <Link href={href} className="hover:text-accent">{lead.title}</Link>
          </h1>
          {lead.deck ? <p className="mt-3 max-w-[68ch] text-base font-medium leading-7 text-stone md:text-[1.08rem]">{lead.deck}</p> : null}
          <div className="mt-4"><StoryByline locale={locale} authors={lead.authorNames} publishedAt={lead.publishedAt} /></div>
        </article>

        <HomeSignalRail locale={locale} latest={latest} popular={popular} popularLive={popularLive} latestLabel={dict.latest} popularLabel={dict.mostRead} coldLabel={dict.coldStart} seeAllLabel={dict.seeAll} />
      </div>
    </section>
  )
}

export function HomeSecondaryStories({ locale, stories, categoryLabel }: { locale: AppLocale; stories: StoryCard[]; categoryLabel: (slug: string) => string }) {
  if (!stories.length) return null
  return (
    <section className="border-b border-line bg-paper-elevated">
      <div className="mx-auto grid max-w-[1280px] gap-4 px-4 py-5 md:grid-cols-3 md:px-6 md:py-6">
        {stories.slice(0, 3).map((story) => (
          <article key={story.id} className="group grid grid-cols-[8rem_minmax(0,1fr)] gap-4 md:block">
            {story.hero ? (
              <Link href={hrefFor(locale, story)} className="editorial-image relative block aspect-[4/3] rounded-[7px] md:aspect-[16/10]">
                <Image src={story.hero.url} alt={story.hero.alt} fill sizes="(max-width:767px) 128px, 33vw" className="object-cover" />
              </Link>
            ) : null}
            <div className="min-w-0 md:mt-3">
              <p className="section-kicker">{categoryLabel(story.categorySlug)}</p>
              <h2 className="mt-1 text-[1.05rem] font-extrabold leading-[1.42] tracking-[-0.018em] md:text-[1.22rem]">
                <Link href={hrefFor(locale, story)} className="hover:text-accent">{story.title}</Link>
              </h2>
              <p className="mt-2 text-xs text-stone"><RelativeTime iso={story.publishedAt} locale={locale} /></p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export function HomeCategoryBand({ locale, dict, category, stories, variant = 'feature-list' }: {
  locale: AppLocale; dict: Dictionary; category: Category; stories: StoryCard[]; variant?: 'feature-list' | 'dense'
}) {
  if (!stories.length) return null
  const title = locale === 'en' ? category.nameEn : category.nameNe
  const [feature, second, third, fourth, fifth] = stories

  if (variant === 'dense') {
    return (
      <SectionBand title={title} href={`/${locale}/${category.slug}`} seeAll={dict.seeAll} className="bg-paper-elevated">
        <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
          {feature ? <article className="lg:col-span-5">
            {feature.hero ? <Link href={hrefFor(locale, feature)} className="editorial-image relative block aspect-[16/10] rounded-[7px]"><Image src={feature.hero.url} alt={feature.hero.alt} fill sizes="(max-width:1024px) 100vw, 42vw" className="object-cover" /></Link> : null}
            <h3 className="mt-3 text-xl font-extrabold leading-[1.42] tracking-[-0.02em] md:text-2xl"><Link href={hrefFor(locale, feature)} className="hover:text-accent">{feature.title}</Link></h3>
            {feature.deck ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone">{feature.deck}</p> : null}
          </article> : null}
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            {[second, third, fourth, fifth].filter(Boolean).map((story) => story && (
              <article key={story.id} className="surface-card overflow-hidden">
                {story.hero ? <Link href={hrefFor(locale, story)} className="editorial-image relative block aspect-[16/9]"><Image src={story.hero.url} alt={story.hero.alt} fill sizes="(max-width:640px) 100vw, 28vw" className="object-cover" /></Link> : null}
                <div className="p-3.5">
                  <h3 className="text-[1.04rem] font-bold leading-[1.45]"><Link href={hrefFor(locale, story)} className="hover:text-accent">{story.title}</Link></h3>
                  <p className="mt-2 text-xs text-stone"><RelativeTime iso={story.publishedAt} locale={locale} /></p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </SectionBand>
    )
  }

  return (
    <SectionBand title={title} href={`/${locale}/${category.slug}`} seeAll={dict.seeAll}>
      <div className="grid gap-5 lg:grid-cols-12 lg:gap-7">
        {feature ? <article className="lg:col-span-7">
          {feature.hero ? <Link href={hrefFor(locale, feature)} className="editorial-image relative block aspect-[16/9] rounded-[7px]"><Image src={feature.hero.url} alt={feature.hero.alt} fill sizes="(max-width:1024px) 100vw, 58vw" className="object-cover" /></Link> : null}
          <h3 className="mt-3 text-[1.55rem] font-extrabold leading-[1.4] tracking-[-0.025em] md:text-[1.9rem]"><Link href={hrefFor(locale, feature)} className="hover:text-accent">{feature.title}</Link></h3>
          {feature.deck ? <p className="mt-2 max-w-[62ch] text-sm leading-6 text-stone">{feature.deck}</p> : null}
        </article> : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
          {[second, third, fourth, fifth].filter(Boolean).map((story) => story && (
            <article key={story.id} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 border-b border-line pb-4 last:border-b-0 lg:grid-cols-[8.5rem_minmax(0,1fr)]">
              {story.hero ? <Link href={hrefFor(locale, story)} className="editorial-image relative aspect-[4/3] rounded-[6px]"><Image src={story.hero.url} alt="" fill sizes="136px" className="object-cover" /></Link> : null}
              <div className="self-center"><h3 className="text-[1.02rem] font-bold leading-[1.42]"><Link href={hrefFor(locale, story)} className="hover:text-accent">{story.title}</Link></h3><p className="mt-1.5 text-xs text-stone"><RelativeTime iso={story.publishedAt} locale={locale} /></p></div>
            </article>
          ))}
        </div>
      </div>
    </SectionBand>
  )
}

export function HomeOpinion({ locale, dict, stories }: { locale: AppLocale; dict: Dictionary; stories: StoryCard[] }) {
  if (!stories.length) return null
  return (
    <SectionBand title={dict.opinion} href={`/${locale}/bichar`} seeAll={dict.seeAll} className="bg-paper-elevated">
      <div className="grid gap-4 md:grid-cols-3">
        {stories.slice(0, 3).map((story) => (
          <article key={story.id} className="surface-card overflow-hidden">
            {story.hero ? <Link href={hrefFor(locale, story)} className="editorial-image relative block aspect-[16/9]"><Image src={story.hero.url} alt={story.hero.alt} fill sizes="(max-width:767px) 100vw, 33vw" className="object-cover" /></Link> : null}
            <div className="p-4"><p className="text-xs font-bold text-accent">{story.authorNames.join(', ') || dict.authors}</p><h3 className="mt-2 text-lg font-extrabold leading-[1.48]"><Link href={hrefFor(locale, story)} className="hover:text-accent">{story.title}</Link></h3>{story.deck ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone">{story.deck}</p> : null}</div>
          </article>
        ))}
      </div>
    </SectionBand>
  )
}

export function HomeVisual({ locale, dict, stories }: { locale: AppLocale; dict: Dictionary; stories: StoryCard[] }) {
  const visual = stories.filter((story) => story.hero).slice(0, 4)
  if (visual.length < 2) return null
  const [feature, ...rest] = visual
  return (
    <section className="border-y border-nav bg-nav text-nav-fg">
      <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-6 md:py-10">
        <div className="mb-5 flex items-end justify-between border-b border-nav-fg/20 pb-3"><h2 className="text-2xl font-extrabold tracking-[-0.025em]">{dict.visual}</h2></div>
        <div className="grid gap-4 lg:grid-cols-12">
          <article className="lg:col-span-8">
            <Link href={hrefFor(locale, feature)} className="editorial-image relative block aspect-[16/8.8] rounded-[8px]"><Image src={feature.hero!.url} alt={feature.hero!.alt} fill sizes="(max-width:1024px) 100vw, 66vw" className="object-cover" /></Link>
            <h3 className="mt-3 text-xl font-extrabold leading-[1.45] md:text-2xl"><Link href={hrefFor(locale, feature)} className="hover:text-nav-accent">{feature.title}</Link></h3>
          </article>
          <div className="grid gap-4 sm:grid-cols-3 lg:col-span-4 lg:grid-cols-1">
            {rest.map((story) => <article key={story.id} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3"><Link href={hrefFor(locale, story)} className="editorial-image relative aspect-[4/3] rounded-[6px]"><Image src={story.hero!.url} alt="" fill sizes="112px" className="object-cover" /></Link><h3 className="self-center text-sm font-bold leading-6"><Link href={hrefFor(locale, story)} className="hover:text-nav-accent">{story.title}</Link></h3></article>)}
          </div>
        </div>
      </div>
    </section>
  )
}

export { HomeProvinceTabs }

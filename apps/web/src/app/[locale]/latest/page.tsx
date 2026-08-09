import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RelativeTime } from '@/components/RelativeTime'
import { getContent } from '@/lib/content'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

export const revalidate = 60

export default async function LatestPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)
  const content = getContent()
  const articles = await content.listPublishedArticles({ locale })
  const cards = await Promise.all(articles.map((article) => content.toStoryCard(article, locale)))
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  const current = cards.filter((story) => story.publishedAt && now - new Date(story.publishedAt).getTime() < dayMs)
  const archive = cards.filter((story) => !current.includes(story))
  const featured = current.slice(0, 4)
  const timeline = current.slice(4)
  const copy = locale === 'ne'
    ? {
        kicker: 'निरन्तर अपडेट',
        intro: 'आजका प्रमुख समाचार, तस्बिर र समयक्रमलाई एउटै सतहमा छिटो स्क्यान गर्नुहोस्।',
        earlier: 'अघिल्ला समाचार',
        live: 'आजका प्रमुख अपडेट',
      }
    : {
        kicker: 'Continuous updates',
        intro: 'Scan today’s leading stories, images, and chronology from one newsroom surface.',
        earlier: 'Earlier stories',
        live: 'Today’s leading updates',
      }

  const storyHref = (story: (typeof cards)[number]) => `/${locale}/${story.categorySlug}/${story.slug}`

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-7 md:px-6 md:py-11">
      <header className="grid gap-5 border-b-2 border-ink pb-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="max-w-[760px]">
          <p className="section-kicker">{copy.kicker}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-[-0.03em] text-ink md:text-5xl">{dict.latest}</h1>
          <p className="mt-3 max-w-[62ch] text-base leading-relaxed text-stone">{copy.intro}</p>
        </div>
        <div className="text-sm font-bold text-accent">{cards.length} {dict.searchResults.toLowerCase()}</div>
      </header>

      {featured.length ? (
        <section className="mt-7" aria-labelledby="latest-featured">
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 id="latest-featured" className="text-2xl font-bold tracking-[-0.02em] text-ink">{copy.live}</h2>
            <span className="text-sm font-semibold text-stone">{dict.hours24}</span>
          </div>
          <div className="grid gap-5 lg:grid-cols-12">
            {featured[0] ? (
              <Link href={storyHref(featured[0])} className="group lg:col-span-7">
                {featured[0].hero ? (
                  <div className="editorial-image relative aspect-[16/9] overflow-hidden bg-paper-elevated">
                    <Image src={featured[0].hero.url} alt={featured[0].hero.alt} fill priority sizes="(min-width:1024px) 720px, 100vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.018]" />
                  </div>
                ) : null}
                <div className="mt-4 max-w-[760px]">
                  <div className="text-xs font-bold text-accent">
                    <RelativeTime iso={featured[0].publishedAt} locale={locale} />
                  </div>
                  <h3 className="mt-2 text-3xl font-bold leading-[1.28] tracking-[-0.025em] text-ink md:text-[2.15rem]">{featured[0].title}</h3>
                  {featured[0].deck ? <p className="mt-2 line-clamp-2 text-base leading-relaxed text-stone">{featured[0].deck}</p> : null}
                </div>
              </Link>
            ) : null}

            <div className="grid gap-5 sm:grid-cols-3 lg:col-span-5 lg:grid-cols-1">
              {featured.slice(1).map((story) => (
                <Link key={story.id} href={storyHref(story)} className="group grid grid-cols-[1fr_7.5rem] gap-4 border-b border-line pb-5 last:border-b-0 lg:grid-cols-[1fr_9rem]">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-accent"><RelativeTime iso={story.publishedAt} locale={locale} /></div>
                    <h3 className="mt-1.5 text-xl font-bold leading-[1.38] tracking-[-0.018em] text-ink group-hover:text-accent">{story.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone">{story.deck}</p>
                  </div>
                  {story.hero ? (
                    <div className="editorial-image relative aspect-[4/3] overflow-hidden bg-paper-elevated">
                      <Image src={story.hero.url} alt={story.hero.alt} fill sizes="144px" className="object-cover" />
                    </div>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {timeline.length ? (
        <section className="mt-10 border-t-2 border-ink pt-5">
          <div className="grid gap-x-6 gap-y-0 md:grid-cols-2">
            {timeline.map((story) => (
              <Link key={story.id} href={storyHref(story)} className="group grid grid-cols-[1fr_7rem] gap-4 border-b border-line py-5 sm:grid-cols-[1fr_8rem]">
                <div>
                  <div className="text-xs font-bold text-accent"><RelativeTime iso={story.publishedAt} locale={locale} /></div>
                  <h3 className="mt-1.5 text-xl font-bold leading-[1.42] tracking-[-0.018em] text-ink group-hover:text-accent">{story.title}</h3>
                </div>
                {story.hero ? <div className="editorial-image relative aspect-[4/3] overflow-hidden bg-paper-elevated"><Image src={story.hero.url} alt={story.hero.alt} fill sizes="128px" className="object-cover" /></div> : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {archive.length ? (
        <section className="mt-11 bg-paper-elevated px-4 py-6 sm:px-6 md:px-8">
          <div className="mb-5 flex items-end justify-between gap-4 border-b border-line pb-3">
            <h2 className="text-2xl font-bold tracking-[-0.02em] text-ink">{copy.earlier}</h2>
            <span className="text-sm font-semibold text-stone">{archive.length}</span>
          </div>
          <div className="grid gap-x-6 md:grid-cols-2 xl:grid-cols-3">
            {archive.slice(0, 18).map((story) => (
              <Link key={story.id} href={storyHref(story)} className="group grid grid-cols-[1fr_6.5rem] gap-3 border-b border-line py-4">
                <div>
                  <p className="text-xs font-semibold text-stone">{story.publishedAt ? new Intl.DateTimeFormat(locale === 'ne' ? 'ne-NP' : 'en-NP', { month: 'short', day: 'numeric' }).format(new Date(story.publishedAt)) : ''}</p>
                  <h3 className="mt-1 text-lg font-bold leading-[1.42] text-ink group-hover:text-accent">{story.title}</h3>
                </div>
                {story.hero ? <div className="editorial-image relative aspect-[4/3] overflow-hidden bg-paper"><Image src={story.hero.url} alt={story.hero.alt} fill sizes="104px" className="object-cover" /></div> : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {!cards.length ? (
        <div className="mt-10 border-y border-line py-8">
          <p className="text-lg font-bold text-ink">{dict.empty}</p>
          <Link href={`/${locale}`} className="mt-4 inline-flex min-h-11 items-center font-bold text-accent hover:underline">← {dict.home}</Link>
        </div>
      ) : null}
    </main>
  )
}

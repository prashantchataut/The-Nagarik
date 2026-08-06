import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  articleHasEnglish,
  localizeBody,
  localizeDeck,
  localizeTitle,
} from '@thenagarik/content'
import {
  ArticleEngagement,
  ArticleToolbar,
  ReadingProgress,
} from '@/components/ReaderClient'
import { StoryRail } from '@/components/Story'
import { RelativeTime } from '@/components/RelativeTime'
import { CategoryTag } from '@/components/news/CategoryTag'
import { AdSlot } from '@/components/news/AdSlot'
import { getContent, siteUrl } from '@/lib/content'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

export const revalidate = 60

function slugifyHeading(text: string, index: number): string {
  const base = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 48)
  return base || `section-${index}`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string; slug: string }>
}): Promise<Metadata> {
  const { locale: raw, category, slug } = await params
  if (!isLocale(raw)) return {}
  const locale = raw as AppLocale
  const content = getContent()
  const article = await content.getArticleBySlug(category, slug)
  if (!article) return {}
  if (locale === 'en' && !articleHasEnglish(article)) return { robots: { index: false } }

  const title = localizeTitle(article, locale)
  const description = localizeDeck(article, locale)
  const languages: Record<string, string> = {
    ne: siteUrl(`/ne/${category}/${slug}`),
  }
  if (articleHasEnglish(article)) {
    languages.en = siteUrl(`/en/${category}/${slug}`)
  }

  return {
    title,
    description,
    alternates: {
      canonical: siteUrl(`/${locale}/${category}/${slug}`),
      languages,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      images: article.hero ? [{ url: article.hero.url, alt: article.hero.alt }] : undefined,
    },
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; category: string; slug: string }>
}) {
  const { locale: raw, category, slug } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)
  const content = getContent()
  const article = await content.getArticleBySlug(category, slug)
  if (!article) notFound()
  if (locale === 'en' && !articleHasEnglish(article)) notFound()

  const title = localizeTitle(article, locale)
  const deck = localizeDeck(article, locale)
  const body = localizeBody(article, locale)
  const card = await content.toStoryCard(article, locale)
  const related = await content.getRelated(article, locale, 6)
  const packagePeers = await content.getPackagePeers(article, locale, 4)
  const authors = (
    await Promise.all(article.authorIds.map((id) => content.getAuthorById(id)))
  ).filter(Boolean)
  const categoryDoc = await content.getCategoryBySlug(category)
  const categoryLabel =
    categoryDoc == null
      ? category
      : locale === 'en'
        ? categoryDoc.nameEn
        : categoryDoc.nameNe

  const toc = body
    .map((block, i) => {
      if (block.type !== 'heading2' && block.type !== 'heading3') return null
      return { id: slugifyHeading(block.text, i), text: block.text, level: block.type }
    })
    .filter(Boolean) as { id: string; text: string; level: 'heading2' | 'heading3' }[]

  const nextStory = related[0]
  const restRelated = related.slice(1)
  const hasEn = articleHasEnglish(article)
  const otherLocale: AppLocale = locale === 'ne' ? 'en' : 'ne'
  const bilingualHref = hasEn ? `/${otherLocale}/${category}/${slug}` : undefined
  const bilingualLabel = hasEn ? (otherLocale === 'en' ? 'English' : 'नेपाली') : undefined
  const latestPool = await content.listPublishedArticles({ locale })
  const latestCards = (
    await Promise.all(latestPool.slice(0, 8).map((a) => content.toStoryCard(a, locale)))
  ).filter((c) => c.id !== article.id).slice(0, 6)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description: deck,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt ?? article.publishedAt,
    inLanguage: locale,
    author: authors.map((a) => ({
      '@type': 'Person',
      name: locale === 'en' && a!.nameEn ? a!.nameEn : a!.nameNe,
    })),
    image: article.hero?.url,
  }

  return (
    <>
      <ReadingProgress />
      <ArticleEngagement
        storyId={article.id}
        categorySlug={category}
        slug={slug}
        title={title}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article>
        <header className="mx-auto max-w-[720px] px-4 pt-6 pb-5 md:px-6 md:pt-8">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryTag href={`/${locale}/${category}`}>{categoryLabel}</CategoryTag>
            {article.isBreaking ? (
              <span className="text-[0.7rem] font-semibold text-holiday">{dict.breaking}</span>
            ) : null}
          </div>
          <h1 className="mt-3 text-[1.85rem] font-semibold leading-[1.22] tracking-[-0.02em] md:text-[2.4rem]">
            {title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-stone">{deck}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone">
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[0.7rem] font-semibold text-accent-fg"
              aria-hidden
            >
              {dict.siteName.slice(0, 1)}
            </span>
            <span className="font-medium text-ink">
              {authors
                .map((a) => (locale === 'en' && a!.nameEn ? a!.nameEn : a!.nameNe))
                .join(', ') || dict.siteName}
            </span>
            <span aria-hidden className="text-line">
              ·
            </span>
            <span>
              {card.readTimeMinutes} {dict.minutesRead}
            </span>
            <span aria-hidden className="text-line">
              ·
            </span>
            <RelativeTime iso={article.publishedAt} locale={locale} />
            {article.updatedAt ? (
              <>
                <span aria-hidden className="text-line">
                  ·
                </span>
                <span>
                  {dict.updated}{' '}
                  {new Intl.DateTimeFormat('en-GB', {
                    timeZone: 'Asia/Kathmandu',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  }).format(new Date(article.updatedAt))}
                </span>
              </>
            ) : null}
          </div>
        </header>

        <ArticleToolbar
          dict={dict}
          bilingualHref={bilingualHref}
          bilingualLabel={bilingualLabel}
        />

        {article.hero ? (
          <figure className="relative mx-auto mb-8 aspect-[16/9] max-w-5xl overflow-hidden px-0 md:mb-10 md:px-6">
            <div className="relative aspect-[16/9] w-full">
              <Image
                src={article.hero.url}
                alt={article.hero.alt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 960px"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-2 px-4 text-xs text-stone md:px-0">
              {article.hero.alt}
              {article.hero.credit ? ` · ${article.hero.credit}` : ''}
            </figcaption>
          </figure>
        ) : null}

        <div className="mx-auto grid max-w-[1240px] gap-10 px-4 pb-16 md:px-6 lg:grid-cols-[minmax(0,720px)_280px] lg:justify-center lg:gap-10">
          <div>
            {toc.length >= 2 ? (
              <nav
                aria-label={dict.onThisPage}
                className="mb-8 border-y border-line py-4 lg:hidden"
              >
                <p className="text-sm font-medium text-stone">{dict.onThisPage}</p>
                <ol className="mt-3 space-y-2 text-sm">
                  {toc.map((item) => (
                    <li key={item.id} className={item.level === 'heading3' ? 'pl-3' : ''}>
                      <a href={`#${item.id}`} className="text-ink hover:text-accent">
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            ) : null}

            <div
              className="space-y-5 text-lg leading-[1.75]"
              style={{ fontSize: 'calc(1.125rem * var(--article-type-scale, 1))' }}
            >
              {body.map((block, i) => {
                switch (block.type) {
                  case 'paragraph':
                    return <p key={i}>{block.text}</p>
                  case 'heading2': {
                    const id = slugifyHeading(block.text, i)
                    return (
                      <h2
                        key={i}
                        id={id}
                        className="scroll-mt-28 font-[family-name:var(--font-display)] pt-4 text-2xl tracking-[-0.02em]"
                      >
                        {block.text}
                      </h2>
                    )
                  }
                  case 'heading3': {
                    const id = slugifyHeading(block.text, i)
                    return (
                      <h3
                        key={i}
                        id={id}
                        className="scroll-mt-28 font-[family-name:var(--font-display)] pt-2 text-xl tracking-[-0.02em]"
                      >
                        {block.text}
                      </h3>
                    )
                  }
                  case 'pullQuote':
                    return (
                      <blockquote
                        key={i}
                        className="border-l-2 border-accent pl-4 text-xl leading-snug text-stone"
                      >
                        <p>{block.text}</p>
                        {block.attribution ? (
                          <cite className="mt-2 block text-sm not-italic">{block.attribution}</cite>
                        ) : null}
                      </blockquote>
                    )
                  case 'list':
                    return block.ordered ? (
                      <ol key={i} className="list-decimal space-y-1 pl-5">
                        {block.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ol>
                    ) : (
                      <ul key={i} className="list-disc space-y-1 pl-5">
                        {block.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )
                  case 'image':
                    return (
                      <figure key={i} className="my-8">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={block.media.url} alt={block.media.alt} className="w-full" />
                        {block.caption ? (
                          <figcaption className="mt-2 text-sm text-stone">{block.caption}</figcaption>
                        ) : null}
                      </figure>
                    )
                  default: {
                    const _exhaustive: never = block
                    return _exhaustive
                  }
                }
              })}
            </div>

            {article.corrections.length ? (
              <aside className="mt-10 border border-line bg-paper-elevated p-4 text-sm">
                <h2 className="font-medium">{dict.corrections}</h2>
                <ul className="mt-2 space-y-2 text-stone">
                  {article.corrections.map((c) => (
                    <li key={c.at}>{locale === 'en' && c.noteEn ? c.noteEn : c.noteNe}</li>
                  ))}
                </ul>
              </aside>
            ) : null}

            <p className="mt-10 text-sm">
              <Link href={`/${locale}/${category}`} className="text-accent hover:underline">
                ← {categoryLabel}
              </Link>
            </p>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-16 space-y-6">
              {toc.length >= 2 ? (
                <div>
                  <p className="text-sm font-semibold text-stone">{dict.onThisPage}</p>
                  <ol className="mt-3 space-y-2.5 border-l border-line pl-3 text-sm text-stone">
                    {toc.map((item) => (
                      <li key={item.id} className={item.level === 'heading3' ? 'pl-2' : ''}>
                        <a href={`#${item.id}`} className="hover:text-accent">
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
              {latestCards.length ? (
                <div>
                  <p className="border-b-2 border-accent pb-2 text-sm font-semibold">{dict.latest}</p>
                  <ul className="mt-2">
                    {latestCards.map((s) => (
                      <li key={s.id} className="border-b border-line py-2 last:border-b-0">
                        <Link
                          href={`/${locale}/${s.categorySlug}/${s.slug}`}
                          className="flex gap-2 text-sm leading-snug hover:text-accent"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                          {s.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <AdSlot variant="sidebar" label={dict.advertisement} />
            </div>
          </aside>
        </div>
      </article>

      {nextStory ? (
        <section className="border-y border-line">
          <div className="mx-auto max-w-[720px] px-4 py-6 md:px-6">
            <p className="text-sm font-medium text-accent">{dict.nextStory}</p>
            <Link
              href={`/${locale}/${nextStory.categorySlug}/${nextStory.slug}`}
              className="mt-3 grid gap-4 sm:grid-cols-[9rem_1fr] sm:items-center"
            >
              <span className="relative aspect-[4/3] overflow-hidden bg-line">
                {nextStory.hero ? (
                  <Image
                    src={nextStory.hero.url}
                    alt={nextStory.hero.alt}
                    fill
                    sizes="144px"
                    className="object-cover"
                  />
                ) : null}
              </span>
              <span>
                <span className="block font-[family-name:var(--font-display)] text-xl leading-snug tracking-[-0.02em] md:text-[1.35rem]">
                  {nextStory.title}
                </span>
                <span className="mt-2 block line-clamp-2 text-sm text-stone">{nextStory.deck}</span>
              </span>
            </Link>
          </div>
        </section>
      ) : null}

      {packagePeers.length ? (
        <StoryRail title={dict.storyPackage} locale={locale} stories={packagePeers} dict={dict} />
      ) : null}

      <StoryRail title={dict.related} locale={locale} stories={restRelated} dict={dict} />
    </>
  )
}

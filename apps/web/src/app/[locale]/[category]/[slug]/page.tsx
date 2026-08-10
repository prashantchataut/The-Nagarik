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
import { CommentsSection } from '@/components/reader/CommentsSection'
import { NewsletterCard } from '@/components/reader/NewsletterCard'
import { RelativeTime } from '@/components/RelativeTime'
import { CategoryTag } from '@/components/news/CategoryTag'
import { CategoryIcon } from '@/components/CategoryIcon'
import { renderInlineMarkup } from '@/components/journalist/inline-markup'
import { getContent, siteUrl } from '@/lib/content'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'
import { Clock, CaretRight, House } from '@phosphor-icons/react/dist/ssr'

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
    title: `${title} | The Nagarik`,
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
  const heroCredit =
    article.hero?.credit && !article.hero.credit.toLowerCase().includes('dev_only')
      ? article.hero.credit
      : ''
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
      url: siteUrl(`/${locale}/author/${a!.slug}`),
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

      <main>
        {/* Breadcrumb Bar */}
        <nav aria-label="Breadcrumb" className="border-b border-line bg-paper-elevated text-xs" data-focus-hide>
          <div className="mx-auto flex max-w-[1280px] items-center gap-2 px-4 py-2 text-stone md:px-6">
            <Link href={`/${locale}`} className="inline-flex items-center gap-1 hover:text-accent">
              <House size={13} weight="bold" />
              <span>{dict.home}</span>
            </Link>
            <CaretRight size={10} weight="bold" className="text-line-strong" />
            <Link href={`/${locale}/${category}`} className="font-semibold text-ink hover:text-accent">
              {categoryLabel}
            </Link>
            <CaretRight size={10} weight="bold" className="text-line-strong" />
            <span className="truncate max-w-[200px] sm:max-w-[360px] text-stone">{title}</span>
          </div>
        </nav>

        {/* Article Header */}
        <header className="mx-auto max-w-[840px] px-4 pb-6 pt-6 md:px-6 md:pb-7 md:pt-9">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/${locale}/${category}`}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] bg-accent-muted px-2.5 py-1 text-xs font-bold text-accent hover:bg-accent hover:text-accent-fg transition-colors"
            >
              <CategoryIcon slug={category} size={13} weight="bold" />
              <span>{categoryLabel}</span>
            </Link>
            {article.isBreaking ? (
              <span className="rounded-[var(--radius-control)] bg-danger px-2 py-0.5 text-xs font-extrabold text-danger-fg animate-pulse">
                {dict.breaking}
              </span>
            ) : null}
          </div>

          <h1 className="mt-4 text-3xl font-black leading-[1.28] tracking-[-0.035em] text-ink sm:text-4xl md:text-[2.65rem] lg:text-[2.9rem]">
            {title}
          </h1>

          {deck ? (
            <p className="mt-4 max-w-[68ch] text-lg font-medium leading-relaxed text-stone md:text-xl">
              {deck}
            </p>
          ) : null}

          {/* Author & Timestamp Bar */}
          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 border-y border-line py-3.5 text-xs font-semibold text-stone">
            <span className="flex items-center gap-2 text-ink">
              <span
                className="inline-flex h-7 w-7 items-center justify-center rounded-full accent-solid text-xs font-black"
                aria-hidden
              >
                {dict.siteName.slice(0, 1)}
              </span>
              <span className="font-bold">
                {authors.length ? (
                  authors.map((author, index) => (
                    <span key={author!.id}>
                      {index ? <span className="text-stone">, </span> : null}
                      <Link href={`/${locale}/author/${author!.slug}`} className="hover:text-accent hover:underline">
                        {locale === 'en' && author!.nameEn ? author!.nameEn : author!.nameNe}
                      </Link>
                    </span>
                  ))
                ) : (
                  <span>{dict.siteName}</span>
                )}
              </span>
            </span>

            <span className="h-3 w-px bg-line" aria-hidden="true" />

            <div className="inline-flex items-center gap-1">
              <Clock size={13} weight="bold" aria-hidden="true" />
              <span>
                {card.readTimeMinutes} {dict.minutesRead}
              </span>
            </div>

            <span className="h-3 w-px bg-line" aria-hidden="true" />

            <RelativeTime iso={article.publishedAt} locale={locale} />

            {article.updatedAt ? (
              <>
                <span className="h-3 w-px bg-line" aria-hidden="true" />
                <span>
                  {dict.updated}:{' '}
                  {new Intl.DateTimeFormat(locale === 'ne' ? 'ne-NP' : 'en-NP', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(article.updatedAt))}
                </span>
              </>
            ) : null}
          </div>
        </header>

        {/* Sticky Social Share & Reading Controls */}
        <ArticleToolbar
          dict={dict}
          locale={locale}
          bilingualHref={bilingualHref}
          bilingualLabel={bilingualLabel}
          title={title}
          storyId={article.id}
          categorySlug={category}
          slug={slug}
          deck={deck}
        />

        {/* Hero Figure */}
        {article.hero ? (
          <figure className="mx-auto mb-8 max-w-[1080px] px-4 md:mb-10 md:px-6">
            <div className="editorial-image relative aspect-[16/9] w-full rounded-[var(--radius-panel)] shadow-[0_8px_28px_rgb(16_32_29_/_0.08)]">
              <Image
                src={article.hero.url}
                alt={article.hero.alt || title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 1080px"
                className="object-cover"
              />
            </div>
            {(article.hero.alt || heroCredit) ? (
              <figcaption className="mt-2.5 px-1 text-xs leading-relaxed text-stone">
                <span>{article.hero.alt}</span>
                {heroCredit ? <span> · तस्बिर: {heroCredit}</span> : null}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        {/* Main Content Layout with Sticky Sidebar */}
        <div
          data-article-grid
          className="mx-auto grid max-w-[1280px] gap-10 px-4 pb-16 md:px-6 lg:grid-cols-[minmax(0,760px)_320px] lg:justify-center lg:gap-12"
        >
          {/* Article Body */}
          <div className="min-w-0">
            {toc.length >= 2 ? (
              <nav
                aria-label={dict.onThisPage}
                className="mb-8 rounded-[var(--radius-panel)] border border-line bg-paper-elevated p-4 lg:hidden"
                data-focus-hide
              >
                <p className="text-xs font-bold uppercase tracking-wider text-accent">
                  {dict.onThisPage}
                </p>
                <ol className="mt-2.5 space-y-1.5 text-sm font-medium">
                  {toc.map((item) => (
                    <li key={item.id} className={item.level === 'heading3' ? 'pl-3 text-xs' : ''}>
                      <a href={`#${item.id}`} className="text-ink hover:text-accent">
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            ) : null}

            {/* Typography Content */}
            <div
              data-article-body
              className="space-y-6 text-lg leading-[1.85] text-ink"
              style={{ fontSize: 'calc(1.125rem * var(--article-type-scale, 1))' }}
            >
              {body.map((block, i) => {
                switch (block.type) {
                  case 'paragraph':
                    return <p key={i}>{renderInlineMarkup(block.text)}</p>
                  case 'heading2': {
                    const id = slugifyHeading(block.text, i)
                    return (
                      <h2
                        key={i}
                        id={id}
                        className="scroll-mt-24 pt-6 text-2xl font-black leading-tight tracking-[-0.025em] text-ink border-t border-line/60 md:text-[1.85rem]"
                      >
                        {renderInlineMarkup(block.text)}
                      </h2>
                    )
                  }
                  case 'heading3': {
                    const id = slugifyHeading(block.text, i)
                    return (
                      <h3
                        key={i}
                        id={id}
                        className="scroll-mt-24 pt-4 text-xl font-bold leading-snug tracking-[-0.02em] text-ink"
                      >
                        {renderInlineMarkup(block.text)}
                      </h3>
                    )
                  }
                  case 'pullQuote':
                    return (
                      <blockquote
                        key={i}
                        className="my-8 rounded-[var(--radius-control)] border-l-4 border-accent bg-paper-elevated p-5 text-xl font-bold leading-relaxed text-ink shadow-sm"
                      >
                        <p>&ldquo;{block.text}&rdquo;</p>
                        {block.attribution ? (
                          <cite className="mt-3 block text-xs font-semibold not-italic text-stone">
                            - {block.attribution}
                          </cite>
                        ) : null}
                      </blockquote>
                    )
                  case 'list':
                    return block.ordered ? (
                      <ol key={i} className="list-decimal space-y-2 pl-6 text-base leading-relaxed">
                        {block.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ol>
                    ) : (
                      <ul key={i} className="list-disc space-y-2 pl-6 text-base leading-relaxed">
                        {block.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )
                  case 'image':
                    return (
                      <figure key={i} className="my-8">
                        <div className="editorial-image relative aspect-[16/9] w-full rounded-[var(--radius-panel)] overflow-hidden">
                          <Image
                            src={block.media.url}
                            alt={block.media.alt || ''}
                            width={block.media.width || 960}
                            height={block.media.height || 540}
                            sizes="(max-width: 768px) 100vw, 760px"
                            className="h-auto w-full object-cover"
                          />
                        </div>
                        {(block.caption || block.media.credit) ? (
                          <figcaption className="mt-2 text-xs leading-relaxed text-stone">
                            {block.caption ? <span>{block.caption}</span> : null}
                            {block.caption && block.media.credit ? <span> · </span> : null}
                            {block.media.credit ? <span>तस्बिर: {block.media.credit}</span> : null}
                          </figcaption>
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

            {/* Author Profile Cards */}
            {authors.length ? (
              <section className="mt-12 rounded-[var(--radius-panel)] border border-line bg-paper-elevated p-6" aria-labelledby="article-authors-title">
                <p id="article-authors-title" className="text-xs font-bold uppercase tracking-wider text-accent">
                  {dict.authors}
                </p>
                <div className="mt-4 space-y-4">
                  {authors.map((author) => {
                    const name = locale === 'en' && author!.nameEn ? author!.nameEn : author!.nameNe
                    const bio = locale === 'en' && author!.bioEn ? author!.bioEn : author!.bioNe
                    return (
                      <div key={author!.id} className="flex gap-3.5 items-start">
                        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-accent-fg font-black text-sm">
                          {author!.avatarUrl ? (
                            <Image
                              src={author!.avatarUrl}
                              alt={name}
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          ) : (
                            name.slice(0, 1)
                          )}
                        </span>
                        <div>
                          <Link href={`/${locale}/author/${author!.slug}`} className="text-base font-bold text-ink hover:text-accent">
                            {name}
                          </Link>
                          {author!.beats?.length ? (
                            <p className="mt-0.5 text-[0.68rem] font-bold text-accent">
                              {author!.beats.join(' · ')}
                            </p>
                          ) : null}
                          {bio ? <p className="mt-1 text-xs leading-relaxed text-stone">{bio}</p> : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            ) : null}

            {/* Tags */}
            {article.tagSlugs.length ? (
              <nav className="mt-8 flex flex-wrap gap-2 text-xs" aria-label="Tags" data-focus-hide>
                {article.tagSlugs.map((tag) => (
                  <Link
                    key={tag}
                    href={`/${locale}/search?q=${encodeURIComponent(tag)}`}
                    className="rounded-full bg-paper-elevated border border-line px-3 py-1.5 font-bold text-stone hover:border-accent hover:text-accent transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </nav>
            ) : null}

            {/* Corrections */}
            {article.corrections.length ? (
              <aside className="mt-8 rounded-[var(--radius-panel)] border border-warning/40 bg-warning-muted/30 p-4 text-xs">
                <h2 className="font-bold text-warning">{dict.corrections}</h2>
                <ul className="mt-2 space-y-1.5 text-stone">
                  {article.corrections.map((c) => (
                    <li key={c.at}>{locale === 'en' && c.noteEn ? c.noteEn : c.noteNe}</li>
                  ))}
                </ul>
              </aside>
            ) : null}

            {/* Reader comments with moderation */}
            <CommentsSection articleId={article.id} locale={locale} />
          </div>

          {/* Sticky Desktop Sidebar */}
          <aside className="hidden lg:block" data-focus-hide>
            <div className="sticky top-20 space-y-7">
              {/* In-Article TOC */}
              {toc.length >= 2 ? (
                <div className="rounded-[var(--radius-panel)] border border-line bg-paper-elevated p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-accent mb-3">
                    {dict.onThisPage}
                  </p>
                  <ol className="space-y-2 border-l border-line pl-3 text-xs text-stone">
                    {toc.map((item) => (
                      <li key={item.id} className={item.level === 'heading3' ? 'pl-2' : ''}>
                        <a href={`#${item.id}`} className="hover:text-accent font-medium transition-colors">
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}

              {/* Latest News Widget */}
              {latestCards.length ? (
                <div className="rounded-[var(--radius-panel)] border border-line bg-paper p-4">
                  <div className="flex items-center justify-between border-b-2 border-accent pb-2 mb-3">
                    <p className="text-sm font-black text-ink">{dict.latest}</p>
                    <Link href={`/${locale}/latest`} className="text-xs font-bold text-accent hover:underline">
                      {dict.seeAll}
                    </Link>
                  </div>
                  <ul className="divide-y divide-line">
                    {latestCards.slice(0, 5).map((s) => (
                      <li key={s.id} className="py-2.5 first:pt-1 last:pb-0 group">
                        <Link
                          href={`/${locale}/${s.categorySlug}/${s.slug}`}
                          className="text-xs font-bold leading-snug text-ink group-hover:text-accent transition-colors block"
                        >
                          {s.title}
                        </Link>
                        <p className="mt-1 text-[0.68rem] text-stone">
                          <RelativeTime iso={s.publishedAt} locale={locale} />
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Newsletter signup */}
              <NewsletterCard locale={locale} variant="sidebar" />
            </div>
          </aside>
        </div>
      </main>

      {/* Next Story Card */}
      {nextStory ? (
        <section className="border-y-2 border-line bg-paper-alt py-8" data-focus-hide>
          <div className="mx-auto max-w-[840px] px-4 md:px-6">
            <p className="text-xs font-bold uppercase tracking-wider text-accent">{dict.nextStory}</p>
            <Link
              href={`/${locale}/${nextStory.categorySlug}/${nextStory.slug}`}
              className={`mt-4 surface-card grid gap-4 p-4 overflow-hidden group ${
                nextStory.hero ? 'sm:grid-cols-[10rem_1fr] sm:items-center' : ''
              }`}
            >
              {nextStory.hero ? (
                <span className="editorial-image relative aspect-[4/3] rounded-[var(--radius-control)] overflow-hidden">
                  <Image
                    src={nextStory.hero.url}
                    alt={nextStory.hero.alt || nextStory.title}
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                </span>
              ) : null}
              <div>
                <span className="text-xs font-bold text-accent capitalize">{nextStory.categorySlug}</span>
                <h3 className="mt-1 text-xl font-bold leading-snug tracking-[-0.018em] text-ink group-hover:text-accent transition-colors">
                  {nextStory.title}
                </h3>
                {nextStory.deck ? (
                  <p className="mt-2 line-clamp-2 text-xs text-stone">{nextStory.deck}</p>
                ) : null}
              </div>
            </Link>
          </div>
        </section>
      ) : null}

      {/* Series Packages & Related Stories */}
      {packagePeers.length ? (
        <div data-focus-hide>
          <StoryRail title={dict.storyPackage} locale={locale} stories={packagePeers} dict={dict} />
        </div>
      ) : null}

      <div data-focus-hide>
        <StoryRail title={dict.related} locale={locale} stories={restRelated} dict={dict} />
      </div>
    </>
  )
}

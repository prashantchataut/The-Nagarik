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
  ReadingProgress,
  ShareCopyButton,
} from '@/components/ReaderClient'
import { StoryRail } from '@/components/Story'
import { getContent, siteUrl } from '@/lib/content'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

export const revalidate = 60

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
  const related = await content.getRelated(article, locale, 5)
  const authors = (
    await Promise.all(article.authorIds.map((id) => content.getAuthorById(id)))
  ).filter(Boolean)

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
      <ArticleEngagement storyId={article.id} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="mx-auto max-w-[1400px] px-4 md:px-6">
        <header className="mx-auto max-w-[720px] pt-10 pb-8">
          {article.isBreaking ? (
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{dict.breaking}</p>
          ) : null}
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-[1.2] tracking-tight md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-stone">{deck}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-stone">
            <span>
              {authors
                .map((a) => (locale === 'en' && a!.nameEn ? a!.nameEn : a!.nameNe))
                .join(', ')}
            </span>
            <span>
              {card.readTimeMinutes} {dict.minutesRead}
            </span>
            {article.updatedAt ? (
              <span>
                {dict.updated} {new Date(article.updatedAt).toLocaleString(locale === 'ne' ? 'ne-NP' : 'en-GB')}
              </span>
            ) : null}
            <ShareCopyButton dict={dict} />
          </div>
        </header>

        {article.hero ? (
          <figure className="relative mx-auto mb-10 aspect-[16/9] max-w-5xl overflow-hidden">
            <Image
              src={article.hero.url}
              alt={article.hero.alt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 960px"
              className="object-cover"
            />
            <figcaption className="mt-2 text-xs text-stone">
              {article.hero.alt}
              {article.hero.credit ? ` - ${article.hero.credit}` : ''}
            </figcaption>
          </figure>
        ) : null}

        <div className="mx-auto max-w-[65ch] space-y-5 pb-16 text-lg leading-[1.75]">
          {body.map((block, i) => {
            switch (block.type) {
              case 'paragraph':
                return <p key={i}>{block.text}</p>
              case 'heading2':
                return (
                  <h2 key={i} className="font-[family-name:var(--font-display)] text-2xl pt-4">
                    {block.text}
                  </h2>
                )
              case 'heading3':
                return (
                  <h3 key={i} className="font-[family-name:var(--font-display)] text-xl pt-2">
                    {block.text}
                  </h3>
                )
              case 'pullQuote':
                return (
                  <blockquote key={i} className="border-l-2 border-accent pl-4 text-xl text-stone">
                    <p>{block.text}</p>
                    {block.attribution ? <cite className="mt-2 block text-sm not-italic">{block.attribution}</cite> : null}
                  </blockquote>
                )
              case 'list':
                return block.ordered ? (
                  <ol key={i} className="list-decimal pl-5">
                    {block.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                ) : (
                  <ul key={i} className="list-disc pl-5">
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
                    {block.caption ? <figcaption className="mt-2 text-sm text-stone">{block.caption}</figcaption> : null}
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
          <aside className="mx-auto mb-12 max-w-[65ch] border border-line bg-paper-elevated p-4 text-sm">
            <h2 className="font-medium">{dict.corrections}</h2>
            <ul className="mt-2 space-y-2 text-stone">
              {article.corrections.map((c) => (
                <li key={c.at}>{locale === 'en' && c.noteEn ? c.noteEn : c.noteNe}</li>
              ))}
            </ul>
          </aside>
        ) : null}

        <p className="mx-auto mb-8 max-w-[65ch] text-sm">
          <Link href={`/${locale}/${category}`} className="text-accent">
            ← {category}
          </Link>
        </p>
      </article>

      <StoryRail title={dict.related} locale={locale} stories={related} />
    </>
  )
}

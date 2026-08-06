import Image from 'next/image'
import Link from 'next/link'
import type { StoryCard } from '@thenagarik/content'
import type { AppLocale } from '@/lib/i18n'
import { CategoryTag } from '@/components/news/CategoryTag'
import { StoryByline } from '@/components/news/StoryByline'

/** Ratopati-style centered feed story: tag → headline → byline → image */
export function FeedStory({
  locale,
  story,
  categoryLabel,
  priority = false,
  textFirst = false,
}: {
  locale: AppLocale
  story: StoryCard
  categoryLabel: string
  priority?: boolean
  textFirst?: boolean
}) {
  const href = `/${locale}/${story.categorySlug}/${story.slug}`
  const catHref = `/${locale}/${story.categorySlug}`

  const textBlock = (
    <div className="mx-auto max-w-[52rem] px-4 text-center md:px-6">
      <div className="mb-3">
        <CategoryTag href={catHref}>{categoryLabel}</CategoryTag>
        {story.isBreaking ? (
          <span className="ml-2 text-xs font-semibold text-holiday">{locale === 'ne' ? 'ब्रेकिङ' : 'Breaking'}</span>
        ) : null}
      </div>
      <h2 className="text-[1.65rem] font-semibold leading-[1.25] tracking-[-0.02em] text-ink md:text-[2.35rem] lg:text-[2.75rem]">
        <Link href={href} className="hover:text-accent">
          {story.title}
        </Link>
      </h2>
      <div className="mt-3">
        <StoryByline locale={locale} authors={story.authorNames} publishedAt={story.publishedAt} centered />
      </div>
    </div>
  )

  const imageBlock = story.hero ? (
    <Link href={href} className="relative mt-5 block aspect-[16/9] overflow-hidden md:aspect-[2/1]">
      <Image
        src={story.hero.url}
        alt={story.hero.alt}
        fill
        priority={priority}
        sizes="(max-width: 1240px) 100vw, 1210px"
        className="object-cover"
      />
    </Link>
  ) : null

  return (
    <article className="border-b border-line py-8 md:py-10">
      {textFirst ? (
        <>
          {textBlock}
          {imageBlock}
        </>
      ) : (
        <>
          {textBlock}
          {imageBlock}
        </>
      )}
    </article>
  )
}

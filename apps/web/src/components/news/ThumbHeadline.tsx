import Image from 'next/image'
import Link from 'next/link'
import type { StoryCard } from '@thenagarik/content'
import type { AppLocale } from '@/lib/i18n'

export function ThumbHeadline({
  locale,
  story,
  numbered,
}: {
  locale: AppLocale
  story: StoryCard
  numbered?: number
}) {
  const href = `/${locale}/${story.categorySlug}/${story.slug}`
  return (
    <Link
      href={href}
      className="grid grid-cols-[4.5rem_1fr] items-start gap-3 py-2.5 hover:text-accent sm:grid-cols-[5rem_1fr]"
    >
      <span className="relative aspect-[4/3] overflow-hidden bg-line">
        {story.hero ? (
          <Image src={story.hero.url} alt="" fill sizes="80px" className="object-cover" />
        ) : null}
        {numbered != null ? (
          <span className="absolute left-0 top-0 accent-solid px-1.5 text-[0.7rem] font-semibold ">
            {numbered}
          </span>
        ) : null}
      </span>
      <span className="min-w-0 self-center text-[1.02rem] font-medium leading-snug text-ink">
        {story.title}
      </span>
    </Link>
  )
}

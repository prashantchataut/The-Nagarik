import { RelativeTime } from '@/components/RelativeTime'
import type { AppLocale } from '@/lib/i18n'

export function StoryByline({
  locale,
  authors,
  publishedAt,
  outlet,
  centered = false,
}: {
  locale: AppLocale
  authors: string[]
  publishedAt?: string
  outlet?: string
  centered?: boolean
}) {
  const name = authors[0] || outlet || (locale === 'ne' ? 'द नागरिक' : 'The Nagarik')
  return (
    <div
      className={`flex items-center gap-2 text-xs text-stone ${centered ? 'justify-center' : ''}`}
    >
      <span
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[0.65rem] font-semibold text-accent-fg"
        aria-hidden
      >
        {name.slice(0, 1)}
      </span>
      <span className="min-w-0 truncate">{name}</span>
      {publishedAt ? (
        <>
          <span className="text-line" aria-hidden>
            ·
          </span>
          <RelativeTime iso={publishedAt} locale={locale} />
        </>
      ) : null}
    </div>
  )
}

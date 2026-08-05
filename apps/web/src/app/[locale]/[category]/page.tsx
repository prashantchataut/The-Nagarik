import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { StoryLink } from '@/components/Story'
import { getContent } from '@/lib/content'
import { getDictionary, isLocale, type AppLocale } from '@/lib/i18n'

export const revalidate = 60

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>
}) {
  const { locale: raw, category: categorySlug } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as AppLocale
  const dict = getDictionary(locale)
  const content = getContent()
  const category = await content.getCategoryBySlug(categorySlug)
  if (!category) notFound()

  const articles = await content.listPublishedArticles({ categorySlug, locale })
  const cards = await Promise.all(articles.map((a) => content.toStoryCard(a, locale)))
  const [feature, ...rest] = cards
  const rail = rest.slice(0, 4)
  const list = rest.slice(4)

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <header className="border-b border-line pb-4">
        <h1 className="font-[family-name:var(--font-display)] text-2xl tracking-[-0.02em] md:text-3xl">
          {locale === 'en' ? category.nameEn : category.nameNe}
        </h1>
        {(locale === 'en' ? category.descriptionEn : category.descriptionNe) ? (
          <p className="mt-2 max-w-[65ch] text-sm text-stone">
            {locale === 'en' ? category.descriptionEn : category.descriptionNe}
          </p>
        ) : null}
      </header>

      {!cards.length ? <p className="mt-10">{dict.empty}</p> : null}

      {feature ? (
        <article className="mt-6 grid gap-5 border-b border-line pb-6 lg:grid-cols-12 lg:gap-8">
          <Link
            href={`/${locale}/${feature.categorySlug}/${feature.slug}`}
            className="relative aspect-[16/10] overflow-hidden lg:col-span-7 lg:aspect-auto lg:min-h-[320px]"
          >
            {feature.hero ? (
              <Image
                src={feature.hero.url}
                alt={feature.hero.alt}
                fill
                priority
                sizes="(max-width:1024px) 100vw, 58vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-line" />
            )}
          </Link>
          <div className="flex flex-col justify-center lg:col-span-5">
            <h2 className="font-[family-name:var(--font-display)] text-xl leading-snug tracking-[-0.02em] md:text-2xl">
              <Link href={`/${locale}/${feature.categorySlug}/${feature.slug}`}>{feature.title}</Link>
            </h2>
            <p className="mt-2.5 max-w-[48ch] text-[0.95rem] leading-relaxed text-stone">{feature.deck}</p>
            <p className="mt-3 text-xs text-stone">
              {feature.authorNames.join(', ')}
              <span className="mx-2 text-line">/</span>
              {feature.readTimeMinutes} {dict.minutesRead}
            </p>
          </div>
        </article>
      ) : null}

      {rail.length ? (
        <section className="mt-4 border-b border-line pb-4">
          <h3 className="text-sm font-medium text-stone">{dict.latest}</h3>
          <ul className="mt-1 grid md:grid-cols-2 md:gap-x-8">
            {rail.map((s) => (
              <li key={s.id} className="border-t border-line">
                <Link
                  href={`/${locale}/${s.categorySlug}/${s.slug}`}
                  className="block py-2.5 font-[family-name:var(--font-display)] text-[1.05rem] leading-snug hover:text-accent"
                >
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-1">
        {list.map((s) => (
          <StoryLink key={s.id} locale={locale} story={s} dict={dict} />
        ))}
      </div>
    </div>
  )
}

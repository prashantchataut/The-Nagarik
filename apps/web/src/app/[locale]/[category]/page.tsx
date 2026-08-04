import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { StoryLink } from '@/components/Story'
import { Reveal } from '@/components/Reveal'
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
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6 md:py-10">
      <header className="border-b border-line pb-5">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.03em] md:text-4xl">
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
        <Reveal>
          <article className="mt-8 grid gap-6 border-b border-line pb-8 lg:grid-cols-12 lg:gap-10">
            <Link
              href={`/${locale}/${feature.categorySlug}/${feature.slug}`}
              className="relative aspect-[16/10] overflow-hidden lg:col-span-7 lg:aspect-auto lg:min-h-[360px]"
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
              <h2 className="font-[family-name:var(--font-display)] text-2xl leading-snug tracking-[-0.03em] md:text-3xl">
                <Link href={`/${locale}/${feature.categorySlug}/${feature.slug}`}>{feature.title}</Link>
              </h2>
              <p className="mt-3 max-w-[48ch] text-base leading-relaxed text-stone">{feature.deck}</p>
              <p className="mt-4 text-xs text-stone">
                {feature.authorNames.join(', ')}
                <span className="mx-2 text-line">/</span>
                {feature.readTimeMinutes} {dict.minutesRead}
              </p>
            </div>
          </article>
        </Reveal>
      ) : null}

      {rail.length ? (
        <section className="mt-5 border-b border-line pb-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-stone">{dict.latest}</h3>
          <ul className="mt-2 grid gap-3 md:grid-cols-2">
            {rail.map((s, i) => (
              <li key={s.id} className="border-t border-line pt-3">
                <Link
                  href={`/${locale}/${s.categorySlug}/${s.slug}`}
                  className="font-[family-name:var(--font-display)] text-lg leading-snug tracking-[-0.02em] hover:text-accent"
                >
                  <span className="mr-2 text-sm text-accent">{i + 1}.</span>
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-2">
        {list.map((s) => (
          <StoryLink key={s.id} locale={locale} story={s} dict={dict} />
        ))}
      </div>
    </div>
  )
}

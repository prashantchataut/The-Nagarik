import type { MetadataRoute } from 'next'
import { SITE } from '@/site.config'

export default function manifest(): MetadataRoute.Manifest {
  const home = `/${SITE.editorial.defaultLocale}`
  return {
    name: SITE.brand.en,
    short_name: SITE.brand.en,
    description: SITE.brand.descriptionEn ?? SITE.brand.taglineEn,
    start_url: home,
    display: 'standalone',
    background_color: SITE.theme.background,
    theme_color: SITE.theme.accent,
    lang: SITE.editorial.defaultLocale,
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}

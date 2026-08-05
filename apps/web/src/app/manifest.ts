import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'The Nagarik',
    short_name: 'The Nagarik',
    description: 'Nepali-first civic news for Nepal.',
    start_url: '/ne',
    display: 'standalone',
    background_color: '#E8ECF1',
    theme_color: '#0F6E6A',
    lang: 'ne',
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

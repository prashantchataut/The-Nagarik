import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'द नागरिक | The Nagarik',
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
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}

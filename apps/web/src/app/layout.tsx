import type { Metadata } from 'next'
import './globals.css'
import { PwaRegister } from '@/components/PwaRegister'
import { SITE } from '@/site.config'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: `${SITE.brand.en} | ${SITE.brand.ne}`,
    template: `%s | ${SITE.brand.en}`,
  },
  description: SITE.brand.descriptionEn ?? SITE.brand.taglineEn,
  manifest: '/manifest.webmanifest',
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: SITE.brand.en,
    statusBarStyle: 'default',
  },
  icons: {
    icon: [{ url: '/icon', type: 'image/png', sizes: '512x512' }],
    apple: [{ url: '/apple-icon', type: 'image/png', sizes: '180x180' }],
  },
}

const themeInitScript = `(function(){try{var t=localStorage.getItem('tn_theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);document.documentElement.setAttribute('data-theme-mode',t);}else{var dark=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.setAttribute('data-theme',dark?'dark':'light');document.documentElement.setAttribute('data-theme-mode','system');}}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ne" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        style={
          {
            '--font-sans': "'Mukta', 'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            '--font-display': "'Mukta', 'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            '--font-serif': "'Noto Serif Devanagari', Georgia, serif",
          } as React.CSSProperties
        }
      >
        <PwaRegister />
        {children}
      </body>
    </html>
  )
}
import type { Metadata } from 'next'
import './globals.css'
import { PwaRegister } from '@/components/PwaRegister'
import { SITE } from '@/site.config'

export const dynamic = 'force-dynamic'

/**
 * Font loading strategy (ADR-0005):
 * Target is next/font self-hosting, but this build environment has no egress
 * to fonts.googleapis.com, which next/font requires at compile time. Interim
 * best practice: preconnect + a parallel <link> stylesheet with display=swap.
 * Unlike the previous CSS @import, this does not serialize behind globals.css.
 * Families derive from site.config (factory theme layer).
 */
const FONT_FAMILIES = [
  `family=${SITE.theme.fonts.sans.replace(/ /g, '+')}:wght@400;500;600;700;800`,
  `family=${SITE.theme.fonts.serif.replace(/ /g, '+')}:wght@400;600;700;800`,
  'family=IBM+Plex+Mono:wght@400;500',
].join('&')
const FONT_CSS_URL = `https://fonts.googleapis.com/css2?${FONT_FAMILIES}&display=swap`

/** Indexing is gated on launch status - never hardcoded. */
const IS_LIVE = (process.env.LAUNCH_STATUS ?? 'dev') === 'live'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: `${SITE.brand.en} | ${SITE.brand.ne}`,
    template: `%s | ${SITE.brand.en}`,
  },
  description: SITE.brand.descriptionEn ?? SITE.brand.taglineEn,
  manifest: '/manifest.webmanifest',
  robots: IS_LIVE ? { index: true, follow: true } : { index: false, follow: false },
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
  const sans = `'${SITE.theme.fonts.sans}', 'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
  const serif = `'${SITE.theme.fonts.serif}', Georgia, serif`

  return (
    <html lang={SITE.editorial.defaultLocale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONT_CSS_URL} />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        style={
          {
            '--font-sans': sans,
            '--font-display': sans,
            '--font-serif': serif,
            '--font-mono': "'IBM Plex Mono', ui-monospace, monospace",
          } as React.CSSProperties
        }
      >
        <PwaRegister />
        {children}
      </body>
    </html>
  )
}

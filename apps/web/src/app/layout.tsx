import type { Metadata } from 'next'
import { Mukta, Noto_Serif_Devanagari } from 'next/font/google'
import './globals.css'
import { PwaRegister } from '@/components/PwaRegister'

const sans = Mukta({
  subsets: ['devanagari', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mukta',
  display: 'swap',
})

const display = Noto_Serif_Devanagari({
  subsets: ['devanagari', 'latin'],
  variable: '--font-noto-devanagari',
  display: 'swap',
})

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'The Nagarik | द नागरिक',
    template: '%s | The Nagarik',
  },
  description: 'Nepali-first civic news for Nepal.',
  manifest: '/manifest.webmanifest',
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: 'The Nagarik',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [{ url: '/icon', type: 'image/png', sizes: '512x512' }],
    apple: [{ url: '/apple-icon', type: 'image/png', sizes: '180x180' }],
  },
}

const themeInitScript = `(function(){try{var t=localStorage.getItem('tn_theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}else{document.documentElement.setAttribute('data-theme','light');}}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ne" className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        style={
          {
            '--font-sans': 'var(--font-mukta), Mukta, "Noto Sans Devanagari", sans-serif',
            '--font-display': 'var(--font-mukta), Mukta, "Noto Sans Devanagari", sans-serif',
            '--font-serif': 'var(--font-noto-devanagari), "Noto Serif Devanagari", serif',
          } as React.CSSProperties
        }
      >
        <PwaRegister />
        {children}
      </body>
    </html>
  )
}
import type { Metadata } from 'next'
import { Manrope, Noto_Serif_Devanagari } from 'next/font/google'
import './globals.css'
import { PwaRegister } from '@/components/PwaRegister'

const sans = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

const display = Noto_Serif_Devanagari({
  subsets: ['devanagari', 'latin'],
  variable: '--font-noto-devanagari',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'द नागरिक | The Nagarik',
    template: '%s | The Nagarik',
  },
  description: 'Nepali-first civic news for Nepal.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'The Nagarik',
    statusBarStyle: 'default',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ne" className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
      <body
        style={
          {
            '--font-sans': 'var(--font-manrope), Manrope, sans-serif',
            '--font-display': 'var(--font-noto-devanagari), "Noto Serif Devanagari", serif',
          } as React.CSSProperties
        }
      >
        <PwaRegister />
        {children}
      </body>
    </html>
  )
}

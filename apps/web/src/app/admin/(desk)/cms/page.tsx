import Link from 'next/link'
import type { Metadata } from 'next'
import {
  AdminButton,
  AdminCard,
} from '@/components/admin/primitives'
import { CMS_BASE, cmsCollectionUrl } from '@/lib/admin/nav'
import {
  Article,
  Users,
  Folder,
  Tag,
  Video,
  ArrowSquareOut,
  ShieldCheck,
} from '@phosphor-icons/react/dist/ssr'

export const metadata: Metadata = {
  title: 'Payload CMS · Newsroom Gateway',
  robots: { index: false, follow: false },
}

export default function CmsGatewayPage() {
  const collections = [
    {
      name: 'Articles',
      desc: 'समाचार, मस्यौदा, समीक्षा तथा प्रकाशन',
      href: cmsCollectionUrl('articles'),
      icon: Article,
    },
    {
      name: 'Media',
      desc: 'तस्बिर, फोटो फिचर र मिडिया सम्पत्ति',
      href: cmsCollectionUrl('media'),
      icon: Video,
    },
    {
      name: 'Authors',
      desc: 'लेखक, पत्रकार र बाइलाइन प्रोफाइल',
      href: cmsCollectionUrl('authors'),
      icon: Users,
    },
    {
      name: 'Categories',
      desc: 'समाचार विभाग तथा नेभिगेसन संरचना',
      href: cmsCollectionUrl('categories'),
      icon: Folder,
    },
    {
      name: 'Tags',
      desc: 'ट्रेन्डिङ ह्यासट्याग तथा विषय ट्यागहरू',
      href: cmsCollectionUrl('tags'),
      icon: Tag,
    },
    {
      name: 'Users',
      desc: 'कर्मचारी, सम्पादक र रोल व्यवस्थापन (RBAC)',
      href: cmsCollectionUrl('users'),
      icon: ShieldCheck,
    },
  ]

  return (
    <div className="space-y-8 max-w-[1040px]">
      <header className="border-b border-line pb-5">
        <p className="text-xs font-bold uppercase tracking-wider text-accent">
          सामग्री व्यवस्थापन
        </p>
        <h1 className="mt-1 text-2xl font-black text-ink sm:text-3xl">
          Payload CMS Editorial Gateway
        </h1>
        <p className="mt-1 text-xs text-stone">
          Direct canonical deep-links into embedded Payload CMS collections.
        </p>
      </header>

      {/* Main CMS Launcher Card */}
      <div className="surface-card p-6 md:p-8 border-accent/40 bg-paper-elevated">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-ink">
              Payload CMS Admin Panel
            </h2>
            <p className="mt-1 text-xs text-stone">
              Full Lexical rich-text editor, media uploader, workflow controls, and version history.
            </p>
          </div>

          <AdminButton href={CMS_BASE} external>
            Open Complete /cms →
          </AdminButton>
        </div>
      </div>

      {/* Collections Grid */}
      <section aria-label="Collections">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone mb-4">
          व्यक्तिगत संग्रहहरू (Direct Collection Links)
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => {
            const Icon = c.icon
            return (
              <Link
                key={c.name}
                href={c.href}
                target="_blank"
                rel="noreferrer"
                className="surface-card flex flex-col justify-between p-5 group hover:border-accent hover:shadow-sm transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] bg-paper-elevated text-accent group-hover:bg-accent group-hover:text-accent-fg transition-colors">
                      <Icon size={20} weight="bold" />
                    </span>
                    <ArrowSquareOut size={14} weight="bold" className="text-stone group-hover:text-accent" />
                  </div>

                  <h3 className="mt-3 text-base font-bold text-ink group-hover:text-accent transition-colors">
                    {c.name}
                  </h3>

                  <p className="mt-1 text-xs text-stone">
                    {c.desc}
                  </p>
                </div>

                <p className="mt-4 text-[0.7rem] font-bold text-accent">
                  Launch in CMS →
                </p>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}

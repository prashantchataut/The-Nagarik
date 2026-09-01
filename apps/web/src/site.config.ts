import { assertLaunchReady, defineSite } from '@/lib/site-schema'

/**
 * THE single source of brand truth for this portal.
 * The golden template renders any site from this config; nothing
 * brand-specific may be hardcoded elsewhere (docs/NETWORK_FACTORY_PLAN.md).
 *
 * Cloning a site = copy this file + swap values + choose a theme preset.
 */
export const SITE = defineSite({
  id: 'thenagarik',
  domain: 'thenagarik.com',

  brand: {
    ne: 'द नागरिक',
    en: 'The Nagarik',
    taglineNe: 'नेपालको नागरिक समाचार',
    taglineEn: 'Civic news for Nepal',
    descriptionNe: 'निष्पक्ष, विश्वसनीय र नागरिक-केन्द्रित नेपाली समाचार।',
    descriptionEn: 'Nepali-first civic news for Nepal.',
  },

  theme: {
    preset: 'valley-mist',
    accent: '#0b6b63',
    background: '#e8ecf1',
    fonts: { sans: 'Mukta', serif: 'Noto Serif Devanagari' },
    radius: 'editorial',
  },

  layout: {
    header: 'two-tier',
    hero: 'commanding',
    sectionBands: ['bordered', 'cards', 'list'],
    showTicker: true,
    showPatroStrip: true,
  },

  editorial: {
    locales: ['ne', 'en'],
    defaultLocale: 'ne',
    categories: [
      { slug: 'samachar', ne: 'समाचार', en: 'News' },
      { slug: 'rajniti', ne: 'राजनीति', en: 'Politics' },
      { slug: 'arth', ne: 'अर्थ', en: 'Economy' },
      { slug: 'pradesh', ne: 'प्रदेश', en: 'Provinces' },
      { slug: 'bichar', ne: 'विचार', en: 'Opinion' },
      { slug: 'khel', ne: 'खेलकुद', en: 'Sports' },
      { slug: 'bishwa', ne: 'विश्व', en: 'World' },
      { slug: 'pravas', ne: 'प्रवास', en: 'Diaspora' },
    ],
    provinces: true,
  },

  legal: {
    // Required before LAUNCH_STATUS=live (enforced by assertLaunchReady).
    publisherName: '',
    registrationNo: '',
    address: '',
    editorName: '',
    contactEmail: '',
  },

  integrations: {
    analyticsId: '',
    adsenseId: '',
    socials: { facebook: '', x: '', youtube: '' },
  },
})

// Fail fast on live launches without a legal identity.
assertLaunchReady(SITE, process.env.LAUNCH_STATUS ?? 'dev')

export type { SiteConfig } from '@/lib/site-schema'

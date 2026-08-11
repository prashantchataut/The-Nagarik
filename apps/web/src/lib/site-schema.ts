import { z } from 'zod'

/**
 * Site factory configuration schema.
 * Every portal in the network is: golden template + site.config + theme + content.
 * This schema is the contract shared with the Nagarik Watch agent
 * (see docs/NETWORK_FACTORY_PLAN.md §2.2).
 */

export const SiteLocaleSchema = z.enum(['ne', 'en'])

export const SiteCategorySchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase kebab-case'),
  ne: z.string().min(1).max(60),
  en: z.string().min(1).max(60),
})

export const SiteConfigSchema = z.object({
  /** Stable machine id, used for tenant keys, cache prefixes, media prefixes. */
  id: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, 'id must be lowercase kebab-case'),
  domain: z.string().min(4).max(120),

  brand: z.object({
    ne: z.string().min(1).max(60),
    en: z.string().min(1).max(60),
    taglineNe: z.string().min(1).max(120),
    taglineEn: z.string().min(1).max(120),
    descriptionNe: z.string().max(300).optional(),
    descriptionEn: z.string().max(300).optional(),
  }),

  theme: z.object({
    /** Token preset name; presets live in @thenagarik/ui. */
    preset: z.string().default('valley-mist'),
    /** Primary accent, used for PWA/theme-color and future scale generation. */
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    /** Manifest background color. */
    background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    fonts: z
      .object({
        sans: z.string().default('Mukta'),
        serif: z.string().default('Noto Serif Devanagari'),
      })
      .default({ sans: 'Mukta', serif: 'Noto Serif Devanagari' }),
    radius: z.enum(['sharp', 'editorial', 'soft']).default('editorial'),
  }),

  layout: z.object({
    header: z.enum(['two-tier', 'compact']).default('two-tier'),
    hero: z.enum(['commanding', 'split', 'mosaic']).default('commanding'),
    sectionBands: z
      .array(z.enum(['bordered', 'cards', 'list']))
      .min(1)
      .default(['bordered', 'cards', 'list']),
    showTicker: z.boolean().default(true),
    showPatroStrip: z.boolean().default(true),
  }),

  editorial: z.object({
    locales: z.array(SiteLocaleSchema).min(1).default(['ne', 'en']),
    defaultLocale: SiteLocaleSchema.default('ne'),
    categories: z.array(SiteCategorySchema).min(3),
    provinces: z.boolean().default(true),
  }),

  /**
   * Legal identity. Optional in dev; `assertLaunchReady` enforces it before
   * a live launch (Nepal online media registration requirements).
   */
  legal: z
    .object({
      publisherName: z.string().max(160).default(''),
      registrationNo: z.string().max(80).default(''),
      address: z.string().max(200).default(''),
      editorName: z.string().max(120).default(''),
      contactEmail: z.string().max(160).default(''),
    })
    .default({}),

  integrations: z
    .object({
      analyticsId: z.string().max(64).default(''),
      adsenseId: z.string().max(64).default(''),
      socials: z
        .object({
          facebook: z.string().max(200).default(''),
          x: z.string().max(200).default(''),
          youtube: z.string().max(200).default(''),
        })
        .default({}),
    })
    .default({}),
})

export type SiteConfig = z.infer<typeof SiteConfigSchema>
export type SiteCategory = z.infer<typeof SiteCategorySchema>

/** Validate at module load: a malformed config must fail the build, not prod. */
export function defineSite(input: z.input<typeof SiteConfigSchema>): SiteConfig {
  const parsed = SiteConfigSchema.safeParse(input)
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ')
    throw new Error(`Invalid site.config: ${issues}`)
  }
  const config = parsed.data
  if (!config.editorial.locales.includes(config.editorial.defaultLocale)) {
    throw new Error('Invalid site.config: defaultLocale must be in editorial.locales')
  }
  const slugs = new Set<string>()
  for (const category of config.editorial.categories) {
    if (slugs.has(category.slug)) {
      throw new Error(`Invalid site.config: duplicate category slug "${category.slug}"`)
    }
    slugs.add(category.slug)
  }
  return config
}

/** Gate for live launches: legal identity is not optional in production. */
export function assertLaunchReady(config: SiteConfig, launchStatus: string): void {
  if (launchStatus !== 'live') return
  const { publisherName, registrationNo, editorName } = config.legal
  const missing: string[] = []
  if (!publisherName) missing.push('legal.publisherName')
  if (!registrationNo) missing.push('legal.registrationNo')
  if (!editorName) missing.push('legal.editorName')
  if (missing.length) {
    throw new Error(
      `LAUNCH_STATUS=live requires legal identity in site.config: missing ${missing.join(', ')}`,
    )
  }
}

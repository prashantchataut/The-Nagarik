import { z } from 'zod'

export const LocaleSchema = z.enum(['ne', 'en'])
export type Locale = z.infer<typeof LocaleSchema>

export const EnglishStatusSchema = z.enum(['none', 'draft', 'in_review', 'published'])
export type EnglishStatus = z.infer<typeof EnglishStatusSchema>

export const WorkflowStatusSchema = z.enum(['draft', 'in_review', 'scheduled', 'published', 'retracted'])
export type WorkflowStatus = z.infer<typeof WorkflowStatusSchema>

export const MediaRefSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  alt: z.string().min(1),
  credit: z.string().min(1),
  width: z.number().optional(),
  height: z.number().optional(),
})
export type MediaRef = z.infer<typeof MediaRefSchema>

export const AuthorSchema = z.object({
  id: z.string(),
  slug: z.string(),
  nameNe: z.string(),
  nameEn: z.string().optional(),
  bioNe: z.string().optional(),
  bioEn: z.string().optional(),
})
export type Author = z.infer<typeof AuthorSchema>

export const CategorySchema = z.object({
  id: z.string(),
  slug: z.string(),
  nameNe: z.string(),
  nameEn: z.string(),
  descriptionNe: z.string().optional(),
  descriptionEn: z.string().optional(),
})
export type Category = z.infer<typeof CategorySchema>

export const BodyBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('paragraph'), text: z.string() }),
  z.object({ type: z.literal('heading2'), text: z.string() }),
  z.object({ type: z.literal('heading3'), text: z.string() }),
  z.object({ type: z.literal('pullQuote'), text: z.string(), attribution: z.string().optional() }),
  z.object({ type: z.literal('list'), ordered: z.boolean(), items: z.array(z.string()) }),
  z.object({ type: z.literal('image'), media: MediaRefSchema, caption: z.string().optional() }),
])
export type BodyBlock = z.infer<typeof BodyBlockSchema>

export const CorrectionSchema = z.object({
  at: z.string().datetime(),
  noteNe: z.string(),
  noteEn: z.string().optional(),
})

export const ArticleSchema = z.object({
  id: z.string(),
  slug: z.string(),
  status: WorkflowStatusSchema,
  englishStatus: EnglishStatusSchema,
  titleNe: z.string(),
  titleEn: z.string().optional(),
  deckNe: z.string(),
  deckEn: z.string().optional(),
  bodyNe: z.array(BodyBlockSchema),
  bodyEn: z.array(BodyBlockSchema).optional(),
  categoryId: z.string(),
  authorIds: z.array(z.string()),
  tagSlugs: z.array(z.string()).default([]),
  province: z.string().optional(),
  hero: MediaRefSchema.optional(),
  isBreaking: z.boolean().default(false),
  editorialPriority: z.number().min(0).max(10).default(0),
  attribution: z.literal('original').default('original'),
  seoTitleNe: z.string().optional(),
  seoTitleEn: z.string().optional(),
  corrections: z.array(CorrectionSchema).default([]),
  publishedAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  packageId: z.string().optional(),
})
export type Article = z.infer<typeof ArticleSchema>

export type StoryCard = {
  id: string
  slug: string
  categorySlug: string
  title: string
  deck: string
  publishedAt?: string
  isBreaking: boolean
  hero?: MediaRef
  authorNames: string[]
  readTimeMinutes: number
  hasEnglish: boolean
}

import { z } from 'zod'

export const EditorBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('paragraph'), text: z.string() }),
  z.object({ type: z.literal('heading2'), text: z.string() }),
  z.object({ type: z.literal('heading3'), text: z.string() }),
  z.object({
    type: z.literal('pullQuote'),
    text: z.string(),
    attribution: z.string().optional(),
  }),
  z.object({
    type: z.literal('list'),
    ordered: z.boolean(),
    items: z.array(z.string()),
  }),
  z.object({
    type: z.literal('image'),
    media: z.object({
      id: z.string(),
      url: z.string(),
      alt: z.string(),
      credit: z.string(),
      width: z.number().optional(),
      height: z.number().optional(),
    }),
    caption: z.string().optional(),
  }),
])

export type EditorBlock = z.infer<typeof EditorBlockSchema>

const slugSchema = z
  .string()
  .max(96)
  .refine(
    (value) => !value || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),
    'Slug must be lowercase with hyphens',
  )

/**
 * Journalist drafts are deliberately permissive. A newsroom draft must be
 * saveable before it is publish-ready; submission/publish gates enforce the
 * complete editorial contract.
 */
export const ArticleWriteSchema = z.object({
  titleNe: z.string().max(120),
  titleEn: z.string().max(120).optional(),
  slug: slugSchema,
  deckNe: z.string(),
  deckEn: z.string().optional(),
  categoryId: z.string(),
  authorIds: z.array(z.string()),
  tagIds: z.array(z.string()).optional(),
  province: z.string().optional(),
  heroId: z.string().optional().nullable(),
  bodyNe: z.array(EditorBlockSchema).min(1),
  seoTitleNe: z.string().optional(),
  seoDescriptionNe: z.string().optional(),
})

export type ArticleWriteInput = z.infer<typeof ArticleWriteSchema>

export function slugifyLatin(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 96)
}

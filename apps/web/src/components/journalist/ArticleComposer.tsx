'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AdminCard } from '@/components/admin/primitives'
import { renderInlineMarkup, wrapSelection } from '@/components/journalist/inline-markup'
import type { EditorBlock } from '@/lib/journalist/schema'
import { slugifyLatin } from '@/lib/journalist/schema'

export type ComposerOption = { id: string; label: string; slug?: string }

export type ComposerInitial = {
  id?: string
  titleNe: string
  titleEn: string
  slug: string
  deckNe: string
  deckEn: string
  categoryId: string
  authorIds: string[]
  tagIds: string[]
  province: string
  heroId: string
  bodyNe: EditorBlock[]
  seoTitleNe: string
  seoDescriptionNe: string
  status?: string
}

const PROVINCES = [
  { value: '', label: '—' },
  { value: 'bagmati', label: 'Bagmati' },
  { value: 'madhesh', label: 'Madhesh' },
  { value: 'koshi', label: 'Koshi' },
  { value: 'gandaki', label: 'Gandaki' },
  { value: 'lumbini', label: 'Lumbini' },
  { value: 'karnali', label: 'Karnali' },
  { value: 'sudurpashchim', label: 'Sudurpashchim' },
]

function emptyParagraph(): EditorBlock {
  return { type: 'paragraph', text: '' }
}

export function ArticleComposer({
  initial,
  categories,
  authors,
  tags,
  media,
  confirmBeforeSubmit = true,
  compact = false,
}: {
  initial: ComposerInitial
  categories: ComposerOption[]
  authors: ComposerOption[]
  tags: ComposerOption[]
  media: Array<ComposerOption & { url?: string | null; alt?: string }>
  confirmBeforeSubmit?: boolean
  compact?: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [articleId, setArticleId] = useState(initial.id ?? '')
  const [status, setStatus] = useState(initial.status ?? 'draft')
  const [showPreview, setShowPreview] = useState(true)

  const [titleNe, setTitleNe] = useState(initial.titleNe)
  const [titleEn, setTitleEn] = useState(initial.titleEn)
  const [slug, setSlug] = useState(initial.slug)
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug))
  const [deckNe, setDeckNe] = useState(initial.deckNe)
  const [deckEn, setDeckEn] = useState(initial.deckEn)
  const [categoryId, setCategoryId] = useState(initial.categoryId || categories[0]?.id || '')
  const [authorIds, setAuthorIds] = useState<string[]>(
    initial.authorIds.length ? initial.authorIds : authors[0] ? [authors[0].id] : [],
  )
  const [tagIds, setTagIds] = useState<string[]>(initial.tagIds)
  const [province, setProvince] = useState(initial.province)
  const [heroId, setHeroId] = useState(initial.heroId)
  const [bodyNe, setBodyNe] = useState<EditorBlock[]>(
    initial.bodyNe.length ? initial.bodyNe : [emptyParagraph()],
  )
  const [seoTitleNe, setSeoTitleNe] = useState(initial.seoTitleNe)
  const [seoDescriptionNe, setSeoDescriptionNe] = useState(initial.seoDescriptionNe)
  const [gallery, setGallery] = useState(media)

  const [uploadAlt, setUploadAlt] = useState('')
  const [uploadCredit, setUploadCredit] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const payloadBody = useMemo(
    () => ({
      titleNe,
      titleEn: titleEn || undefined,
      slug,
      deckNe,
      deckEn: deckEn || undefined,
      categoryId,
      authorIds,
      tagIds,
      province: province || undefined,
      heroId: heroId || null,
      bodyNe,
      seoTitleNe: seoTitleNe || undefined,
      seoDescriptionNe: seoDescriptionNe || undefined,
    }),
    [
      titleNe,
      titleEn,
      slug,
      deckNe,
      deckEn,
      categoryId,
      authorIds,
      tagIds,
      province,
      heroId,
      bodyNe,
      seoTitleNe,
      seoDescriptionNe,
    ],
  )

  function updateBlock(index: number, next: EditorBlock) {
    setBodyNe((prev) => prev.map((b, i) => (i === index ? next : b)))
  }

  function insertBlock(type: EditorBlock['type']) {
    const block: EditorBlock =
      type === 'list'
        ? { type: 'list', ordered: false, items: [''] }
        : type === 'pullQuote'
          ? { type: 'pullQuote', text: '' }
          : type === 'image'
            ? {
                type: 'image',
                media: { id: '', url: '', alt: '', credit: '' },
                caption: '',
              }
            : type === 'heading2'
              ? { type: 'heading2', text: '' }
              : type === 'heading3'
                ? { type: 'heading3', text: '' }
                : { type: 'paragraph', text: '' }
    setBodyNe((prev) => [...prev, block])
  }

  function applyInline(index: number, kind: 'bold' | 'italic' | 'link') {
    const block = bodyNe[index]
    if (!block || !('text' in block)) return
    const el = document.getElementById(`block-text-${index}`) as HTMLTextAreaElement | null
    if (!el) return
    const start = el.selectionStart ?? 0
    const end = el.selectionEnd ?? 0
    let before = '**'
    let after = '**'
    if (kind === 'italic') {
      before = '_'
      after = '_'
    }
    if (kind === 'link') {
      before = '['
      after = '](https://)'
    }
    const { next, cursor } = wrapSelection(block.text, start, end, before, after)
    updateBlock(index, { ...block, text: next })
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(cursor, cursor)
    })
  }

  async function saveDraft(): Promise<string | null> {
    setError(null)
    setOk(null)
    const res = await fetch(
      articleId ? `/api/journalist/articles/${articleId}` : '/api/journalist/articles',
      {
        method: articleId ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payloadBody),
      },
    )
    const body = (await res.json().catch(() => ({}))) as {
      message?: string
      id?: string
      status?: string
    }
    if (!res.ok) {
      setError(body.message || 'Save failed')
      return null
    }
    const id = body.id || articleId
    if (body.id && !articleId) {
      setArticleId(body.id)
      router.replace(`/journalist/compose/${body.id}`)
    }
    if (body.status) setStatus(body.status)
    setOk('Draft saved')
    return id || null
  }

  function onSave() {
    startTransition(async () => {
      await saveDraft()
    })
  }

  function onSubmitReview() {
    if (confirmBeforeSubmit && !window.confirm('Submit this story for editorial review?')) return
    startTransition(async () => {
      const id = await saveDraft()
      if (!id) return
      const res = await fetch(`/api/journalist/articles/${id}/submit`, {
        method: 'POST',
        credentials: 'include',
      })
      const body = (await res.json().catch(() => ({}))) as { message?: string; status?: string }
      if (!res.ok) {
        setError(body.message || 'Submit failed')
        return
      }
      setStatus(body.status || 'in_review')
      setOk('Submitted for review')
      router.refresh()
    })
  }

  function onUpload() {
    startTransition(async () => {
      setError(null)
      const file = fileRef.current?.files?.[0]
      if (!file) {
        setError('Choose an image file first.')
        return
      }
      const form = new FormData()
      form.set('file', file)
      form.set('alt', uploadAlt)
      form.set('credit', uploadCredit)
      const res = await fetch('/api/journalist/media', {
        method: 'POST',
        credentials: 'include',
        body: form,
      })
      const body = (await res.json().catch(() => ({}))) as {
        message?: string
        id?: string
        url?: string
        alt?: string
        credit?: string
      }
      if (!res.ok) {
        setError(body.message || 'Upload failed')
        return
      }
      if (body.id) {
        setGallery((prev) => [
          {
            id: body.id!,
            label: body.alt || body.id!,
            url: body.url,
            alt: body.alt,
          },
          ...prev,
        ])
        setHeroId(body.id)
        setOk('Media uploaded')
        setUploadAlt('')
        setUploadCredit('')
        if (fileRef.current) fileRef.current.value = ''
      }
    })
  }

  const fieldClass =
    'mt-1.5 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-accent'
  const labelClass = 'block text-sm font-medium'

  return (
    <div className={`grid gap-8 ${showPreview ? 'xl:grid-cols-[1.15fr_0.85fr]' : ''}`}>
      <div className={compact ? 'space-y-4' : 'space-y-6'}>
        {error ? (
          <div role="alert" className="border border-holiday/40 bg-paper-elevated px-3 py-2 text-sm text-holiday">
            {error}
          </div>
        ) : null}
        {ok ? (
          <div role="status" className="border border-accent/30 bg-accent-muted px-3 py-2 text-sm">
            {ok} · status: <strong>{status}</strong>
          </div>
        ) : null}

        <AdminCard className="space-y-4">
          <label className={labelClass}>
            Headline (Nepali)
            <input
              className={fieldClass}
              value={titleNe}
              maxLength={120}
              onChange={(e) => {
                setTitleNe(e.target.value)
                if (!slugTouched && titleEn) setSlug(slugifyLatin(titleEn))
              }}
              required
            />
          </label>
          <label className={labelClass}>
            Headline (English, optional)
            <input
              className={fieldClass}
              value={titleEn}
              maxLength={120}
              onChange={(e) => {
                setTitleEn(e.target.value)
                if (!slugTouched) setSlug(slugifyLatin(e.target.value) || slug)
              }}
            />
          </label>
          <label className={labelClass}>
            Slug (Latin)
            <input
              className={fieldClass}
              value={slug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(slugifyLatin(e.target.value))
              }}
              required
            />
          </label>
          <label className={labelClass}>
            Deck (Nepali)
            <textarea
              className={`${fieldClass} min-h-[4.5rem]`}
              value={deckNe}
              onChange={(e) => setDeckNe(e.target.value)}
              required
            />
          </label>
          <label className={labelClass}>
            Deck (English, optional)
            <textarea
              className={`${fieldClass} min-h-[3.5rem]`}
              value={deckEn}
              onChange={(e) => setDeckEn(e.target.value)}
            />
          </label>
        </AdminCard>

        <AdminCard className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Category
              <select
                className={fieldClass}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Province
              <select
                className={fieldClass}
                value={province}
                onChange={(e) => setProvince(e.target.value)}
              >
                {PROVINCES.map((p) => (
                  <option key={p.value || 'none'} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <fieldset>
            <legend className="text-sm font-medium">Authors</legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {authors.map((a) => {
                const checked = authorIds.includes(a.id)
                return (
                  <label key={a.id} className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setAuthorIds((prev) =>
                          checked ? prev.filter((id) => id !== a.id) : [...prev, a.id],
                        )
                      }
                    />
                    {a.label}
                  </label>
                )
              })}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-medium">Tags</legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {tags.map((t) => {
                const checked = tagIds.includes(t.id)
                return (
                  <label key={t.id} className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setTagIds((prev) =>
                          checked ? prev.filter((id) => id !== t.id) : [...prev, t.id],
                        )
                      }
                    />
                    {t.label}
                  </label>
                )
              })}
            </div>
          </fieldset>
        </AdminCard>

        <AdminCard className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">Body (Nepali blocks)</p>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ['paragraph', '¶'],
                  ['heading2', 'H2'],
                  ['heading3', 'H3'],
                  ['pullQuote', 'Quote'],
                  ['list', 'List'],
                  ['image', 'Image'],
                ] as const
              ).map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  className="rounded-[var(--radius-control)] border border-line px-2 py-1 text-xs font-semibold hover:border-accent"
                  onClick={() => insertBlock(type)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {bodyNe.map((block, index) => (
              <div key={index} className="rounded-[var(--radius-control)] border border-line p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-stone">
                    {block.type}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {'text' in block ? (
                      <>
                        <button
                          type="button"
                          className="rounded border border-line px-1.5 py-0.5 text-xs font-bold"
                          onClick={() => applyInline(index, 'bold')}
                        >
                          B
                        </button>
                        <button
                          type="button"
                          className="rounded border border-line px-1.5 py-0.5 text-xs italic"
                          onClick={() => applyInline(index, 'italic')}
                        >
                          I
                        </button>
                        <button
                          type="button"
                          className="rounded border border-line px-1.5 py-0.5 text-xs"
                          onClick={() => applyInline(index, 'link')}
                        >
                          Link
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      className="rounded border border-line px-1.5 py-0.5 text-xs text-holiday"
                      onClick={() => setBodyNe((prev) => prev.filter((_, i) => i !== index))}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {block.type === 'paragraph' ||
                block.type === 'heading2' ||
                block.type === 'heading3' ||
                block.type === 'pullQuote' ? (
                  <textarea
                    id={`block-text-${index}`}
                    className={`${fieldClass} min-h-[5rem]`}
                    value={block.text}
                    onChange={(e) => updateBlock(index, { ...block, text: e.target.value })}
                    placeholder={
                      block.type === 'pullQuote' ? 'Quote text…' : 'Write in Devanagari or Latin…'
                    }
                  />
                ) : null}
                {block.type === 'pullQuote' ? (
                  <input
                    className={`${fieldClass} mt-2`}
                    placeholder="Attribution (optional)"
                    value={block.attribution ?? ''}
                    onChange={(e) =>
                      updateBlock(index, { ...block, attribution: e.target.value || undefined })
                    }
                  />
                ) : null}
                {block.type === 'list' ? (
                  <div className="space-y-2">
                    <label className="inline-flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={block.ordered}
                        onChange={(e) => updateBlock(index, { ...block, ordered: e.target.checked })}
                      />
                      Ordered list
                    </label>
                    <textarea
                      className={`${fieldClass} min-h-[5rem]`}
                      value={block.items.join('\n')}
                      onChange={(e) =>
                        updateBlock(index, {
                          ...block,
                          items: e.target.value.split('\n'),
                        })
                      }
                      placeholder="One item per line"
                    />
                  </div>
                ) : null}
                {block.type === 'image' ? (
                  <div className="space-y-2">
                    <select
                      className={fieldClass}
                      value={block.media.id}
                      onChange={(e) => {
                        const item = gallery.find((g) => g.id === e.target.value)
                        if (!item) return
                        updateBlock(index, {
                          type: 'image',
                          media: {
                            id: item.id,
                            url: item.url || '',
                            alt: item.alt || item.label,
                            credit: item.alt || 'Staff',
                          },
                          caption: block.caption,
                        })
                      }}
                    >
                      <option value="">Select from gallery…</option>
                      {gallery.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                    <input
                      className={fieldClass}
                      placeholder="Caption (optional)"
                      value={block.caption ?? ''}
                      onChange={(e) =>
                        updateBlock(index, { ...block, caption: e.target.value || undefined })
                      }
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard className="space-y-3">
          <p className="text-sm font-semibold">Media gallery / hero</p>
          <label className={labelClass}>
            Hero image
            <select className={fieldClass} value={heroId} onChange={(e) => setHeroId(e.target.value)}>
              <option value="">None</option>
              {gallery.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="text-sm"
            />
            <input
              className={fieldClass}
              placeholder="Alt text"
              value={uploadAlt}
              onChange={(e) => setUploadAlt(e.target.value)}
            />
            <input
              className={fieldClass}
              placeholder="Credit"
              value={uploadCredit}
              onChange={(e) => setUploadCredit(e.target.value)}
            />
            <button
              type="button"
              disabled={pending}
              onClick={onUpload}
              className="rounded-[var(--radius-control)] border border-line px-3 py-2 text-sm font-semibold hover:border-accent"
            >
              Upload media
            </button>
          </div>
        </AdminCard>

        <AdminCard className="space-y-3">
          <p className="text-sm font-semibold">SEO (optional)</p>
          <input
            className={fieldClass}
            placeholder="SEO title (Nepali)"
            value={seoTitleNe}
            onChange={(e) => setSeoTitleNe(e.target.value)}
          />
          <textarea
            className={`${fieldClass} min-h-[3.5rem]`}
            placeholder="SEO description (Nepali)"
            value={seoDescriptionNe}
            onChange={(e) => setSeoDescriptionNe(e.target.value)}
          />
        </AdminCard>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={onSave}
            className="rounded-[var(--radius-control)] bg-accent px-4 py-2 text-sm font-semibold text-accent-fg disabled:opacity-60"
          >
            {pending ? 'Saving…' : 'Save draft'}
          </button>
          <button
            type="button"
            disabled={pending || status === 'in_review'}
            onClick={onSubmitReview}
            className="rounded-[var(--radius-control)] border border-line px-4 py-2 text-sm font-semibold hover:border-accent disabled:opacity-60"
          >
            Submit for review
          </button>
          <button
            type="button"
            className="rounded-[var(--radius-control)] border border-line px-4 py-2 text-sm font-medium"
            onClick={() => setShowPreview((v) => !v)}
          >
            {showPreview ? 'Hide preview' : 'Show preview'}
          </button>
          {status === 'published' && slug && categoryId ? (
            <a
              href={`/ne/${categories.find((c) => c.id === categoryId)?.slug ?? 'samachar'}/${slug}`}
              className="rounded-[var(--radius-control)] border border-line px-4 py-2 text-sm font-medium"
              target="_blank"
              rel="noreferrer"
            >
              Reader preview
            </a>
          ) : null}
        </div>
      </div>

      {showPreview ? (
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <AdminCard>
            <p className="text-xs font-bold uppercase tracking-wide text-stone">Preview</p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em]">{titleNe || 'शीर्षक'}</h2>
            {deckNe ? <p className="mt-2 text-sm text-stone">{deckNe}</p> : null}
            <div className="mt-6 space-y-4 text-base leading-relaxed">
              {bodyNe.map((block, i) => {
                switch (block.type) {
                  case 'paragraph':
                    return <p key={i}>{renderInlineMarkup(block.text)}</p>
                  case 'heading2':
                    return (
                      <h3 key={i} className="text-xl font-semibold">
                        {renderInlineMarkup(block.text)}
                      </h3>
                    )
                  case 'heading3':
                    return (
                      <h4 key={i} className="text-lg font-semibold">
                        {renderInlineMarkup(block.text)}
                      </h4>
                    )
                  case 'pullQuote':
                    return (
                      <blockquote key={i} className="border-l-2 border-accent pl-3 text-stone">
                        {renderInlineMarkup(block.text)}
                      </blockquote>
                    )
                  case 'list':
                    return block.ordered ? (
                      <ol key={i} className="list-decimal space-y-1 pl-5">
                        {block.items.map((item, j) => (
                          <li key={j}>{renderInlineMarkup(item)}</li>
                        ))}
                      </ol>
                    ) : (
                      <ul key={i} className="list-disc space-y-1 pl-5">
                        {block.items.map((item, j) => (
                          <li key={j}>{renderInlineMarkup(item)}</li>
                        ))}
                      </ul>
                    )
                  case 'image':
                    return block.media.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <figure key={i}>
                        <img src={block.media.url} alt={block.media.alt} className="w-full" />
                        {block.caption ? (
                          <figcaption className="mt-1 text-xs text-stone">{block.caption}</figcaption>
                        ) : null}
                      </figure>
                    ) : (
                      <p key={i} className="text-xs text-stone">
                        [image]
                      </p>
                    )
                  default: {
                    const _exhaustive: never = block
                    return _exhaustive
                  }
                }
              })}
            </div>
          </AdminCard>
        </aside>
      ) : null}
    </div>
  )
}

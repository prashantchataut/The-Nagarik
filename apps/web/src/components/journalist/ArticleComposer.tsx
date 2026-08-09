'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowDown,
  ArrowUp,
  CheckCircle,
  Eye,
  FloppyDisk,
  ImageSquare,
  LinkSimple,
  ListBullets,
  PaperPlaneTilt,
  Plus,
  Quotes,
  SpinnerGap,
  TextB,
  TextH,
  TextItalic,
  Trash,
  UploadSimple,
  WarningCircle,
} from '@phosphor-icons/react'
import { renderInlineMarkup, wrapSelection } from '@/components/journalist/inline-markup'
import type { EditorBlock } from '@/lib/journalist/schema'
import { slugifyLatin } from '@/lib/journalist/schema'

export type ComposerOption = { id: string; label: string; slug?: string }
export type ComposerMediaOption = ComposerOption & {
  url?: string | null
  alt?: string
  credit?: string
}

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
  { value: '', label: 'प्रदेश लागू हुँदैन' },
  { value: 'koshi', label: 'कोशी' },
  { value: 'madhesh', label: 'मधेश' },
  { value: 'bagmati', label: 'बागमती' },
  { value: 'gandaki', label: 'गण्डकी' },
  { value: 'lumbini', label: 'लुम्बिनी' },
  { value: 'karnali', label: 'कर्णाली' },
  { value: 'sudurpashchim', label: 'सुदूरपश्चिम' },
]

const STATUS_LABELS: Record<string, string> = {
  draft: 'ड्राफ्ट',
  in_review: 'सम्पादकीय समीक्षामा',
  scheduled: 'तालिकाबद्ध',
  published: 'प्रकाशित',
  retracted: 'फिर्ता',
}

const BLOCK_LABELS: Record<EditorBlock['type'], string> = {
  paragraph: 'अनुच्छेद',
  heading2: 'उपशीर्षक',
  heading3: 'सानो उपशीर्षक',
  pullQuote: 'उद्धरण',
  list: 'सूची',
  image: 'तस्बिर',
}

function emptyParagraph(): EditorBlock {
  return { type: 'paragraph', text: '' }
}

function blockReady(block: EditorBlock): boolean {
  if (block.type === 'image') return Boolean(block.media.id && block.media.alt && block.media.credit)
  if (block.type === 'list') return block.items.some((item) => item.trim().length > 0)
  return block.text.trim().length > 0
}

function StatusMark({ status }: { status: string }) {
  const tone =
    status === 'published'
      ? 'text-success'
      : status === 'in_review' || status === 'scheduled'
        ? 'text-warning'
        : status === 'retracted'
          ? 'text-danger'
          : 'text-stone'
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${tone}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {STATUS_LABELS[status] ?? status}
    </span>
  )
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
  media: ComposerMediaOption[]
  confirmBeforeSubmit?: boolean
  compact?: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [articleId, setArticleId] = useState(initial.id ?? '')
  const [status, setStatus] = useState(initial.status ?? 'draft')
  const [showPreview, setShowPreview] = useState(false)
  const [showEnglish, setShowEnglish] = useState(Boolean(initial.titleEn || initial.deckEn))
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  const [titleNe, setTitleNe] = useState(initial.titleNe)
  const [titleEn, setTitleEn] = useState(initial.titleEn)
  const [slug, setSlug] = useState(initial.slug)
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug))
  const [deckNe, setDeckNe] = useState(initial.deckNe)
  const [deckEn, setDeckEn] = useState(initial.deckEn)
  const [categoryId, setCategoryId] = useState(initial.categoryId || '')
  const [authorIds, setAuthorIds] = useState<string[]>(initial.authorIds)
  const [tagIds, setTagIds] = useState<string[]>(initial.tagIds)
  const [province, setProvince] = useState(initial.province)
  const [heroId, setHeroId] = useState(initial.heroId)
  const [bodyNe, setBodyNe] = useState<EditorBlock[]>(initial.bodyNe.length ? initial.bodyNe : [emptyParagraph()])
  const [seoTitleNe, setSeoTitleNe] = useState(initial.seoTitleNe)
  const [seoDescriptionNe, setSeoDescriptionNe] = useState(initial.seoDescriptionNe)
  const [gallery, setGallery] = useState<ComposerMediaOption[]>(media)
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

  const snapshot = useMemo(() => JSON.stringify(payloadBody), [payloadBody])
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null)
  const dirty = savedSnapshot !== null && savedSnapshot !== snapshot

  useEffect(() => {
    if (savedSnapshot === null) setSavedSnapshot(snapshot)
  }, [savedSnapshot, snapshot])

  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const readinessIssues = useMemo(() => {
    const issues: string[] = []
    if (!titleNe.trim()) issues.push('नेपाली शीर्षक थप्नुहोस्।')
    if (!deckNe.trim()) issues.push('समाचारको छोटो सार थप्नुहोस्।')
    if (!slug.trim()) issues.push('URL slug थप्नुहोस्।')
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) issues.push('Slug सानो अक्षर, अंक र hyphen मात्र हुनुपर्छ।')
    if (!categoryId) issues.push('समाचारको श्रेणी छान्नुहोस्।')
    if (!authorIds.length) issues.push('कम्तीमा एक लेखक छान्नुहोस्।')
    const invalidBlocks = bodyNe.reduce<number[]>((out, block, index) => {
      if (!blockReady(block)) out.push(index + 1)
      return out
    }, [])
    if (invalidBlocks.length) issues.push(`सामग्री ब्लक ${invalidBlocks.join(', ')} पूरा गर्नुहोस्।`)
    return issues
  }, [authorIds.length, bodyNe, categoryId, deckNe, slug, titleNe])

  const hero = gallery.find((item) => item.id === heroId)

  function toggleChoice(id: string, selected: string[], setSelected: (next: string[]) => void) {
    setSelected(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id])
  }

  function updateBlock(index: number, next: EditorBlock) {
    setBodyNe((previous) => previous.map((block, blockIndex) => (blockIndex === index ? next : block)))
  }

  function moveBlock(index: number, direction: -1 | 1) {
    setBodyNe((previous) => {
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= previous.length) return previous
      const next = [...previous]
      const [item] = next.splice(index, 1)
      next.splice(nextIndex, 0, item)
      return next
    })
  }

  function removeBlock(index: number) {
    setBodyNe((previous) => {
      const next = previous.filter((_, blockIndex) => blockIndex !== index)
      return next.length ? next : [emptyParagraph()]
    })
  }

  function insertBlock(type: EditorBlock['type']) {
    const block: EditorBlock =
      type === 'list'
        ? { type: 'list', ordered: false, items: [''] }
        : type === 'pullQuote'
          ? { type: 'pullQuote', text: '' }
          : type === 'image'
            ? { type: 'image', media: { id: '', url: '', alt: '', credit: '' }, caption: '' }
            : type === 'heading2'
              ? { type: 'heading2', text: '' }
              : type === 'heading3'
                ? { type: 'heading3', text: '' }
                : { type: 'paragraph', text: '' }
    setBodyNe((previous) => [...previous, block])
  }

  function applyInline(index: number, kind: 'bold' | 'italic' | 'link') {
    const block = bodyNe[index]
    if (!block || !('text' in block)) return
    const element = document.getElementById(`block-text-${index}`) as HTMLTextAreaElement | null
    if (!element) return
    const start = element.selectionStart ?? 0
    const end = element.selectionEnd ?? 0
    const wrappers =
      kind === 'italic'
        ? { before: '_', after: '_' }
        : kind === 'link'
          ? { before: '[', after: '](https://)' }
          : { before: '**', after: '**' }
    const { next, cursor } = wrapSelection(block.text, start, end, wrappers.before, wrappers.after)
    updateBlock(index, { ...block, text: next })
    requestAnimationFrame(() => {
      element.focus()
      element.setSelectionRange(cursor, cursor)
    })
  }

  async function saveDraft(): Promise<string | null> {
    setError(null)
    setNotice(null)
    try {
      const response = await fetch(articleId ? `/api/journalist/articles/${articleId}` : '/api/journalist/articles', {
        method: articleId ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payloadBody),
      })
      const body = (await response.json().catch(() => ({}))) as { message?: string; id?: string; status?: string }
      if (!response.ok) {
        setError(body.message || 'ड्राफ्ट सुरक्षित गर्न सकिएन।')
        return null
      }
      const id = body.id || articleId
      if (body.id && !articleId) {
        setArticleId(body.id)
        router.replace(`/journalist/compose/${body.id}`)
      }
      if (body.status) setStatus(body.status)
      setSavedSnapshot(JSON.stringify(payloadBody))
      setLastSavedAt(new Date())
      setNotice('ड्राफ्ट सुरक्षित भयो।')
      return id || null
    } catch {
      setError('नेटवर्क समस्याका कारण ड्राफ्ट सुरक्षित गर्न सकिएन। पुनः प्रयास गर्नुहोस्।')
      return null
    }
  }

  function onSave() {
    startTransition(async () => {
      await saveDraft()
    })
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        if (!pending) onSave()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  function requestSubmit() {
    setError(null)
    setNotice(null)
    if (readinessIssues.length) {
      setError('समीक्षामा पठाउनुअघि आवश्यक विवरण पूरा गर्नुहोस्।')
      return
    }
    if (confirmBeforeSubmit) {
      setConfirmSubmit(true)
      return
    }
    submitForReview()
  }

  function submitForReview() {
    setConfirmSubmit(false)
    startTransition(async () => {
      const id = await saveDraft()
      if (!id) return
      try {
        const response = await fetch(`/api/journalist/articles/${id}/submit`, {
          method: 'POST',
          credentials: 'include',
        })
        const body = (await response.json().catch(() => ({}))) as { message?: string; status?: string }
        if (!response.ok) {
          setError(body.message || 'सम्पादकीय समीक्षामा पठाउन सकिएन।')
          return
        }
        setStatus(body.status || 'in_review')
        setNotice('लेख सम्पादकीय समीक्षामा पठाइयो।')
        router.refresh()
      } catch {
        setError('नेटवर्क समस्याका कारण समीक्षामा पठाउन सकिएन।')
      }
    })
  }

  function onUpload() {
    startTransition(async () => {
      setError(null)
      setNotice(null)
      const file = fileRef.current?.files?.[0]
      if (!file) {
        setError('पहिले तस्बिर फाइल छान्नुहोस्।')
        return
      }
      if (!uploadAlt.trim() || !uploadCredit.trim()) {
        setError('तस्बिर अपलोड गर्न alt text र credit दुवै आवश्यक छन्।')
        return
      }
      const form = new FormData()
      form.set('file', file)
      form.set('alt', uploadAlt.trim())
      form.set('credit', uploadCredit.trim())
      try {
        const response = await fetch('/api/journalist/media', { method: 'POST', credentials: 'include', body: form })
        const body = (await response.json().catch(() => ({}))) as {
          message?: string
          id?: string
          url?: string
          alt?: string
          credit?: string
        }
        if (!response.ok) {
          setError(body.message || 'तस्बिर अपलोड गर्न सकिएन।')
          return
        }
        if (body.id) {
          const nextMedia: ComposerMediaOption = {
            id: body.id,
            label: body.alt || body.id,
            url: body.url,
            alt: body.alt,
            credit: body.credit,
          }
          setGallery((previous) => [nextMedia, ...previous])
          setHeroId(body.id)
          setNotice('तस्बिर अपलोड भयो र hero image का रूपमा छानियो।')
          setUploadAlt('')
          setUploadCredit('')
          if (fileRef.current) fileRef.current.value = ''
        }
      } catch {
        setError('नेटवर्क समस्याका कारण तस्बिर अपलोड गर्न सकिएन।')
      }
    })
  }

  const textareaSpacing = compact ? 'min-h-[7rem]' : 'min-h-[10rem]'
  const blockGap = compact ? 'space-y-3' : 'space-y-5'

  return (
    <div className="min-w-0">
      <div className="sticky top-16 z-30 -mx-4 border-y border-line bg-paper-elevated px-4 py-3 sm:-mx-5 sm:px-5 md:-mx-7 md:px-7 xl:-mx-9 xl:px-9">
        <div className="mx-auto flex max-w-[1220px] flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <StatusMark status={status} />
              <span className="text-xs text-stone" aria-live="polite">
                {pending ? 'काम भइरहेको छ…' : dirty ? 'सुरक्षित नभएका परिवर्तन छन्' : lastSavedAt ? `सुरक्षित · ${lastSavedAt.toLocaleTimeString('ne-NP', { hour: '2-digit', minute: '2-digit' })}` : 'सबै परिवर्तन सुरक्षित छन्'}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview((value) => !value)}
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border border-line bg-paper px-3 text-sm font-semibold hover:border-accent hover:text-accent"
              aria-pressed={showPreview}
            >
              <Eye size={18} aria-hidden="true" />
              {showPreview ? 'पूर्वावलोकन बन्द' : 'पूर्वावलोकन'}
            </button>
            <button
              type="button"
              disabled={pending || !dirty}
              onClick={onSave}
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border border-line bg-paper px-3 text-sm font-semibold hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? <SpinnerGap size={18} className="animate-spin" aria-hidden="true" /> : <FloppyDisk size={18} aria-hidden="true" />}
              ड्राफ्ट सुरक्षित गर्नुहोस्
            </button>
            <button
              type="button"
              disabled={pending || status === 'in_review'}
              onClick={requestSubmit}
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] accent-solid px-4 text-sm font-bold  hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-55"
            >
              <PaperPlaneTilt size={18} weight="bold" aria-hidden="true" />
              समीक्षामा पठाउनुहोस्
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-[1220px]">
        {error ? (
          <div role="alert" className="mb-4 flex items-start gap-2 border border-danger/35 bg-danger-muted px-4 py-3 text-sm text-ink">
            <WarningCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}
        {notice ? (
          <div role="status" className="mb-4 flex items-start gap-2 border border-success/30 bg-success-muted px-4 py-3 text-sm text-ink">
            <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
            <span>{notice}</span>
          </div>
        ) : null}

        {confirmSubmit ? (
          <section className="mb-5 border border-warning/35 bg-warning-muted p-4" aria-labelledby="submit-confirm-title">
            <h2 id="submit-confirm-title" className="font-bold">सम्पादकीय समीक्षामा पठाउने?</h2>
            <p className="mt-1 max-w-[66ch] text-sm leading-6 text-stone">
              पठाएपछि यो लेख सम्पादकीय कतारमा जान्छ। आवश्यक परे समीक्षकले सुधारका लागि फिर्ता पठाउन सक्छन्।
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={submitForReview} className="min-h-11 rounded-[var(--radius-control)] accent-solid px-4 text-sm font-bold ">
                हो, पठाउनुहोस्
              </button>
              <button type="button" onClick={() => setConfirmSubmit(false)} className="min-h-11 rounded-[var(--radius-control)] border border-line bg-paper px-4 text-sm font-semibold">
                अझै सम्पादन गर्छु
              </button>
            </div>
          </section>
        ) : null}

        <div className={`grid min-w-0 gap-7 ${showPreview ? '2xl:grid-cols-[minmax(0,760px)_minmax(300px,1fr)]' : 'xl:grid-cols-[minmax(0,1fr)_320px]'}`}>
          <div className="min-w-0 space-y-7">
            <section className="newsroom-surface bg-paper-elevated p-4 sm:p-6" aria-labelledby="story-basics-title">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">लेख</p>
                  <h2 id="story-basics-title" className="mt-1 text-lg font-bold">मुख्य विवरण</h2>
                </div>
                <button type="button" onClick={() => setShowEnglish((value) => !value)} className="min-h-11 text-sm font-semibold text-stone hover:text-accent" aria-expanded={showEnglish}>
                  {showEnglish ? 'अंग्रेजी फिल्ड लुकाउनुहोस्' : 'अंग्रेजी फिल्ड थप्नुहोस्'}
                </button>
              </div>

              <div className="mt-5 space-y-5">
                <label className="block">
                  <span className="text-sm font-bold">नेपाली शीर्षक</span>
                  <span className="ml-2 text-xs text-stone">{titleNe.length}/120</span>
                  <textarea
                    className="newsroom-field mt-2 min-h-[5.5rem] resize-y text-[1.55rem] font-bold leading-[1.45] tracking-[-0.02em] sm:text-[1.8rem]"
                    value={titleNe}
                    maxLength={120}
                    onChange={(event) => setTitleNe(event.target.value)}
                    placeholder="समाचारको स्पष्ट, तथ्यगत शीर्षक"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-bold">छोटो सार</span>
                  <textarea
                    className="newsroom-field mt-2 min-h-[5.5rem] resize-y text-base leading-7"
                    value={deckNe}
                    onChange={(event) => setDeckNe(event.target.value)}
                    placeholder="पाठकले यो समाचार किन खोल्ने भन्ने स्पष्ट हुने एक-दुई वाक्य"
                  />
                </label>

                {showEnglish ? (
                  <div className="space-y-4 border-t border-line pt-5">
                    <label className="block">
                      <span className="text-sm font-semibold">अंग्रेजी शीर्षक</span>
                      <input
                        className="newsroom-field mt-2"
                        value={titleEn}
                        maxLength={120}
                        onChange={(event) => {
                          const next = event.target.value
                          setTitleEn(next)
                          if (!slugTouched) setSlug(slugifyLatin(next))
                        }}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold">अंग्रेजी छोटो सार</span>
                      <textarea className="newsroom-field mt-2 min-h-24 resize-y" value={deckEn} onChange={(event) => setDeckEn(event.target.value)} />
                    </label>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="newsroom-surface bg-paper-elevated p-4 sm:p-6" aria-labelledby="body-editor-title">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">मुख्य सामग्री</p>
                  <h2 id="body-editor-title" className="mt-1 text-lg font-bold">समाचार लेख्नुहोस्</h2>
                  <p className="mt-1 text-xs leading-5 text-stone">Ctrl/Cmd + S ले मस्यौदा सुरक्षित गर्छ। सामग्री ब्लकको क्रम माथि वा तल सार्न सकिन्छ।</p>
                </div>
                <div className="flex flex-wrap gap-1.5" aria-label="नयाँ सामग्री ब्लक थप्नुहोस्">
                  {([
                    ['paragraph', 'अनुच्छेद', Plus],
                    ['heading2', 'उपशीर्षक', TextH],
                    ['pullQuote', 'उद्धरण', Quotes],
                    ['list', 'सूची', ListBullets],
                    ['image', 'तस्बिर', ImageSquare],
                  ] as const).map(([type, label, Icon]) => (
                    <button key={type} type="button" onClick={() => insertBlock(type)} className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-control)] border border-line bg-paper px-2.5 text-xs font-semibold hover:border-accent hover:text-accent">
                      <Icon size={16} aria-hidden="true" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`mt-5 ${blockGap}`}>
                {bodyNe.map((block, index) => (
                  <article key={`${index}-${block.type}`} className="border border-line bg-paper p-3 sm:p-4" aria-label={`${BLOCK_LABELS[block.type]} सामग्री ${index + 1}`}>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone">{index + 1}</span>
                        <span className="text-xs font-semibold">{BLOCK_LABELS[block.type]}</span>
                        {!blockReady(block) ? <span className="text-xs font-semibold text-warning">अधुरो</span> : null}
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => moveBlock(index, -1)} disabled={index === 0} className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] hover:bg-paper-elevated disabled:opacity-30" aria-label={`Block ${index + 1} माथि सार्नुहोस्`}><ArrowUp size={17} aria-hidden="true" /></button>
                        <button type="button" onClick={() => moveBlock(index, 1)} disabled={index === bodyNe.length - 1} className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] hover:bg-paper-elevated disabled:opacity-30" aria-label={`Block ${index + 1} तल सार्नुहोस्`}><ArrowDown size={17} aria-hidden="true" /></button>
                        <button type="button" onClick={() => removeBlock(index)} className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] text-stone hover:bg-danger-muted hover:text-danger" aria-label={`Block ${index + 1} हटाउनुहोस्`}><Trash size={17} aria-hidden="true" /></button>
                      </div>
                    </div>

                    {'text' in block ? (
                      <>
                        <div className="mb-2 flex gap-1" aria-label="Inline formatting">
                          <button type="button" onClick={() => applyInline(index, 'bold')} className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] border border-line hover:border-accent" aria-label="Bold"><TextB size={16} weight="bold" aria-hidden="true" /></button>
                          <button type="button" onClick={() => applyInline(index, 'italic')} className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] border border-line hover:border-accent" aria-label="Italic"><TextItalic size={16} aria-hidden="true" /></button>
                          <button type="button" onClick={() => applyInline(index, 'link')} className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] border border-line hover:border-accent" aria-label="Link"><LinkSimple size={16} aria-hidden="true" /></button>
                        </div>
                        <textarea
                          id={`block-text-${index}`}
                          className={`newsroom-field resize-y ${block.type === 'heading2' ? 'min-h-20 text-xl font-bold' : block.type === 'heading3' ? 'min-h-20 text-lg font-bold' : block.type === 'pullQuote' ? 'min-h-24 text-lg leading-8' : `${textareaSpacing} text-base leading-8`}`}
                          value={block.text}
                          onChange={(event) => updateBlock(index, { ...block, text: event.target.value })}
                          placeholder={block.type === 'pullQuote' ? 'उद्धरण…' : block.type === 'heading2' || block.type === 'heading3' ? 'उपशीर्षक…' : 'समाचारको अर्को अनुच्छेद…'}
                        />
                        {block.type === 'pullQuote' ? (
                          <label className="mt-3 block text-xs font-semibold text-stone">
                            स्रोत / श्रेय (वैकल्पिक)
                            <input className="newsroom-field mt-1.5" value={block.attribution ?? ''} onChange={(event) => updateBlock(index, { ...block, attribution: event.target.value || undefined })} />
                          </label>
                        ) : null}
                      </>
                    ) : null}

                    {block.type === 'list' ? (
                      <div className="space-y-3">
                        <label className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold">
                          <input type="checkbox" checked={block.ordered} onChange={(event) => updateBlock(index, { ...block, ordered: event.target.checked })} />
                          क्रमाङ्कित सूची
                        </label>
                        <label className="block text-xs font-semibold text-stone">
                          प्रत्येक लाइनमा एउटा बुँदा
                          <textarea className="newsroom-field mt-1.5 min-h-28 resize-y" value={block.items.join('\n')} onChange={(event) => updateBlock(index, { ...block, items: event.target.value.split('\n') })} />
                        </label>
                      </div>
                    ) : null}

                    {block.type === 'image' ? (
                      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                        <label className="block text-xs font-semibold text-stone">
                          तस्बिर भण्डार
                          <select
                            className="newsroom-field mt-1.5"
                            value={block.media.id}
                            onChange={(event) => {
                              const item = gallery.find((candidate) => candidate.id === event.target.value)
                              if (!item) return
                              updateBlock(index, {
                                type: 'image',
                                media: { id: item.id, url: item.url || '', alt: item.alt || item.label, credit: item.credit || '' },
                                caption: block.caption,
                              })
                            }}
                          >
                            <option value="">तस्बिर छान्नुहोस्…</option>
                            {gallery.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                          </select>
                        </label>
                        <label className="block text-xs font-semibold text-stone">
                          तस्बिर विवरण (वैकल्पिक)
                          <input className="newsroom-field mt-1.5" value={block.caption ?? ''} onChange={(event) => updateBlock(index, { ...block, caption: event.target.value || undefined })} />
                        </label>
                        {block.media.id ? (
                          <div className="md:col-span-2 text-xs leading-5 text-stone">
                            <strong className="text-ink">Alt:</strong> {block.media.alt || '—'} · <strong className="text-ink">Credit:</strong> {block.media.credit || '—'}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          </div>

          {showPreview ? (
            <aside className="min-w-0 2xl:sticky 2xl:top-[8.75rem] 2xl:self-start" aria-label="लेख preview">
              <div className="newsroom-surface overflow-hidden bg-paper-elevated">
                <div className="border-b border-line px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-stone">Reader preview</p>
                </div>
                {hero?.url ? (
                  <figure>
                    <Image src={hero.url} alt={hero.alt || ''} width={960} height={540} sizes="(max-width: 1536px) 100vw, 560px" className="aspect-video w-full object-cover" unoptimized />
                    {hero.credit ? <figcaption className="border-b border-line px-4 py-2 text-xs text-stone">तस्बिर: {hero.credit}</figcaption> : null}
                  </figure>
                ) : null}
                <div className="px-4 py-5 sm:px-5">
                  <p className="text-xs font-bold text-accent">{categories.find((item) => item.id === categoryId)?.label || 'श्रेणी'}</p>
                  <h2 className="mt-2 text-[1.9rem] font-bold leading-[1.35] tracking-[-0.025em]">{titleNe || 'समाचारको शीर्षक'}</h2>
                  {deckNe ? <p className="mt-3 text-base leading-7 text-stone">{deckNe}</p> : null}
                  <div className="mt-6 space-y-5 text-[1.03rem] leading-[1.8]">
                    {bodyNe.map((block, index) => {
                      switch (block.type) {
                        case 'paragraph':
                          return block.text ? <p key={index}>{renderInlineMarkup(block.text)}</p> : null
                        case 'heading2':
                          return block.text ? <h3 key={index} className="pt-2 text-2xl font-bold leading-[1.45]">{renderInlineMarkup(block.text)}</h3> : null
                        case 'heading3':
                          return block.text ? <h4 key={index} className="pt-1 text-xl font-bold leading-[1.5]">{renderInlineMarkup(block.text)}</h4> : null
                        case 'pullQuote':
                          return block.text ? (
                            <blockquote key={index} className="my-7 border-y border-line py-5 text-xl font-semibold leading-[1.7]">
                              <p>{renderInlineMarkup(block.text)}</p>
                              {block.attribution ? <footer className="mt-2 text-sm font-medium text-stone">— {block.attribution}</footer> : null}
                            </blockquote>
                          ) : null
                        case 'list':
                          return block.ordered ? (
                            <ol key={index} className="list-decimal space-y-2 pl-6">{block.items.filter(Boolean).map((item, itemIndex) => <li key={itemIndex}>{renderInlineMarkup(item)}</li>)}</ol>
                          ) : (
                            <ul key={index} className="list-disc space-y-2 pl-6">{block.items.filter(Boolean).map((item, itemIndex) => <li key={itemIndex}>{renderInlineMarkup(item)}</li>)}</ul>
                          )
                        case 'image':
                          return block.media.url ? (
                            <figure key={index} className="my-6">
                              <Image src={block.media.url} alt={block.media.alt} width={block.media.width || 960} height={block.media.height || 540} sizes="(max-width: 1536px) 100vw, 560px" className="h-auto w-full object-cover" unoptimized />
                              {(block.caption || block.media.credit) ? <figcaption className="mt-2 text-xs leading-5 text-stone">{block.caption ? `${block.caption} · ` : ''}{block.media.credit ? `तस्बिर: ${block.media.credit}` : ''}</figcaption> : null}
                            </figure>
                          ) : null
                        default: {
                          const exhaustive: never = block
                          return exhaustive
                        }
                      }
                    })}
                  </div>
                </div>
              </div>
            </aside>
          ) : (
            <aside className="min-w-0 space-y-5 xl:sticky xl:top-[8.75rem] xl:self-start" aria-label="प्रकाशन विवरण">
              <section className="newsroom-surface bg-paper-elevated p-4" aria-labelledby="publishing-title">
                <h2 id="publishing-title" className="text-sm font-bold">प्रकाशन विवरण</h2>
                <div className="mt-4 space-y-4">
                  <label className="block text-xs font-semibold text-stone">
                    श्रेणी
                    <select className="newsroom-field mt-1.5" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                      <option value="">श्रेणी छान्नुहोस्</option>
                      {categories.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-stone">
                    प्रदेश
                    <select className="newsroom-field mt-1.5" value={province} onChange={(event) => setProvince(event.target.value)}>
                      {PROVINCES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-stone">
                    URL slug
                    <input
                      className="newsroom-field mt-1.5 font-mono text-xs"
                      value={slug}
                      onChange={(event) => { setSlugTouched(true); setSlug(slugifyLatin(event.target.value)) }}
                      placeholder="example-news-headline"
                      spellCheck={false}
                    />
                  </label>
                </div>
              </section>

              <section className="newsroom-surface bg-paper-elevated p-4" aria-labelledby="author-title">
                <h2 id="author-title" className="text-sm font-bold">लेखक</h2>
                <div className="mt-3 max-h-44 space-y-1 overflow-y-auto pr-1">
                  {authors.map((item) => (
                    <label key={item.id} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-control)] px-2 text-sm hover:bg-paper">
                      <input type="checkbox" checked={authorIds.includes(item.id)} onChange={() => toggleChoice(item.id, authorIds, setAuthorIds)} />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </section>

              {tags.length ? (
                <section className="newsroom-surface bg-paper-elevated p-4" aria-labelledby="tags-title">
                  <h2 id="tags-title" className="text-sm font-bold">ट्याग</h2>
                  <div className="mt-3 max-h-40 space-y-1 overflow-y-auto pr-1">
                    {tags.map((item) => (
                      <label key={item.id} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-control)] px-2 text-sm hover:bg-paper">
                        <input type="checkbox" checked={tagIds.includes(item.id)} onChange={() => toggleChoice(item.id, tagIds, setTagIds)} />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="newsroom-surface bg-paper-elevated p-4" aria-labelledby="media-title">
                <h2 id="media-title" className="text-sm font-bold">मुख्य तस्बिर र मिडिया</h2>
                <label className="mt-3 block text-xs font-semibold text-stone">
                  मुख्य तस्बिर
                  <select className="newsroom-field mt-1.5" value={heroId} onChange={(event) => setHeroId(event.target.value)}>
                    <option value="">मुख्य तस्बिर छैन</option>
                    {gallery.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </label>
                <div className="mt-4 border-t border-line pt-4">
                  <p className="text-xs font-bold">नयाँ तस्बिर अपलोड</p>
                  <label className="mt-3 block text-xs font-semibold text-stone">
                    तस्बिर फाइल
                    <input ref={fileRef} type="file" accept="image/*" className="mt-1.5 block w-full text-xs file:mr-3 file:min-h-11 file:rounded-[var(--radius-control)] file:border file:border-line file:bg-paper file:px-3 file:text-xs file:font-semibold" />
                  </label>
                  <label className="mt-3 block text-xs font-semibold text-stone">
                    वैकल्पिक पाठ (alt) <span className="text-danger">*</span>
                    <input className="newsroom-field mt-1.5" value={uploadAlt} onChange={(event) => setUploadAlt(event.target.value)} />
                  </label>
                  <label className="mt-3 block text-xs font-semibold text-stone">
                    श्रेय / स्रोत <span className="text-danger">*</span>
                    <input className="newsroom-field mt-1.5" value={uploadCredit} onChange={(event) => setUploadCredit(event.target.value)} />
                  </label>
                  <button type="button" disabled={pending} onClick={onUpload} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] border border-line bg-paper px-3 text-sm font-semibold hover:border-accent hover:text-accent disabled:opacity-50">
                    <UploadSimple size={18} aria-hidden="true" /> अपलोड गर्नुहोस्
                  </button>
                </div>
              </section>

              <details className="newsroom-surface bg-paper-elevated p-4">
                <summary className="cursor-pointer text-sm font-bold">खोज इन्जिन विवरण</summary>
                <div className="mt-4 space-y-3">
                  <label className="block text-xs font-semibold text-stone">खोज शीर्षक<input className="newsroom-field mt-1.5" value={seoTitleNe} onChange={(event) => setSeoTitleNe(event.target.value)} /></label>
                  <label className="block text-xs font-semibold text-stone">खोज विवरण<textarea className="newsroom-field mt-1.5 min-h-24 resize-y" value={seoDescriptionNe} onChange={(event) => setSeoDescriptionNe(event.target.value)} /></label>
                </div>
              </details>

              <section className="newsroom-surface bg-paper-elevated p-4" aria-labelledby="readiness-title">
                <div className="flex items-center justify-between gap-3">
                  <h2 id="readiness-title" className="text-sm font-bold">समीक्षा तयारी</h2>
                  <span className={`text-xs font-bold ${readinessIssues.length ? 'text-warning' : 'text-success'}`}>{readinessIssues.length ? `${readinessIssues.length} बाँकी` : 'तयार'}</span>
                </div>
                {readinessIssues.length ? (
                  <ul className="mt-3 space-y-2 text-xs leading-5 text-stone">
                    {readinessIssues.map((issue) => <li key={issue} className="flex gap-2"><span aria-hidden="true">•</span><span>{issue}</span></li>)}
                  </ul>
                ) : (
                  <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-success"><CheckCircle size={17} weight="fill" className="mt-0.5 shrink-0" aria-hidden="true" />सम्पादकीय समीक्षामा पठाउन आवश्यक आधारभूत विवरण पूरा छन्।</p>
                )}
              </section>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}

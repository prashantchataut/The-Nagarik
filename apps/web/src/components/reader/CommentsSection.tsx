'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowBendUpLeft,
  ChatCircleText,
  PaperPlaneTilt,
  WarningCircle,
} from '@phosphor-icons/react'

type PublicComment = {
  id: string
  articleId: string
  parentId: string | null
  name: string
  body: string
  createdAt: string
}

const COPY = {
  ne: {
    heading: 'पाठक प्रतिक्रिया',
    subheading: 'तपाईंको विचार सम्पादकीय समीक्षापछि प्रकाशित हुन्छ।',
    empty: 'अहिलेसम्म कुनै प्रतिक्रिया छैन। पहिलो प्रतिक्रिया लेख्नुहोस्।',
    name: 'नाम',
    nameHint: 'सार्वजनिक रूपमा देखिन्छ',
    email: 'इमेल (ऐच्छिक)',
    emailHint: 'कहिल्यै सार्वजनिक हुँदैन',
    comment: 'प्रतिक्रिया',
    placeholder: 'सभ्य र तथ्यमा आधारित प्रतिक्रिया लेख्नुहोस्...',
    reply: 'जवाफ',
    replyingTo: 'जवाफ दिँदै',
    cancel: 'रद्द',
    submit: 'पठाउनुहोस्',
    submitting: 'पठाउँदै...',
    consent: 'मेरो नाम र प्रतिक्रिया सार्वजनिक रूपमा प्रकाशित गर्न म सहमत छु।',
    consentRequired: 'प्रकाशन सहमति आवश्यक छ।',
    nameError: 'नाम कम्तीमा २ अक्षरको हुनुपर्छ।',
    emailError: 'मान्य इमेल हाल्नुहोस् वा खाली छोड्नुहोस्।',
    bodyError: 'प्रतिक्रिया कम्तीमा ५ अक्षरको हुनुपर्छ।',
    rateLimit: 'धेरै छिटो पठाउनुभयो। केही मिनेटपछि पुनः प्रयास गर्नुहोस्।',
    genericError: 'प्रतिक्रिया पठाउन सकिएन। पुनः प्रयास गर्नुहोस्।',
    pendingNotice: 'धन्यवाद! तपाईंको प्रतिक्रिया समीक्षा कतारमा छ र स्वीकृतिपछि देखिनेछ।',
    moderationPolicy:
      'द नागरिकले घृणा, गाली वा भ्रामक सामग्री प्रकाशित गर्दैन। सबै प्रतिक्रिया सम्पादकीय समीक्षापछि मात्र देखिन्छन्।',
    loadError: 'प्रतिक्रिया लोड हुन सकेन।',
  },
  en: {
    heading: 'Reader comments',
    subheading: 'Your comment is published after editorial review.',
    empty: 'No comments yet. Be the first to respond.',
    name: 'Name',
    nameHint: 'Shown publicly',
    email: 'Email (optional)',
    emailHint: 'Never shown publicly',
    comment: 'Comment',
    placeholder: 'Write a civil, fact-based response...',
    reply: 'Reply',
    replyingTo: 'Replying to',
    cancel: 'Cancel',
    submit: 'Submit',
    submitting: 'Sending...',
    consent: 'I agree to publish my name and comment publicly.',
    consentRequired: 'Publishing consent is required.',
    nameError: 'Name needs at least 2 characters.',
    emailError: 'Enter a valid email or leave it empty.',
    bodyError: 'Comment needs at least 5 characters.',
    rateLimit: 'Too many submissions. Please try again in a few minutes.',
    genericError: 'Could not submit the comment. Please retry.',
    pendingNotice: 'Thank you! Your comment is in the moderation queue and will appear once approved.',
    moderationPolicy:
      'The Nagarik does not publish hate, abuse, or misinformation. Every comment appears only after editorial review.',
    loadError: 'Comments could not be loaded.',
  },
} as const

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const NAME_KEY = 'tn_comment_name_v1'

function timeAgo(iso: string, locale: 'ne' | 'en'): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.max(1, Math.round(diffMs / 60_000))
  const rtf = new Intl.RelativeTimeFormat(locale === 'ne' ? 'ne-NP' : 'en', { numeric: 'auto' })
  if (minutes < 60) return rtf.format(-minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (hours < 24) return rtf.format(-hours, 'hour')
  return rtf.format(-Math.round(hours / 24), 'day')
}

export function CommentsSection({
  articleId,
  locale = 'ne',
}: {
  articleId: string
  locale?: 'ne' | 'en'
}) {
  const copy = COPY[locale]
  const [comments, setComments] = useState<PublicComment[]>([])
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [body, setBody] = useState('')
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState('') // honeypot
  const [replyTo, setReplyTo] = useState<PublicComment | null>(null)
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'done'>('idle')
  const [error, setError] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const bodyFieldRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/comments?articleId=${encodeURIComponent(articleId)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: { comments?: PublicComment[] }) => {
        if (cancelled) return
        setComments(Array.isArray(data.comments) ? data.comments : [])
        setLoadState('ready')
      })
      .catch(() => {
        if (!cancelled) setLoadState('error')
      })
    return () => {
      cancelled = true
    }
  }, [articleId])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(NAME_KEY)
      if (saved) setName(saved)
    } catch {
      // optional convenience only
    }
  }, [])

  const threads = useMemo(() => {
    const roots = comments.filter((c) => !c.parentId)
    const children = new Map<string, PublicComment[]>()
    for (const c of comments) {
      if (!c.parentId) continue
      const list = children.get(c.parentId) ?? []
      list.push(c)
      children.set(c.parentId, list)
    }
    return { roots, children }
  }, [comments])

  const beginReply = useCallback((comment: PublicComment) => {
    setReplyTo(comment)
    formRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    bodyFieldRef.current?.focus()
  }, [])

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    const trimmedName = name.trim()
    const trimmedBody = body.trim()
    const trimmedEmail = email.trim()

    if (trimmedName.length < 2) {
      setError(copy.nameError)
      return
    }
    if (trimmedEmail && !EMAIL_RE.test(trimmedEmail)) {
      setError(copy.emailError)
      return
    }
    if (trimmedBody.length < 5) {
      setError(copy.bodyError)
      return
    }
    if (!consent) {
      setError(copy.consentRequired)
      return
    }

    setSubmitState('submitting')
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          articleId,
          parentId: replyTo?.id ?? null,
          name: trimmedName,
          email: trimmedEmail,
          body: trimmedBody,
          locale,
          consent: true,
          website,
        }),
      })
      if (res.status === 429) {
        setError(copy.rateLimit)
        setSubmitState('idle')
        return
      }
      if (!res.ok) throw new Error(String(res.status))
      try {
        localStorage.setItem(NAME_KEY, trimmedName)
      } catch {
        // optional convenience only
      }
      setBody('')
      setReplyTo(null)
      setConsent(false)
      setSubmitState('done')
    } catch {
      setError(copy.genericError)
      setSubmitState('idle')
    }
  }

  function CommentCard({ comment, depth }: { comment: PublicComment; depth: number }) {
    const replies = threads.children.get(comment.id) ?? []
    return (
      <li className={depth ? 'mt-3 border-l-2 border-line pl-4' : 'py-4 first:pt-0'}>
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-muted text-sm font-black text-accent"
          >
            {comment.name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
              <span className="font-bold text-ink">{comment.name}</span>
              <span className="text-stone" suppressHydrationWarning>
                {timeAgo(comment.createdAt, locale)}
              </span>
            </p>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink">
              {comment.body}
            </p>
            {depth < 1 ? (
              <button
                type="button"
                onClick={() => beginReply(comment)}
                className="mt-2 inline-flex min-h-9 items-center gap-1 rounded-[var(--radius-control)] px-2 text-xs font-bold text-accent hover:bg-accent-muted"
              >
                <ArrowBendUpLeft size={13} weight="bold" aria-hidden="true" />
                {copy.reply}
              </button>
            ) : null}
            {replies.length ? (
              <ul>
                {replies.map((reply) => (
                  <CommentCard key={reply.id} comment={reply} depth={depth + 1} />
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </li>
    )
  }

  return (
    <section
      aria-labelledby="comments-title"
      className="mt-12 rounded-[var(--radius-panel)] border border-line bg-paper p-5 md:p-7"
      data-focus-hide
    >
      <div className="flex items-center gap-2 border-b-2 border-accent pb-3">
        <ChatCircleText size={22} weight="bold" className="text-accent" aria-hidden="true" />
        <h2 id="comments-title" className="text-lg font-black text-ink">
          {copy.heading}
        </h2>
        <span className="ml-auto rounded-full bg-paper-elevated border border-line px-2.5 py-0.5 text-xs font-bold tabular-nums text-stone">
          {comments.length}
        </span>
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-stone">{copy.subheading}</p>

      {/* Thread list */}
      <div className="mt-5">
        {loadState === 'loading' ? (
          <div className="space-y-3" aria-hidden="true">
            {[0, 1].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-[var(--radius-control)] bg-paper-elevated" />
            ))}
          </div>
        ) : loadState === 'error' ? (
          <p className="text-sm text-stone">{copy.loadError}</p>
        ) : threads.roots.length ? (
          <ul className="divide-y divide-line">
            {threads.roots.map((comment) => (
              <CommentCard key={comment.id} comment={comment} depth={0} />
            ))}
          </ul>
        ) : (
          <p className="rounded-[var(--radius-control)] bg-paper-elevated px-4 py-6 text-center text-sm text-stone">
            {copy.empty}
          </p>
        )}
      </div>

      {/* Submission form */}
      <form ref={formRef} onSubmit={onSubmit} noValidate className="mt-7 border-t border-line pt-6">
        {replyTo ? (
          <p className="mb-3 inline-flex flex-wrap items-center gap-2 rounded-[var(--radius-control)] bg-accent-muted px-3 py-1.5 text-xs font-semibold text-accent">
            <ArrowBendUpLeft size={13} weight="bold" aria-hidden="true" />
            {copy.replyingTo}: {replyTo.name}
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="min-h-8 rounded px-1.5 font-bold underline underline-offset-2"
            >
              {copy.cancel}
            </button>
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-xs font-semibold text-ink">
            <span>
              {copy.name} <span className="font-normal text-stone">({copy.nameHint})</span>
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              required
              autoComplete="name"
              className="newsroom-field min-h-11 px-3 text-sm"
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-ink">
            <span>
              {copy.email} <span className="font-normal text-stone">({copy.emailHint})</span>
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={200}
              autoComplete="email"
              className="newsroom-field min-h-11 px-3 text-sm"
            />
          </label>
        </div>

        {/* Honeypot: hidden from humans, catches naive bots. */}
        <div className="sr-only" aria-hidden="true">
          <label>
            Website
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </label>
        </div>

        <label className="mt-4 grid gap-1 text-xs font-semibold text-ink">
          {copy.comment}
          <textarea
            ref={bodyFieldRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            maxLength={2000}
            required
            placeholder={copy.placeholder}
            className="newsroom-field px-3 py-2.5 text-sm leading-relaxed"
          />
        </label>

        <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-stone">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--accent)]"
          />
          <span>{copy.consent}</span>
        </label>

        <div aria-live="polite" className="mt-3 min-h-5">
          {error ? (
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-danger">
              <WarningCircle size={14} weight="bold" aria-hidden="true" />
              {error}
            </p>
          ) : submitState === 'done' ? (
            <p className="text-xs font-semibold text-success">{copy.pendingNotice}</p>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <button
            type="submit"
            disabled={submitState === 'submitting'}
            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] accent-solid px-5 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <PaperPlaneTilt size={16} weight="bold" aria-hidden="true" />
            {submitState === 'submitting' ? copy.submitting : copy.submit}
          </button>
          <p className="max-w-[42ch] text-[0.68rem] leading-relaxed text-stone">
            {copy.moderationPolicy}
          </p>
        </div>
      </form>
    </section>
  )
}

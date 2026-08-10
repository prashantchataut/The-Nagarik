'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChatCircleText, Check, X } from '@phosphor-icons/react'

type PendingComment = {
  id: string
  articleId: string
  parentId: string | null
  name: string
  email: string
  body: string
  status: string
  locale: string
  createdAt: string
}

/**
 * Editorial comment moderation queue.
 * Lists pending reader comments and lets editors approve or reject inline.
 */
export function CommentModerationPanel() {
  const [comments, setComments] = useState<PendingComment[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'unauthorized' | 'error'>('loading')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')

  const refresh = useCallback(() => {
    setState('loading')
    fetch('/api/admin/comments')
      .then((res) => {
        if (res.status === 401) {
          setState('unauthorized')
          return null
        }
        if (!res.ok) throw new Error(String(res.status))
        return res.json()
      })
      .then((data: { comments?: PendingComment[] } | null) => {
        if (!data) return
        setComments(Array.isArray(data.comments) ? data.comments : [])
        setState('ready')
      })
      .catch(() => setState('error'))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function act(id: string, action: 'approve' | 'reject') {
    setBusyId(id)
    setNotice('')
    try {
      const res = await fetch('/api/admin/comments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      if (!res.ok) throw new Error(String(res.status))
      setComments((prev) => prev.filter((c) => c.id !== id))
      setNotice(action === 'approve' ? 'प्रतिक्रिया स्वीकृत भयो।' : 'प्रतिक्रिया अस्वीकृत भयो।')
    } catch {
      setNotice('कार्य पूरा हुन सकेन। पुनः प्रयास गर्नुहोस्।')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="surface-card p-5" aria-labelledby="comment-queue-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <ChatCircleText size={20} weight="bold" className="text-accent" aria-hidden="true" />
          <h2 id="comment-queue-title" className="text-base font-black text-ink">
            Comment Moderation
          </h2>
          <span className="rounded-full bg-warning-muted px-2.5 py-0.5 text-xs font-bold tabular-nums text-warning">
            {comments.length} pending
          </span>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="inline-flex min-h-9 items-center rounded-[var(--radius-control)] border border-line px-3 text-xs font-bold text-ink hover:border-accent hover:text-accent"
        >
          Refresh
        </button>
      </div>

      <div aria-live="polite" className="min-h-5 pt-2">
        {notice ? <p className="text-xs font-semibold text-accent">{notice}</p> : null}
      </div>

      {state === 'loading' ? (
        <p className="py-6 text-xs text-stone">Loading pending comments...</p>
      ) : state === 'unauthorized' ? (
        <p className="py-6 text-xs text-stone">
          Editor role and staff session required to moderate comments.
        </p>
      ) : state === 'error' ? (
        <p className="py-6 text-xs text-danger">Could not load the moderation queue.</p>
      ) : comments.length ? (
        <ul className="divide-y divide-line">
          {comments.map((comment) => (
            <li key={comment.id} className="flex flex-wrap items-start justify-between gap-4 py-4">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
                  <span className="font-bold text-ink">{comment.name}</span>
                  {comment.email ? <span className="text-stone">{comment.email}</span> : null}
                  <span className="text-stone tabular-nums" suppressHydrationWarning>
                    {new Date(comment.createdAt).toLocaleString('ne-NP')}
                  </span>
                  {comment.parentId ? (
                    <span className="rounded bg-paper-strong px-1.5 py-0.5 text-[0.65rem] font-bold text-stone">
                      reply
                    </span>
                  ) : null}
                </p>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink">
                  {comment.body}
                </p>
                <p className="mt-1 text-[0.68rem] text-stone">Article: {comment.articleId}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={busyId === comment.id}
                  onClick={() => act(comment.id, 'approve')}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-control)] bg-success-muted px-3.5 text-xs font-bold text-success hover:opacity-85 disabled:opacity-50"
                >
                  <Check size={14} weight="bold" aria-hidden="true" />
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busyId === comment.id}
                  onClick={() => act(comment.id, 'reject')}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-control)] bg-danger-muted px-3.5 text-xs font-bold text-danger hover:opacity-85 disabled:opacity-50"
                >
                  <X size={14} weight="bold" aria-hidden="true" />
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-6 text-xs text-stone">
          प्रतिक्रिया कतार खाली छ। No comments waiting for review.
        </p>
      )}
    </section>
  )
}

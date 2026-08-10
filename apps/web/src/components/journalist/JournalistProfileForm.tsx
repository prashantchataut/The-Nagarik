'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import {
  CheckCircle,
  IdentificationCard,
  Newspaper,
  Plus,
  UploadSimple,
  WarningCircle,
  X,
} from '@phosphor-icons/react'

type AuthorProfile = {
  id: string
  slug: string
  nameNe: string
  nameEn: string
  bioNe: string
  bioEn: string
  beats: string[]
  avatarId: string | null
  avatarUrl: string | null
}

type PortfolioItem = {
  id: string
  titleNe: string
  slug: string
  categorySlug: string
  publishedAt: string | null
}

type ProfileResponse = {
  ok?: boolean
  account?: { name: string; email: string }
  author?: AuthorProfile | null
  portfolio?: PortfolioItem[]
  message?: string
  code?: string
}

const SUGGESTED_BEATS = [
  'राजनीति',
  'अर्थतन्त्र',
  'समाज',
  'प्रदेश',
  'खेलकुद',
  'प्रविधि',
  'स्वास्थ्य',
  'शिक्षा',
  'वातावरण',
  'अदालत',
]

export function JournalistProfileForm() {
  const [state, setState] = useState<'loading' | 'ready' | 'offline' | 'error'>('loading')
  const [account, setAccount] = useState<{ name: string; email: string } | null>(null)
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [nameNe, setNameNe] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [bioNe, setBioNe] = useState('')
  const [bioEn, setBioEn] = useState('')
  const [beats, setBeats] = useState<string[]>([])
  const [beatInput, setBeatInput] = useState('')
  const [avatarId, setAvatarId] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'error'>('idle')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/journalist/profile')
      .then(async (res) => {
        if (res.status === 503) {
          if (!cancelled) setState('offline')
          return null
        }
        if (!res.ok) throw new Error(String(res.status))
        return (await res.json()) as ProfileResponse
      })
      .then((data) => {
        if (!data || cancelled) return
        setAccount(data.account ?? null)
        setPortfolio(data.portfolio ?? [])
        if (data.author) {
          setNameNe(data.author.nameNe)
          setNameEn(data.author.nameEn)
          setBioNe(data.author.bioNe)
          setBioEn(data.author.bioEn)
          setBeats(data.author.beats)
          setAvatarId(data.author.avatarId)
          setAvatarUrl(data.author.avatarUrl)
        } else if (data.account?.name) {
          setNameNe(data.account.name)
        }
        setState('ready')
      })
      .catch(() => {
        if (!cancelled) setState('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Data-loss prevention: warn before leaving with unsaved edits.
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  function markDirty() {
    setDirty(true)
    if (saveState === 'saved') setSaveState('idle')
  }

  function addBeat(raw: string) {
    const beat = raw.trim()
    if (!beat || beats.includes(beat) || beats.length >= 6) return
    setBeats((prev) => [...prev, beat])
    setBeatInput('')
    markDirty()
  }

  function removeBeat(beat: string) {
    setBeats((prev) => prev.filter((b) => b !== beat))
    markDirty()
  }

  async function uploadAvatar(file: File) {
    setUploadState('uploading')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('alt', `${nameNe || 'पत्रकार'} - प्रोफाइल तस्बिर`)
      form.append('credit', nameNe || 'The Nagarik')
      const res = await fetch('/api/journalist/media', { method: 'POST', body: form })
      if (!res.ok) throw new Error(String(res.status))
      const data = (await res.json()) as { id?: string | number; url?: string; doc?: { id?: string | number; url?: string } }
      const id = data.id ?? data.doc?.id
      const url = data.url ?? data.doc?.url
      if (id == null) throw new Error('no-id')
      setAvatarId(String(id))
      if (typeof url === 'string') setAvatarUrl(url)
      markDirty()
      setUploadState('idle')
    } catch {
      setUploadState('error')
    }
  }

  async function onSave(event: React.FormEvent) {
    event.preventDefault()
    if (nameNe.trim().length < 2) {
      setSaveState('error')
      return
    }
    setSaveState('saving')
    try {
      const res = await fetch('/api/journalist/profile', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          nameNe: nameNe.trim(),
          nameEn: nameEn.trim(),
          bioNe: bioNe.trim(),
          bioEn: bioEn.trim(),
          beats,
          avatarId,
        }),
      })
      if (!res.ok) throw new Error(String(res.status))
      const data = (await res.json()) as ProfileResponse
      if (data.author) {
        setAvatarUrl(data.author.avatarUrl)
      }
      setPortfolio(data.portfolio ?? portfolio)
      setDirty(false)
      setSaveState('saved')
    } catch {
      setSaveState('error')
    }
  }

  if (state === 'loading') {
    return (
      <div className="space-y-3" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-[var(--radius-control)] bg-paper-elevated" />
        ))}
      </div>
    )
  }

  if (state === 'offline' || state === 'error') {
    return (
      <div className="newsroom-surface p-6">
        <p className="inline-flex items-center gap-2 text-sm font-bold text-warning">
          <WarningCircle size={18} weight="bold" aria-hidden="true" />
          {state === 'offline'
            ? 'सम्पादकीय जडान अनुपलब्ध भएकाले प्रोफाइल अहिले खोल्न सकिएन।'
            : 'प्रोफाइल लोड हुन सकेन। पुनः प्रयास गर्नुहोस्।'}
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <form onSubmit={onSave} className="min-w-0 space-y-7">
        {/* Avatar */}
        <section className="flex flex-wrap items-center gap-5">
          <span className="relative inline-flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-line bg-accent-muted text-3xl font-black text-accent">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" fill sizes="96px" className="object-cover" />
            ) : (
              (nameNe || 'प').slice(0, 1)
            )}
          </span>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void uploadAvatar(file)
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadState === 'uploading'}
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border border-line bg-paper px-4 text-sm font-bold text-ink hover:border-accent hover:text-accent disabled:opacity-60"
            >
              <UploadSimple size={16} weight="bold" aria-hidden="true" />
              {uploadState === 'uploading' ? 'अपलोड हुँदै...' : 'तस्बिर अपलोड'}
            </button>
            <p className="mt-1.5 text-xs text-stone">JPG, PNG वा WebP। अधिकतम १५ MB।</p>
            {uploadState === 'error' ? (
              <p className="mt-1 text-xs font-semibold text-danger">
                तस्बिर अपलोड हुन सकेन। पुनः प्रयास गर्नुहोस्।
              </p>
            ) : null}
          </div>
        </section>

        {/* Names */}
        <section className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-xs font-bold text-ink">
            नाम (नेपाली) *
            <input
              value={nameNe}
              onChange={(e) => {
                setNameNe(e.target.value)
                markDirty()
              }}
              maxLength={80}
              required
              className="newsroom-field min-h-11 px-3 text-sm font-normal"
            />
          </label>
          <label className="grid gap-1 text-xs font-bold text-ink">
            Name (English)
            <input
              value={nameEn}
              onChange={(e) => {
                setNameEn(e.target.value)
                markDirty()
              }}
              maxLength={80}
              className="newsroom-field min-h-11 px-3 text-sm font-normal"
            />
          </label>
        </section>

        {/* Bios */}
        <section className="grid gap-4">
          <label className="grid gap-1 text-xs font-bold text-ink">
            परिचय (नेपाली)
            <textarea
              value={bioNe}
              onChange={(e) => {
                setBioNe(e.target.value)
                markDirty()
              }}
              rows={4}
              maxLength={1200}
              placeholder="तपाईंको पत्रकारिता अनुभव, विशेषज्ञता र संस्थागत परिचय..."
              className="newsroom-field px-3 py-2.5 text-sm font-normal leading-relaxed"
            />
          </label>
          <label className="grid gap-1 text-xs font-bold text-ink">
            Bio (English)
            <textarea
              value={bioEn}
              onChange={(e) => {
                setBioEn(e.target.value)
                markDirty()
              }}
              rows={4}
              maxLength={1200}
              placeholder="Your reporting background, expertise, and affiliations..."
              className="newsroom-field px-3 py-2.5 text-sm font-normal leading-relaxed"
            />
          </label>
        </section>

        {/* Beats */}
        <section>
          <p className="text-xs font-bold text-ink">बिट विशेषज्ञता (अधिकतम ६)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {beats.map((beat) => (
              <span
                key={beat}
                className="inline-flex items-center gap-1 rounded-full bg-accent-muted px-3 py-1.5 text-xs font-bold text-accent"
              >
                {beat}
                <button
                  type="button"
                  onClick={() => removeBeat(beat)}
                  aria-label={`${beat} हटाउनुहोस्`}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-accent hover:text-accent-fg"
                >
                  <X size={11} weight="bold" aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={beatInput}
              onChange={(e) => setBeatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addBeat(beatInput)
                }
              }}
              maxLength={40}
              placeholder="नयाँ बिट थप्नुहोस्"
              className="newsroom-field min-h-11 w-full max-w-[16rem] px-3 text-sm"
            />
            <button
              type="button"
              onClick={() => addBeat(beatInput)}
              disabled={!beatInput.trim() || beats.length >= 6}
              className="inline-flex min-h-11 items-center gap-1 rounded-[var(--radius-control)] border border-line px-3.5 text-xs font-bold text-ink hover:border-accent hover:text-accent disabled:opacity-50"
            >
              <Plus size={14} weight="bold" aria-hidden="true" />
              थप्नुहोस्
            </button>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {SUGGESTED_BEATS.filter((b) => !beats.includes(b)).map((beat) => (
              <button
                key={beat}
                type="button"
                onClick={() => addBeat(beat)}
                disabled={beats.length >= 6}
                className="rounded-full border border-line bg-paper px-2.5 py-1 text-[0.7rem] font-semibold text-stone hover:border-accent hover:text-accent disabled:opacity-50"
              >
                + {beat}
              </button>
            ))}
          </div>
        </section>

        {/* Save */}
        <div className="flex flex-wrap items-center gap-4 border-t border-line pt-5">
          <button
            type="submit"
            disabled={saveState === 'saving' || !dirty}
            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] accent-solid px-6 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saveState === 'saving' ? 'सुरक्षित हुँदै...' : 'प्रोफाइल सुरक्षित गर्नुहोस्'}
          </button>
          <div aria-live="polite">
            {saveState === 'saved' ? (
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-success">
                <CheckCircle size={17} weight="fill" aria-hidden="true" />
                प्रोफाइल सुरक्षित भयो।
              </p>
            ) : saveState === 'error' ? (
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-danger">
                <WarningCircle size={17} weight="bold" aria-hidden="true" />
                सुरक्षित हुन सकेन। नाम (नेपाली) अनिवार्य छ।
              </p>
            ) : dirty ? (
              <p className="text-xs font-semibold text-warning">सुरक्षित नगरिएको परिवर्तन छ।</p>
            ) : null}
          </div>
        </div>
      </form>

      {/* Right rail: identity + portfolio */}
      <aside className="space-y-5">
        <section className="newsroom-surface p-5">
          <div className="flex items-center gap-2 text-accent">
            <IdentificationCard size={18} weight="bold" aria-hidden="true" />
            <h2 className="text-sm font-black text-ink">खाता पहिचान</h2>
          </div>
          <dl className="mt-3 space-y-2 text-xs">
            <div>
              <dt className="font-bold text-stone">नाम</dt>
              <dd className="text-ink">{account?.name || '-'}</dd>
            </div>
            <div>
              <dt className="font-bold text-stone">इमेल</dt>
              <dd className="break-all text-ink">{account?.email || '-'}</dd>
            </div>
          </dl>
          <p className="mt-3 text-[0.68rem] leading-relaxed text-stone">
            खाता इमेल र भूमिका प्रणाली प्रशासकले मात्र परिवर्तन गर्न सक्छन्। यहाँ सुरक्षित हुने विवरण
            सार्वजनिक बाइलाइनमा देखिन्छ।
          </p>
        </section>

        <section className="newsroom-surface p-5">
          <div className="flex items-center gap-2 text-accent">
            <Newspaper size={18} weight="bold" aria-hidden="true" />
            <h2 className="text-sm font-black text-ink">प्रकाशित पोर्टफोलियो</h2>
          </div>
          {portfolio.length ? (
            <ul className="mt-3 divide-y divide-line">
              {portfolio.map((item) => (
                <li key={item.id} className="py-2.5 first:pt-1 last:pb-0">
                  <a
                    href={`/ne/${item.categorySlug}/${item.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-xs font-bold leading-snug text-ink hover:text-accent"
                  >
                    {item.titleNe}
                  </a>
                  {item.publishedAt ? (
                    <p className="mt-0.5 text-[0.68rem] tabular-nums text-stone" suppressHydrationWarning>
                      {new Date(item.publishedAt).toLocaleDateString('ne-NP')}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs leading-relaxed text-stone">
              प्रकाशित समाचार यहाँ देखिनेछन्। प्रोफाइल सुरक्षित गरेपछि सम्पादकले तपाईंको बाइलाइन
              लेखसँग जोड्न सक्छन्।
            </p>
          )}
        </section>
      </aside>
    </div>
  )
}

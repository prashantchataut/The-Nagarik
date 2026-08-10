'use client'

import { ArrowsLeftRight, Check, Copy, Sparkle, Trash } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import type { AppLocale } from '@/lib/i18n'
import { convertPreetiToUnicode } from '@/lib/preeti'

const HISTORY_KEY = 'tn_preeti_history_v1'

const NEP_SAMPLES = [
  { text: 'g]kfn', label: 'नेपाल' },
  { text: 'b gfu/Ls', label: 'द नागरिक' },
  { text: ';+;b ;lrjfnosf] ;"rgf', label: 'संसद् सचिवालयको सूचना' },
]

export function PreetiConverter({ locale = 'ne' }: { locale?: AppLocale }) {
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const output = useMemo(() => convertPreetiToUnicode(input), [input])

  const isNe = locale === 'ne'
  const copy = isNe
    ? {
        sample: 'नमूना राख्नुहोस्',
        move: 'नतिजा इनपुटमा सार्नुहोस्',
        clear: 'खाली गर्नुहोस्',
        input: 'प्रीति / कान्तिपुर टेक्स्ट (Preeti Font)',
        inputPlaceholder: 'यहाँ प्रीति टेक्स्ट टाइप वा पेस्ट गर्नुहोस् (जस्तै: g]kfn)…',
        output: 'युनिकोड नेपाली (Unicode Nepali)',
        proof: 'प्रकाशनअघि नाम, संयुक्त अक्षर र प्राविधिक शब्द एकपटक अवश्य जाँच्नुहोस्।',
        copied: 'कपी भयो',
        copyButton: 'युनिकोड कपी गर्नुहोस्',
        copyFailed: 'कपी गर्न सकिएन',
        recent: 'भर्खरै रूपान्तरण गरिएका',
        historyHelp: 'यो इतिहास यही उपकरणमा मात्र सुरक्षित हुन्छ।',
        charCount: 'अक्षर',
        wordCount: 'शब्द',
      }
    : {
        sample: 'Load sample',
        move: 'Move output to input',
        clear: 'Clear',
        input: 'Preeti / Kantipur font text',
        inputPlaceholder: 'Type or paste legacy Preeti text here (e.g. g]kfn)…',
        output: 'Unicode Nepali Text',
        proof: 'Proofread conjuncts, names, and numerals before publishing.',
        copied: 'Copied',
        copyButton: 'Copy Unicode',
        copyFailed: 'Could not copy',
        recent: 'Recent conversions',
        historyHelp: 'History is saved locally on this device.',
        charCount: 'chars',
        wordCount: 'words',
      }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      const parsed = raw ? (JSON.parse(raw) as string[]) : []
      if (Array.isArray(parsed)) setHistory(parsed.slice(0, 8))
    } catch {
      // Local history optional
    }
  }, [])

  function remember(value: string) {
    if (!value.trim()) return
    const next = [value, ...history.filter((item) => item !== value)].slice(0, 8)
    setHistory(next)
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
    } catch {
      // Ignore storage errors
    }
  }

  async function copyOutput() {
    if (!output.trim()) return
    try {
      await navigator.clipboard.writeText(output)
      remember(output)
      setCopyError(false)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
      setCopyError(true)
    }
  }

  const inputChars = input.length
  const outputChars = output.length
  const outputWords = output.trim() ? output.trim().split(/\s+/).length : 0

  return (
    <div className="space-y-6">
      {/* Sample presets & action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-stone">नमूना:</span>
          {NEP_SAMPLES.map((s) => (
            <button
              key={s.text}
              type="button"
              onClick={() => setInput(s.text)}
              className="rounded-full bg-paper-elevated border border-line px-3 py-1 text-xs font-bold text-ink hover:border-accent hover:text-accent transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInput(output)}
            disabled={!output.trim()}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] border border-line bg-paper px-3 py-1.5 text-xs font-bold text-ink hover:border-accent disabled:opacity-40"
          >
            <ArrowsLeftRight size={14} weight="bold" />
            <span>{copy.move}</span>
          </button>

          <button
            type="button"
            onClick={() => setInput('')}
            disabled={!input}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] border border-line bg-paper px-3 py-1.5 text-xs font-bold text-stone hover:border-danger hover:text-danger disabled:opacity-40"
          >
            <Trash size={14} weight="bold" />
            <span>{copy.clear}</span>
          </button>
        </div>
      </div>

      {/* Main Dual Box Workspace */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Box */}
        <div className="surface-card flex flex-col p-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <label className="text-xs font-black uppercase tracking-wide text-ink" htmlFor="preeti-input">
              {copy.input}
            </label>
            <span className="text-[0.7rem] font-bold text-stone tabular-nums">
              {inputChars} {copy.charCount}
            </span>
          </div>

          <textarea
            id="preeti-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={12}
            spellCheck={false}
            className="mt-3 w-full flex-1 resize-y bg-transparent font-mono text-base leading-relaxed text-ink outline-none placeholder:text-stone/60"
            placeholder={copy.inputPlaceholder}
          />
        </div>

        {/* Output Box */}
        <div className="surface-card flex flex-col p-4 shadow-sm border-accent/40 bg-paper-elevated">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <label className="text-xs font-black uppercase tracking-wide text-accent" htmlFor="unicode-output">
              {copy.output}
            </label>

            <button
              type="button"
              onClick={copyOutput}
              disabled={!output.trim()}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] accent-solid px-3 py-1 text-xs font-bold shadow-sm hover:opacity-95 disabled:opacity-40 transition-opacity"
            >
              {copied ? <Check size={14} weight="bold" /> : <Copy size={14} weight="bold" />}
              <span>{copied ? copy.copied : copy.copyButton}</span>
            </button>
          </div>

          <textarea
            id="unicode-output"
            value={output}
            readOnly
            rows={12}
            className="mt-3 w-full flex-1 resize-y bg-transparent text-base leading-[1.8] text-ink outline-none"
          />

          <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-2 text-[0.72rem] text-stone">
            <span>
              {outputWords} {copy.wordCount} · {outputChars} {copy.charCount}
            </span>
            <span className={copyError ? 'text-danger font-bold' : ''}>
              {copyError ? copy.copyFailed : copy.proof}
            </span>
          </div>
        </div>
      </div>

      {/* History section */}
      {history.length ? (
        <section className="surface-card p-5 mt-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkle size={16} weight="bold" className="text-accent" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink">
              {copy.recent}
            </h2>
          </div>
          <p className="text-[0.72rem] text-stone mb-3">{copy.historyHelp}</p>

          <div className="grid gap-2 sm:grid-cols-2">
            {history.map((item) => (
              <button
                key={item}
                type="button"
                className="surface-card truncate p-2.5 text-left text-xs font-medium text-ink hover:border-accent hover:text-accent transition-colors"
                onClick={() => setInput(item)}
                title={item}
              >
                {item}
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

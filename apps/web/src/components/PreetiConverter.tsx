'use client'

import { ArrowsLeftRight, Check, Copy, Trash } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import type { AppLocale } from '@/lib/i18n'
import { convertPreetiToUnicode } from '@/lib/preeti'

const HISTORY_KEY = 'tn_preeti_history_v1'

export function PreetiConverter({ locale = 'ne' }: { locale?: AppLocale }) {
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const output = useMemo(() => convertPreetiToUnicode(input), [input])

  const copy = locale === 'ne'
    ? {
        sample: 'नमूना राख्नुहोस्',
        move: 'नतिजा इनपुटमा सार्नुहोस्',
        clear: 'खाली गर्नुहोस्',
        input: 'प्रीति टेक्स्ट',
        inputPlaceholder: 'प्रीति टेक्स्ट यहाँ टाइप वा पेस्ट गर्नुहोस्…',
        output: 'युनिकोड नेपाली',
        proof: 'प्रकाशनअघि नाम, अंक र प्राविधिक शब्द फेरि जाँच्नुहोस्।',
        copied: 'कपी भयो',
        copyButton: 'कपी गर्नुहोस्',
        copyFailed: 'कपी गर्न सकिएन',
        recent: 'भर्खर कपी गरिएका',
        historyHelp: 'यो सूची यही उपकरणमा तपाईंको उपकरणमा मात्र सुरक्षित हुन्छ।',
      }
    : {
        sample: 'Load sample',
        move: 'Move output to input',
        clear: 'Clear',
        input: 'Preeti text',
        inputPlaceholder: 'Type or paste Preeti text…',
        output: 'Unicode Nepali',
        proof: 'Proofread names, numerals, and technical terms before publishing.',
        copied: 'Copied',
        copyButton: 'Copy',
        copyFailed: 'Could not copy',
        recent: 'Recent copies',
        historyHelp: 'This history is stored only on this device for this tool.',
      }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      const parsed = raw ? (JSON.parse(raw) as string[]) : []
      if (Array.isArray(parsed)) setHistory(parsed.slice(0, 8))
    } catch {
      // Local history is optional.
    }
  }, [])

  function remember(value: string) {
    if (!value.trim()) return
    const next = [value, ...history.filter((item) => item !== value)].slice(0, 8)
    setHistory(next)
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
    } catch {
      // The converter still works when storage is unavailable.
    }
  }

  async function copyOutput() {
    if (!output.trim()) return
    try {
      await navigator.clipboard.writeText(output)
      remember(output)
      setCopyError(false)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
      setCopyError(true)
    }
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] border border-line px-3 text-sm font-semibold text-ink hover:border-accent"
          onClick={() => setInput('g]kfn')}
        >
          {copy.sample}
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border border-line px-3 text-sm font-semibold text-ink hover:border-accent disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => setInput(output)}
          disabled={!output.trim()}
        >
          <ArrowsLeftRight size={17} aria-hidden="true" />
          {copy.move}
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border border-line px-3 text-sm font-semibold text-ink hover:border-danger hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => setInput('')}
          disabled={!input}
        >
          <Trash size={17} aria-hidden="true" />
          {copy.clear}
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <label className="text-sm font-bold text-ink" htmlFor="preeti-input">{copy.input}</label>
          <textarea
            id="preeti-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={14}
            spellCheck={false}
            className="mt-2 min-h-[20rem] w-full resize-y rounded-[var(--radius-control)] border border-line bg-field px-4 py-3 text-base leading-[1.75] text-ink outline-none focus:border-accent"
            placeholder={copy.inputPlaceholder}
          />
        </div>
        <div>
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-bold text-ink" htmlFor="unicode-output">{copy.output}</label>
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] bg-accent px-3 text-sm font-bold text-accent-fg disabled:cursor-not-allowed disabled:opacity-50"
              onClick={copyOutput}
              disabled={!output.trim()}
            >
              {copied ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}
              {copied ? copy.copied : copy.copyButton}
            </button>
          </div>
          <textarea
            id="unicode-output"
            value={output}
            readOnly
            rows={14}
            className="mt-2 min-h-[20rem] w-full resize-y rounded-[var(--radius-control)] border border-line bg-paper-elevated px-4 py-3 text-base leading-[1.75] text-ink"
          />
          <p className={`mt-2 text-xs ${copyError ? 'text-danger' : 'text-stone'}`} aria-live="polite">
            {copyError ? copy.copyFailed : copy.proof}
          </p>
        </div>
      </div>

      {history.length ? (
        <section className="border-t border-line pt-5">
          <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-stone">{copy.recent}</h2>
          <p className="mt-1 text-xs text-stone">{copy.historyHelp}</p>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {history.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  className="min-h-11 w-full truncate py-2 text-left text-sm text-ink hover:text-accent"
                  onClick={() => setInput(item)}
                  title={item}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

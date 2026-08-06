'use client'

import { ArrowsLeftRight, Check, Copy } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import { convertPreetiToUnicode } from '@/lib/preeti'

const HISTORY_KEY = 'tn_preeti_history_v1'

export function PreetiConverter() {
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const output = useMemo(() => convertPreetiToUnicode(input), [input])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      const parsed = raw ? (JSON.parse(raw) as string[]) : []
      if (Array.isArray(parsed)) setHistory(parsed.slice(0, 8))
    } catch {
      /* ignore */
    }
  }, [])

  function remember(value: string) {
    const next = [value, ...history.filter((h) => h !== value)].slice(0, 8)
    setHistory(next)
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-[var(--radius-control)] border border-line px-2.5 py-1 text-xs hover:border-accent"
          onClick={() => setInput('g]kfn')}
        >
          Load sample
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-[var(--radius-control)] border border-line px-2.5 py-1 text-xs hover:border-accent"
          onClick={() => {
            setInput(output)
          }}
        >
          <ArrowsLeftRight size={12} />
          Push output to input
        </button>
      </div>

      <label className="text-sm text-stone" htmlFor="preeti-input">
        Preeti
      </label>
      <textarea
        id="preeti-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={8}
        className="w-full rounded-[var(--radius-control)] border border-line bg-paper-elevated px-3 py-3 text-sm leading-relaxed outline-none focus:border-accent"
        placeholder="Type or paste Preeti text..."
      />
      <label className="text-sm text-stone" htmlFor="unicode-output">
        Unicode Nepali
      </label>
      <textarea
        id="unicode-output"
        value={output}
        readOnly
        rows={8}
        className="w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 py-3 text-sm leading-relaxed"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-stone">
          Proofread names and technical words before publishing.
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-[var(--radius-control)] border border-line px-2.5 py-1.5 text-xs hover:border-accent"
          onClick={async () => {
            await navigator.clipboard.writeText(output)
            remember(output)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1200)
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {history.length ? (
        <div className="border border-line bg-paper-elevated p-3">
          <p className="text-xs uppercase tracking-[0.1em] text-stone">Recent copies</p>
          <ul className="mt-2 space-y-2">
            {history.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  className="w-full truncate rounded-[8px] border border-transparent px-2 py-1.5 text-left text-sm hover:border-line hover:bg-paper"
                  onClick={() => setInput(item)}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

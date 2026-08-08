import type { ReactNode } from 'react'

/** Safe inline markdown: **bold**, _italic_, [label](https://...) */
export function renderInlineMarkup(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const pattern = /(\*\*[^*]+\*\*|_[^_]+_|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\))/g
  let last = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index))
    }
    const token = match[0]
    if (token.startsWith('**')) {
      nodes.push(<strong key={key++}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('_')) {
      nodes.push(<em key={key++}>{token.slice(1, -1)}</em>)
    } else if (match[2] && match[3]) {
      nodes.push(
        <a
          key={key++}
          href={match[3]}
          className="text-accent underline"
          rel="noopener noreferrer"
          target="_blank"
        >
          {match[2]}
        </a>,
      )
    }
    last = match.index + token.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes.length ? nodes : [text]
}

export function wrapSelection(
  value: string,
  start: number,
  end: number,
  before: string,
  after: string,
): { next: string; cursor: number } {
  const selected = value.slice(start, end) || 'text'
  const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`
  return { next, cursor: start + before.length + selected.length + after.length }
}

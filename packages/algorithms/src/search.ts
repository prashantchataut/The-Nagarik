export type SearchDoc = {
  id: string
  title: string
  deck: string
  category: string
  author: string
  body: string
}

type Posting = { docId: string; tf: number; fieldBoost: number }

function tokenize(text: string): string[] {
  // \p{M} kept inside tokens: Devanagari matras/virama are combining marks,
  // and splitting on them shatters words (bug found via algorithm suite).
  return text
    .toLowerCase()
    .normalize('NFC')
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    .filter((t) => t.length > 1)
}

/** Minimal bilingual civic expansions — extend via CMS later. */
const LEXICON: Record<string, string[]> = {
  budget: ['बजेट', 'budget'],
  बजेट: ['budget', 'बजेट'],
  parliament: ['संसद', 'parliament'],
  संसद: ['parliament', 'संसद'],
  monsoon: ['मनसुन', 'monsoon'],
  मनसुन: ['monsoon', 'मनसुन'],
  remittance: ['रेमिट्यान्स', 'remittance'],
  रेमिट्यान्स: ['remittance', 'रेमिट्यान्स'],
}

function expandQuery(tokens: string[]): string[] {
  const out = new Set(tokens)
  for (const t of tokens) {
    for (const alt of LEXICON[t] ?? []) out.add(alt.toLowerCase())
  }
  return [...out]
}

export function buildSearchIndex(docs: SearchDoc[]) {
  const df = new Map<string, number>()
  const postings = new Map<string, Posting[]>()
  const docMap = new Map(docs.map((d) => [d.id, d]))

  for (const doc of docs) {
    const fields: Array<[string, number]> = [
      [doc.title, 3.2],
      [doc.author, 2.0],
      [doc.deck, 1.6],
      [doc.category, 1.4],
      [doc.body, 1.0],
    ]
    const seen = new Set<string>()
    for (const [text, boost] of fields) {
      const tokens = tokenize(text)
      const tf = new Map<string, number>()
      for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1)
      for (const [term, count] of tf) {
        const list = postings.get(term) ?? []
        list.push({ docId: doc.id, tf: count, fieldBoost: boost })
        postings.set(term, list)
        if (!seen.has(term)) {
          df.set(term, (df.get(term) ?? 0) + 1)
          seen.add(term)
        }
      }
    }
  }

  const N = docs.length || 1

  function search(query: string, limit = 20): Array<{ id: string; score: number; doc: SearchDoc }> {
    const tokens = expandQuery(tokenize(query))
    if (!tokens.length) return []
    const scores = new Map<string, number>()
    for (const term of tokens) {
      const posts = postings.get(term) ?? []
      const n = df.get(term) ?? 0
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5))
      for (const p of posts) {
        const tfNorm = (p.tf * (1.2 + 1)) / (p.tf + 1.2)
        const add = idf * tfNorm * p.fieldBoost
        scores.set(p.docId, (scores.get(p.docId) ?? 0) + add)
      }
    }
    return [...scores.entries()]
      .map(([id, score]) => ({ id, score, doc: docMap.get(id)! }))
      .filter((x) => x.doc)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  function autocomplete(prefix: string, limit = 8): string[] {
    const p = prefix.toLowerCase().trim()
    if (p.length < 2) return []
    const terms = [...postings.keys()].filter((t) => t.startsWith(p)).slice(0, limit)
    return terms
  }

  return { search, autocomplete, size: docs.length }
}

export type SearchIndex = ReturnType<typeof buildSearchIndex>

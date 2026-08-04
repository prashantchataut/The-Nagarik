/**
 * Preeti → Unicode converter for newsroom drafts.
 * Token map ordered longest-first. Not exhaustive for every legacy edge case.
 */

const TOKEN_MAP: Array<[string, string]> = [
  ['v|m', 'ज्ञ'],
  ['V|m', 'ज्ञ'],
  ['k|f', 'क्ष'],
  ['K|f', 'क्ष'],
  ['If]', 'ऋ'],
  ['cf]', 'औ'],
  ['c]', 'औ'],
  ['cf', 'ओ'],
  ['Pm', 'ै'],
  ['km', 'फ'],
  ['kmf', 'फा'],
  ['Qm', 'क्त'],
  ['qm', 'त्र'],
  ['Em', 'झ'],
  ['em', 'झ'],
  ['0f', 'ण'],
  ['If', 'ष'],
  ['if', 'ष'],
  ['sf', 'श'],
  ['Sf', 'ष'],
  ['c', 'ब'],
  ['C', 'भ'],
  ['P', 'फ'],
  ['n', 'न'],
  ['g', 'ग'],
  ['G', 'घ'],
  ['h', 'ह'],
  ['j', 'ज'],
  ['J', 'झ'],
  ['k', 'प'],
  ['l', 'ल'],
  ['m', 'म'],
  ['N', 'ण'],
  ['o', 'ो'],
  ['O', 'ौ'],
  ['p', 'े'],
  ['q', 'त'],
  ['Q', 'थ'],
  ['r', 'च'],
  ['R', 'छ'],
  ['s', 'स'],
  ['S', 'श'],
  ['t', 'ट'],
  ['T', 'ठ'],
  ['u', 'उ'],
  ['U', 'ऊ'],
  ['v', 'व'],
  ['V', 'ढ'],
  ['w', 'ध'],
  ['W', 'ः'],
  ['x', 'अ'],
  ['X', 'आ'],
  ['y', 'य'],
  ['Y', 'ञ'],
  ['z', 'ा'],
  ['Z', 'ँ'],
  ['a', 'ा'],
  ['b', 'ि'],
  ['d', 'द'],
  ['e', 'े'],
  ['f', 'ि'],
  ['i', 'र'],
  ['K', 'फ'],
  ['L', 'ळ'],
  ['M', 'ं'],
  ['D', 'ड'],
  ['F', 'इ'],
  ['H', 'ः'],
  ['I', 'ई'],
  ['A', '।'],
  ['B', '१'],
  ['E', '३'],
  ['!', 'ज्ञ'],
  ['@', 'द्द'],
  ['#', 'घ'],
  ['$', 'द्ध'],
  ['%', 'छ'],
  ['^', 'ट्ट'],
  ['&', 'थ'],
  ['*', 'ड्ड'],
  ['(', 'ढ्ढ'],
  [')', 'ण्ण'],
  ['1', '१'],
  ['2', '२'],
  ['3', '३'],
  ['4', '४'],
  ['5', '५'],
  ['6', '६'],
  ['7', '७'],
  ['8', '८'],
  ['9', '९'],
  ['0', '०'],
]

TOKEN_MAP.sort((a, b) => b[0].length - a[0].length)

export function convertPreetiToUnicode(input: string): string {
  let out = input
  for (const [from, to] of TOKEN_MAP) {
    if (!from) continue
    out = out.split(from).join(to)
  }
  // Common legacy matra / reph cleanup
  out = out.replace(/ि([क-ह])/g, '$1ि')
  out = out.replace(/([क-ह])्र/g, 'र्$1')
  out = out.replace(/््+/g, '्')
  out = out.replace(/ +/g, ' ')
  return out.trim()
}

export const PREETI_SAMPLES = [
  { label: 'Sample A', preeti: 'g]kfn', unicode: 'नेपाल' },
  { label: 'Sample B', preeti: 's[i0f', unicode: 'समाचार' },
] as const

export const WORDS_PER_LINE = 9

export function fmtWords(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
  return String(n)
}

export function formatDate(date?: string): string {
  if (!date) return '—'
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

export function formatAuthor(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return name
  const [first, ...rest] = parts
  return `${rest.join(' ')}, ${first}`
}

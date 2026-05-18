export const WORDS_PER_LINE = 9

export const LANGUAGES: { flag: string; label: string }[] = [
  { flag: '🇪🇸', label: 'Español' },
  { flag: '🇬🇧', label: 'Inglés' },
  { flag: '🇫🇷', label: 'Francés' },
  { flag: '🇩🇪', label: 'Alemán' },
  { flag: '🇮🇹', label: 'Italiano' },
  { flag: '🇵🇹', label: 'Portugués' },
  { flag: '🇷🇺', label: 'Ruso' },
  { flag: '🇨🇳', label: 'Chino' },
  { flag: '🇯🇵', label: 'Japonés' },
  { flag: '🇰🇷', label: 'Coreano' },
  { flag: '🇸🇦', label: 'Árabe' },
  { flag: '🇮🇳', label: 'Hindi' },
  { flag: '🇳🇱', label: 'Neerlandés' },
  { flag: '🇸🇪', label: 'Sueco' },
  { flag: '🇳🇴', label: 'Noruego' },
  { flag: '🇩🇰', label: 'Danés' },
  { flag: '🇵🇱', label: 'Polaco' },
  { flag: '🇨🇿', label: 'Checo' },
  { flag: '🇬🇷', label: 'Griego' },
  { flag: '🇹🇷', label: 'Turco' },
]

export const LANGUAGE_FLAG: Record<string, string> = Object.fromEntries(
  LANGUAGES.map((l) => [l.label, l.flag])
)

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

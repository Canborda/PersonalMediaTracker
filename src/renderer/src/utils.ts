import type { Book, BookStatus } from '../../shared/types'
import { getStatus } from '../../shared/types'

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

export type SortKey = 'status' | 'title' | 'author' | 'year' | 'startDate' | 'endDate' | 'score'
export type SortDir = 'asc' | 'desc'

const STATUS_ORDER: Record<BookStatus, number> = {
  'in-progress': 0, 'pending': 1, 'finished': 2, 'abandoned': 3,
}

function authorSortKey(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts.length > 1 ? parts.slice(1).join(' ') : name
}

export function sortBooks(books: Book[], key: SortKey, dir: SortDir): Book[] {
  return [...books].sort((a, b) => {
    let cmp = 0
    switch (key) {
      case 'status': cmp = STATUS_ORDER[getStatus(a)] - STATUS_ORDER[getStatus(b)]; break
      case 'title': cmp = a.title.localeCompare(b.title); break
      case 'author': cmp = authorSortKey(a.author).localeCompare(authorSortKey(b.author)); break
      case 'score': {
        if (a.score === undefined && b.score === undefined) { cmp = 0; break }
        if (a.score === undefined) return 1
        if (b.score === undefined) return -1
        cmp = a.score - b.score; break
      }
      case 'year': cmp = a.year - b.year; break
      case 'startDate': {
        const aD = a.readings[0]?.startDate, bD = b.readings[0]?.startDate
        if (!aD && !bD) { cmp = 0; break }
        if (!aD) return 1; if (!bD) return -1
        cmp = aD < bD ? -1 : aD > bD ? 1 : 0; break
      }
      case 'endDate': {
        const aD = a.readings[0]?.endDate, bD = b.readings[0]?.endDate
        if (!aD && !bD) { cmp = 0; break }
        if (!aD) return 1; if (!bD) return -1
        cmp = aD < bD ? -1 : aD > bD ? 1 : 0; break
      }
    }
    return dir === 'asc' ? cmp : -cmp
  })
}

import React, { useMemo } from 'react'
import type { Book } from '../../../shared/types'

interface Stats {
  finishedCount: number
  totalPages: number
  totalWords: number
  uniqueAuthors: number
}

function buildStats(books: Book[]): Stats {
  const aSet = new Set<string>()
  let totalPages = 0
  let totalWords = 0
  for (const book of books) {
    const n = book.readings.filter(r => r.completed === true).length
    if (n === 0) continue
    totalPages += (book.pages ?? 0) * n
    totalWords += (book.pages ?? 0) * (book.linesPerPage ?? 30) * 10 * n
    aSet.add(book.author)
  }
  return {
    finishedCount: books.filter(b => b.readings.some(r => r.completed === true)).length,
    totalPages,
    totalWords,
    uniqueAuthors: aSet.size,
  }
}

function fmt(n: number): string {
  return n.toLocaleString('es-CO')
}

function fmtWords(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
  return String(n)
}

function KpiCard({ label, value }: { label: string; value: string | number }): React.JSX.Element {
  return (
    <div className="stat-card">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

export default function StatsView({ books }: { books: Book[] }): React.JSX.Element {
  const stats = useMemo(() => buildStats(books), [books])
  return (
    <div className="stats-view">
      <div className="stats-kpis">
        <KpiCard label="Libros terminados" value={stats.finishedCount} />
        <KpiCard label="Páginas leídas" value={fmt(stats.totalPages)} />
        <KpiCard label="~Palabras leídas" value={fmtWords(stats.totalWords)} />
        <KpiCard label="Autores leídos" value={stats.uniqueAuthors} />
      </div>
    </div>
  )
}

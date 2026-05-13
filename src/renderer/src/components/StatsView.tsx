import React, { useMemo, useState } from 'react'
import type { Book, Reading } from '../../../shared/types'
import { WORDS_PER_LINE } from '../utils'
import WPDChart, { buildSegments } from './charts/WPDChart'
import type { Segment } from './charts/WPDChart'

interface Stats {
  finishedCount: number
  totalPages: number
  totalWords: number
  uniqueAuthors: number
  segments: Segment[]
}

function buildStats(books: Book[]): Stats {
  const aSet = new Set<string>()
  let totalPages = 0
  let totalWords = 0

  for (const book of books) {
    const done = book.readings.filter(
      (r): r is Reading & { endDate: string } =>
        r.completed === true && !!r.startDate && !!r.endDate
    )
    const n = done.length
    if (n > 0) {
      totalPages += (book.pages ?? 0) * n
      totalWords += (book.pages ?? 0) * (book.linesPerPage ?? 30) * WORDS_PER_LINE * n
      aSet.add(book.author)
    }
  }

  return {
    finishedCount: books.filter((b) => b.readings.some((r) => r.completed === true)).length,
    totalPages,
    totalWords,
    uniqueAuthors: aSet.size,
    segments: buildSegments(books),
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

interface ChartSlide {
  title: string
  el: React.JSX.Element
}

function StatsCarousel({ charts }: { charts: ChartSlide[] }): React.JSX.Element {
  const [idx, setIdx] = useState(0)
  const n = charts.length
  return (
    <div className="stats-carousel">
      <div className="stats-carousel-nav">
        <button className="stats-carousel-arrow" onClick={() => setIdx((i) => (i - 1 + n) % n)}>‹</button>
        <span className="stats-section-title">{charts[idx].title}</span>
        <button className="stats-carousel-arrow" onClick={() => setIdx((i) => (i + 1) % n)}>›</button>
      </div>
      <div className="stats-carousel-body" key={idx}>{charts[idx].el}</div>
      <div className="stats-carousel-dots">
        {charts.map((_, i) => (
          <button key={i} className={`stats-carousel-dot${i === idx ? ' active' : ''}`} onClick={() => setIdx(i)} />
        ))}
      </div>
    </div>
  )
}

export default function StatsView({ books }: { books: Book[] }): React.JSX.Element {
  const stats = useMemo(() => buildStats(books), [books])
  const charts: ChartSlide[] = [
    { title: 'Palabras por día', el: <WPDChart segments={stats.segments} /> },
  ]
  return (
    <div className="stats-view">
      <div className="stats-kpis">
        <KpiCard label="Libros terminados" value={stats.finishedCount} />
        <KpiCard label="Páginas leídas" value={fmt(stats.totalPages)} />
        <KpiCard label="~Palabras leídas" value={fmtWords(stats.totalWords)} />
        <KpiCard label="Autores leídos" value={stats.uniqueAuthors} />
      </div>
      <StatsCarousel charts={charts} />
    </div>
  )
}

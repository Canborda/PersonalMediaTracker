import React, { useEffect, useMemo, useState } from 'react'
import type { Book, Reading } from '../../../shared/types'
import { WORDS_PER_LINE, fmtWords } from '../utils'
import WPDChart, { buildSegments } from './charts/WPDChart'
import type { Segment } from './charts/WPDChart'
import AuthorsChart from './charts/AuthorsChart'

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

function StatsCarousel({ charts, paused }: { charts: ChartSlide[]; paused: boolean }): React.JSX.Element {
  const [idx, setIdx] = useState(0)
  const [dir, setDir] = useState<'left' | 'right'>('right')
  const n = charts.length

  const goTo = (newIdx: number, direction: 'left' | 'right'): void => {
    setDir(direction)
    setIdx(newIdx)
  }

  useEffect(() => {
    if (paused || n <= 1) return
    const id = setInterval(() => {
      setDir('right')
      setIdx((i) => (i + 1) % n)
    }, 10_000)
    return () => clearInterval(id)
  }, [paused, n])

  return (
    <div className="stats-carousel">
      <div className="stats-carousel-nav">
        <button className="stats-carousel-arrow" onClick={() => goTo((idx - 1 + n) % n, 'left')}>‹</button>
        <span className="stats-section-title">{charts[idx].title}</span>
        <button className="stats-carousel-arrow" onClick={() => goTo((idx + 1) % n, 'right')}>›</button>
      </div>
      <div className={`stats-carousel-body stats-carousel-${dir}`} key={idx}>{charts[idx].el}</div>
      <div className="stats-carousel-dots">
        {charts.map((_, i) => (
          <button
            key={i}
            className={`stats-carousel-dot${i === idx ? ' active' : ''}`}
            onClick={() => goTo(i, i > idx ? 'right' : 'left')}
          />
        ))}
      </div>
    </div>
  )
}

export default function StatsView({ books }: { books: Book[] }): React.JSX.Element {
  const stats = useMemo(() => buildStats(books), [books])
  const [hovered, setHovered] = useState(false)
  const charts: ChartSlide[] = [
    { title: 'Palabras por día', el: <WPDChart segments={stats.segments} /> },
    { title: 'Autores más leídos', el: <AuthorsChart books={books} /> },
  ]
  return (
    <div
      className="stats-view"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="stats-kpis">
        <KpiCard label="Libros terminados" value={stats.finishedCount} />
        <KpiCard label="Páginas leídas" value={fmt(stats.totalPages)} />
        <KpiCard label="~Palabras leídas" value={fmtWords(stats.totalWords)} />
        <KpiCard label="Autores leídos" value={stats.uniqueAuthors} />
      </div>
      <StatsCarousel charts={charts} paused={hovered} />
    </div>
  )
}

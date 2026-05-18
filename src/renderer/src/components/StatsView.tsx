import React, { useEffect, useMemo, useState } from 'react'
import type { Book, Reading } from '../../../shared/types'
import { WORDS_PER_LINE, fmtWords } from '../utils'
import WPDChart, { buildSegments } from './charts/WPDChart'
import type { Segment } from './charts/WPDChart'
import AuthorsChart from './charts/AuthorsChart'
import CategoryChart from './charts/CategoryChart'
import LanguageChart from './charts/LanguageChart'
import LongestBooksChart from './charts/LongestBooksChart'
import TagsChart from './charts/TagsChart'

interface Stats {
  finishedCount: number
  totalPages: number
  totalWords: number
  uniqueAuthors: number
  segments: Segment[]
  avgDays: number
  avgWPD: number
}

function pd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function buildStats(books: Book[]): Stats {
  const aSet = new Set<string>()
  let totalPages = 0
  let totalWords = 0
  let totalDaysSum = 0
  let wpdSum = 0
  let doneCount = 0

  for (const book of books) {
    const done = book.readings.filter(
      (r): r is Reading & { endDate: string; startDate: string } =>
        r.completed === true && !!r.startDate && !!r.endDate
    )
    const n = done.length
    if (n > 0) {
      totalPages += (book.additionalData.pages ?? 0) * n
      totalWords += (book.additionalData.pages ?? 0) * (book.additionalData.linesPerPage ?? 30) * WORDS_PER_LINE * n
      aSet.add(book.author)
      const words = (book.additionalData.pages ?? 0) * (book.additionalData.linesPerPage ?? 30) * WORDS_PER_LINE
      for (const r of done) {
        const days = Math.max(1, Math.round((pd(r.endDate).getTime() - pd(r.startDate).getTime()) / 86400000))
        totalDaysSum += days
        doneCount++
        if (words > 0) wpdSum += words / days
      }
    }
  }

  return {
    finishedCount: books.filter((b) => b.readings.some((r) => r.completed === true)).length,
    totalPages,
    totalWords,
    uniqueAuthors: aSet.size,
    segments: buildSegments(books),
    avgDays: doneCount > 0 ? Math.round(totalDaysSum / doneCount) : 0,
    avgWPD: doneCount > 0 ? Math.round(wpdSum / doneCount) : 0,
  }
}

function fmt(n: number): string {
  return n.toLocaleString('es-CO')
}

function KpiCard({ label, value, tooltip }: { label: string; value: string | number; tooltip: string }): React.JSX.Element {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  return (
    <div
      className="stat-card"
      onMouseEnter={(e) => setPos({ x: e.clientX, y: e.clientY })}
      onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setPos(null)}
    >
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {pos && (
        <div
          className="stats-tooltip kpi-tooltip"
          style={{
            left: pos.x + 14 + 220 > window.innerWidth ? pos.x - 14 - 220 : pos.x + 14,
            top: pos.y - 36,
          }}
        >
          {tooltip}
        </div>
      )}
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
    { title: 'Libros más largos', el: <LongestBooksChart books={books} /> },
    { title: 'Categorías', el: <CategoryChart books={books} /> },
    { title: 'Idioma original', el: <LanguageChart books={books} /> },
    { title: 'Tags', el: <TagsChart books={books} /> },
  ]
  return (
    <div
      className="stats-view"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="stats-kpis">
        <KpiCard label="Libros terminados" value={stats.finishedCount} tooltip="Libros con al menos una lectura marcada como terminada" />
        <KpiCard label="Autores leídos" value={stats.uniqueAuthors} tooltip="Autores únicos con al menos un libro terminado" />
        <KpiCard label="Páginas leídas" value={fmt(stats.totalPages)} tooltip="Total de páginas × lecturas terminadas por libro" />
        <KpiCard label="Días / libro" value={stats.avgDays || '—'} tooltip="Promedio de días entre inicio y fin por lectura terminada" />
        <KpiCard label="~Palabras leídas" value={fmtWords(stats.totalWords)} tooltip="Estimado: páginas × líneas por página × 9 palabras por línea" />
        <KpiCard label="~WPD prom." value={stats.avgWPD ? fmtWords(stats.avgWPD) : '—'} tooltip="Promedio de palabras por día estimadas por lectura terminada" />
      </div>
      <StatsCarousel charts={charts} paused={hovered} />
    </div>
  )
}

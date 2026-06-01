import React, { useMemo, useState } from 'react'
import type { Book, Reading } from '../../../shared/types'
import { WORDS_PER_LINE, fmtWords } from '../utils'

interface Stats {
  finishedCount: number
  totalPages: number
  totalWords: number
  uniqueAuthors: number
  avgDays: number
  avgWPD: number
}

function pd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function buildStats(books: Book[]): Stats {
  const aSet = new Set<string>()
  let totalPages = 0, totalWords = 0, totalDaysSum = 0, wpdSum = 0, doneCount = 0
  for (const book of books) {
    const done = book.readings.filter(
      (r): r is Reading & { endDate: string; startDate: string } =>
        r.completed === true && !!r.startDate && !!r.endDate
    )
    if (done.length > 0) {
      totalPages += (book.additionalData.pages ?? 0) * done.length
      totalWords += (book.additionalData.pages ?? 0) * (book.additionalData.linesPerPage ?? 30) * WORDS_PER_LINE * done.length
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

function SettingsIcon(): React.JSX.Element {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

interface Props {
  books: Book[]
  onAddBook: () => void
  onSettings: () => void
}

export default function HomeView({ books, onAddBook, onSettings }: Props): React.JSX.Element {
  const stats = useMemo(() => buildStats(books), [books])
  return (
    <div className="home-view">
      <div className="home-header">
        <h1>Mis libros</h1>
        <div className="home-header-actions">
          <button className="btn-primary" onClick={onAddBook}>+ Agregar libro</button>
          <button className="btn-icon" onClick={onSettings} title="Ajustes"><SettingsIcon /></button>
        </div>
      </div>
      <div className="stats-kpis">
        <KpiCard label="Libros terminados" value={stats.finishedCount} tooltip="Libros con al menos una lectura marcada como terminada" />
        <KpiCard label="Autores leídos" value={stats.uniqueAuthors} tooltip="Autores únicos con al menos un libro terminado" />
        <KpiCard label="Páginas leídas" value={fmt(stats.totalPages)} tooltip="Total de páginas × lecturas terminadas por libro" />
        <KpiCard label="Días / libro" value={stats.avgDays || '—'} tooltip="Promedio de días entre inicio y fin por lectura terminada" />
        <KpiCard label="~Palabras leídas" value={fmtWords(stats.totalWords)} tooltip="Estimado: páginas × líneas por página × 9 palabras por línea" />
        <KpiCard label="~WPD prom." value={stats.avgWPD ? fmtWords(stats.avgWPD) : '—'} tooltip="Promedio de palabras por día estimadas por lectura terminada" />
      </div>
      <div className="home-carousel">
      </div>
    </div>
  )
}

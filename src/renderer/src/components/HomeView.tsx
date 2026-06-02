import React, { useMemo, useState, useEffect, useCallback } from 'react'
import type { Book, BookMeta, Reading } from '../../../shared/types'
import ViewHeader from './ViewHeader'
import { HomeIcon } from '../icons'
import { getStatus, STATUS_LABEL } from '../../../shared/types'
import { WORDS_PER_LINE, fmtWords, daysBetween } from '../utils'

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
        const days = daysBetween(r.startDate, r.endDate)
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

type CarouselBook = Book & { meta: BookMeta }

interface Props {
  books: Book[]
  onAddBook: () => void
  onSettings: () => void
  onSelectBook: (id: string) => void
}

export default function HomeView({ books, onAddBook, onSettings, onSelectBook }: Props): React.JSX.Element {
  const stats = useMemo(() => buildStats(books), [books])
  const [carouselBooks, setCarouselBooks] = useState<CarouselBook[]>([])
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (books.length === 0) { setCarouselBooks([]); return }
    Promise.all(
      books.map(async (b) => {
        const meta = await window.electron.getBookMeta(b.id)
        return meta ? { ...b, meta } : null
      })
    ).then((results) => {
      const withMeta = results.filter((r): r is CarouselBook => r !== null)
      for (let i = withMeta.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[withMeta[i], withMeta[j]] = [withMeta[j], withMeta[i]]
      }
      setCarouselBooks(withMeta.slice(0, 5))
      setIdx(0)
    })
  }, [books])

  const [dir, setDir] = useState<'left' | 'right'>('right')

  useEffect(() => {
    if (paused || carouselBooks.length <= 1) return
    const id = setInterval(() => {
      setDir('right')
      setIdx((i) => (i + 1) % carouselBooks.length)
    }, 10_000)
    return () => clearInterval(id)
  }, [paused, carouselBooks.length])

  const n = carouselBooks.length
  const go = useCallback((newIdx: number, direction: 'left' | 'right' = 'right') => {
    setDir(direction)
    setIdx(((newIdx % n) + n) % n)
  }, [n])
  const current = carouselBooks[idx]

  return (
    <div className="home-view">
      <ViewHeader title="Mi estantería" icon={<HomeIcon />} />

      <div className="stats-kpis">
        <KpiCard label="Libros terminados" value={stats.finishedCount} tooltip="Libros con al menos una lectura marcada como terminada" />
        <KpiCard label="Autores leídos" value={stats.uniqueAuthors} tooltip="Autores únicos con al menos un libro terminado" />
        <KpiCard label="Páginas leídas" value={fmt(stats.totalPages)} tooltip="Total de páginas × lecturas terminadas por libro" />
        <KpiCard label="Días / libro" value={stats.avgDays || '—'} tooltip="Promedio de días entre inicio y fin por lectura terminada" />
        <KpiCard label="~Palabras leídas" value={fmtWords(stats.totalWords)} tooltip="Estimado: páginas × líneas por página × 9 palabras por línea" />
        <KpiCard label="~WPD prom." value={stats.avgWPD ? fmtWords(stats.avgWPD) : '—'} tooltip="Promedio de palabras por día estimadas por lectura terminada" />
      </div>

      <div
        className="home-carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {n === 0 ? (
          <div className="carousel-empty">
            Busca información de tus libros para verlos aquí
          </div>
        ) : (
          <>
            <div className="carousel-track">
              <button className="carousel-arrow" onClick={() => go(idx - 1, 'left')}>‹</button>
              <div key={`${idx}-${dir}`} className={`carousel-card carousel-card-${dir}`} onClick={() => onSelectBook(current.id)}>
                <span className={`badge badge-${getStatus(current)} carousel-status`}>{STATUS_LABEL[getStatus(current)]}</span>
                <div className="carousel-cover">
                  {current.meta.cover
                    ? <img src={current.meta.cover} alt={current.title} />
                    : <div className="carousel-cover-placeholder">{current.title[0]}</div>
                  }
                </div>
                <div className="carousel-body">
                  <div className="carousel-title">
                    {current.title}
                    {current.additionalData.originalTitle && current.additionalData.originalTitle !== current.title && (
                      <span className="carousel-original-title"> ({current.additionalData.originalTitle})</span>
                    )}
                  </div>
                  <div className="carousel-meta-row">
                    <span className="carousel-author">{current.author}</span>
                    <span className="carousel-year">{current.year}</span>
                  </div>
                  {current.meta.description && (
                    <p className="carousel-description">{current.meta.description}</p>
                  )}
                </div>
              </div>
              <button className="carousel-arrow" onClick={() => go(idx + 1, 'right')}>›</button>
            </div>
            <div className="carousel-dots">
              {carouselBooks.map((_, i) => (
                <button key={i} className={`carousel-dot${i === idx ? ' active' : ''}`} onClick={() => go(i)} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="home-actions">
        <button className="home-action-tile home-action-add" onClick={onAddBook}>
          <span className="home-action-plus">+</span>
          <span>Agregar libro</span>
        </button>
        <button className="home-action-tile home-action-settings" onClick={onSettings}>
          <SettingsIcon />
          <span>Ajustes</span>
        </button>
      </div>
    </div>
  )
}

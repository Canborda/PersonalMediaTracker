import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import type { Book, BookMeta, Reading } from '../../../shared/types'
import appIcon from '../../../assets/icon.svg'
import claudeCodeIcon from '../../../assets/claudecode-icon.png'
import { getStatus, STATUS_LABEL } from '../../../shared/types'
import { WORDS_PER_LINE, fmtWords, daysBetween, formatDate } from '../utils'

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

function dk(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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

const TL_W = 700, TL_BAR_H = 22, TL_ROW_H = 30
const TL_PL = 8, TL_PR = 8, TL_PT = 8, TL_PB = 22

function HomeTimeline({ books }: { books: Book[] }): React.JSX.Element {
  const [hovered, setHovered] = useState<number | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const [cursorX, setCursorX] = useState<number | null>(null)

  const { flatItems, months, windowStartTs, todayTs, TH } = useMemo(() => {
    const today = new Date()
    const windowStart = new Date(today.getFullYear(), today.getMonth() - 5, 1)
    const windowStartTs = windowStart.getTime()
    const todayTs = today.getTime()

    const raw: { title: string; author: string; startTs: number; endTs: number; startDate: string; endDate: string; days: number; inProgress: boolean }[] = []
    for (const book of books) {
      for (const r of book.readings) {
        if (!r.startDate) continue
        const rawStart = pd(r.startDate).getTime()
        const rawEnd = r.endDate ? pd(r.endDate).getTime() : todayTs
        if (rawEnd < windowStartTs || rawStart > todayTs) continue
        raw.push({
          title: book.title, author: book.author,
          startTs: Math.max(rawStart, windowStartTs),
          endTs: Math.min(rawEnd, todayTs),
          startDate: r.startDate,
          endDate: r.endDate ?? dk(today),
          days: Math.max(1, Math.round((rawEnd - rawStart) / 86400000)),
          inProgress: !r.endDate,
        })
      }
    }
    raw.sort((a, b) => a.startTs - b.startTs)

    const rowEnds: number[] = []
    const flatItems = raw.map((item) => {
      let row = rowEnds.findIndex((end) => end <= item.startTs)
      if (row === -1) { row = rowEnds.length; rowEnds.push(0) }
      rowEnds[row] = item.endTs
      return { ...item, row }
    })

    const numRows = Math.max(rowEnds.length, 1)
    const TH = TL_PT + numRows * TL_ROW_H + TL_PB

    const months: { ts: number; label: string }[] = []
    const m = new Date(windowStart.getFullYear(), windowStart.getMonth(), 1)
    while (m.getTime() <= todayTs) {
      months.push({ ts: m.getTime(), label: m.toLocaleString('es-CO', { month: 'short' }) })
      m.setMonth(m.getMonth() + 1)
    }

    return { flatItems, months, windowStartTs, todayTs, TH }
  }, [books])

  const IW = TL_W - TL_PL - TL_PR
  const xSpan = Math.max(todayTs - windowStartTs, 1)
  const toX = (ts: number): number => TL_PL + ((ts - windowStartTs) / xSpan) * IW
  const toBarY = (row: number): number => TL_PT + row * TL_ROW_H + (TL_ROW_H - TL_BAR_H) / 2

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>): void => {
    const rect = e.currentTarget.getBoundingClientRect()
    const svgX = ((e.clientX - rect.left) / rect.width) * TL_W
    const svgY = ((e.clientY - rect.top) / rect.height) * TH
    setCursorX(svgX >= TL_PL && svgX <= TL_PL + IW ? svgX : null)
    let found = -1
    flatItems.forEach((item, i) => {
      const x1 = toX(item.startTs), x2 = toX(item.endTs)
      const y = toBarY(item.row)
      if (svgX >= x1 && svgX <= x2 && svgY >= y && svgY <= y + TL_BAR_H) found = i
    })
    if (found >= 0) { setHovered(found); setTooltipPos({ x: e.clientX, y: e.clientY }) }
    else { setHovered(null); setTooltipPos(null) }
  }

  const hItem = hovered !== null ? flatItems[hovered] : null

  if (flatItems.length === 0) {
    return <div className="home-timeline-empty">Sin lecturas en los últimos 6 meses</div>
  }

  return (
    <div className="home-timeline">
      <svg
        viewBox={`0 0 ${TL_W} ${TH}`}
        className="home-timeline-svg"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setHovered(null); setTooltipPos(null); setCursorX(null) }}
      >
        <defs>
          <linearGradient id="tl-bar-grad" x1={TL_PL} y1="0" x2={TL_PL + IW} y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
          {flatItems.map((item, i) => {
            const x1 = toX(item.startTs), x2 = toX(item.endTs)
            const y = toBarY(item.row)
            return (
              <clipPath key={i} id={`tl-clip-${i}`}>
                <rect x={x1 + 3} y={y} width={Math.max(0, x2 - x1 - 6)} height={TL_BAR_H} />
              </clipPath>
            )
          })}
        </defs>

        {months.map((mo, i) => {
          const x = toX(mo.ts)
          return (
            <g key={i}>
              <line x1={x} y1={TL_PT} x2={x} y2={TH - TL_PB} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <text x={x} y={TH - 5} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.3)">{mo.label}</text>
            </g>
          )
        })}

        <line x1={toX(todayTs)} y1={TL_PT} x2={toX(todayTs)} y2={TH - TL_PB} stroke="rgba(59,130,246,0.5)" strokeWidth="1" strokeDasharray="3,2" />

        {flatItems.map((item, i) => {
          const x1 = toX(item.startTs), x2 = toX(item.endTs)
          const y = toBarY(item.row)
          const w = Math.max(x2 - x1, 3)
          const isHov = hovered === i
          return (
            <rect key={i} x={x1} y={y} width={w} height={TL_BAR_H} rx="4"
              fill={item.inProgress ? (isHov ? 'rgba(6,182,212,0.4)' : 'rgba(6,182,212,0.2)') : (isHov ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.25)')}
              stroke={item.inProgress ? '#06b6d4' : (isHov ? '#60a5fa' : 'url(#tl-bar-grad)')}
              strokeWidth="0.8"
              strokeDasharray={item.inProgress ? '4,2' : undefined}
            />
          )
        })}

        {flatItems.map((item, i) => {
          const x1 = toX(item.startTs), x2 = toX(item.endTs)
          const y = toBarY(item.row)
          const w = Math.max(x2 - x1, 3)
          const isHov = hovered === i
          if (w < 10) return null
          return (
            <text key={i} x={x1 + 4} y={y + TL_BAR_H / 2 + 3} fontSize="6" fill={isHov ? '#fff' : 'rgba(226,226,236,0.85)'} clipPath={`url(#tl-clip-${i})`}>
              {item.title}
            </text>
          )
        })}

        {hItem && (
          <line x1={toX(hItem.startTs)} y1={TL_PT} x2={toX(hItem.startTs)} y2={TH - TL_PB} stroke="rgba(147,197,253,0.25)" strokeWidth="1" strokeDasharray="3,3" />
        )}

        {cursorX !== null && (() => {
          const ts = windowStartTs + ((cursorX - TL_PL) / IW) * xSpan
          const d = new Date(ts)
          const label = `${d.getDate()} ${d.toLocaleString('es-CO', { month: 'short' })}`
          return (
            <g pointerEvents="none">
              <line x1={cursorX} y1={TL_PT} x2={cursorX} y2={TH - TL_PB} stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="3,2" />
              <rect x={cursorX - 16} y={TH - TL_PB + 2} width="32" height="12" rx="2" fill="var(--surface-2)" />
              <text x={cursorX} y={TH - TL_PB + 10} textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.7)">{label}</text>
            </g>
          )
        })()}
      </svg>

      {hItem && tooltipPos && (
        <div
          className="stats-tooltip"
          style={{
            left: tooltipPos.x + 14 + 240 > window.innerWidth ? tooltipPos.x - 14 - 240 : tooltipPos.x + 14,
            top: tooltipPos.y - 56,
          }}
        >
          <div className="stats-tooltip-title">{hItem.title}</div>
          <div className="stats-tooltip-muted">{hItem.author}</div>
          <div className="stats-tooltip-row">
            <span>{hItem.days} días</span>
            {hItem.inProgress && <span className="stats-tooltip-muted">en progreso</span>}
          </div>
          <div className="stats-tooltip-muted">
            {formatDate(hItem.startDate)} → {hItem.inProgress ? 'hoy' : formatDate(hItem.endDate)}
          </div>
        </div>
      )}
    </div>
  )
}

function HomePaceMap({ books }: { books: Book[] }): React.JSX.Element {
  const [hoveredDay, setHoveredDay] = useState<{ key: string; titles: string[]; pace: number } | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)

  const { weeks, maxPace } = useMemo(() => {
    const dayMap = new Map<string, { pace: number; titles: Set<string> }>()
    const today = new Date()
    const todayKey = dk(today)

    for (const book of books) {
      const pages = book.additionalData.pages ?? 0
      if (!pages) continue
      for (const r of book.readings) {
        if (!r.startDate) continue
        const endStr = r.endDate ?? todayKey
        const days = Math.max(daysBetween(r.startDate, endStr), 1)
        const pacePerDay = pages / days
        const start = pd(r.startDate)
        const end = pd(endStr)
        for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
          const key = dk(dt)
          const entry = dayMap.get(key) ?? { pace: 0, titles: new Set<string>() }
          entry.pace += pacePerDay
          entry.titles.add(book.title)
          dayMap.set(key, entry)
        }
      }
    }

    const startDay = new Date(today)
    startDay.setDate(startDay.getDate() - today.getDay() - 79 * 7)

    const cells: { key: string; pace: number; titles: string[] }[] = []
    for (let dt = new Date(startDay); dt <= today; dt.setDate(dt.getDate() + 1)) {
      const key = dk(dt)
      const entry = dayMap.get(key)
      cells.push({ key, pace: entry?.pace ?? 0, titles: entry ? Array.from(entry.titles) : [] })
    }

    const maxPace = Math.max(...cells.map((c) => c.pace), 1)
    const weeks: { key: string; pace: number; titles: string[]; isYearStart: boolean }[][] = []
    for (let i = 0; i < cells.length; i += 7) {
      const week = cells.slice(i, i + 7)
      const prevWeekFirstKey = i > 0 ? cells[i - 7]?.key : null
      const isYearStart = prevWeekFirstKey ? prevWeekFirstKey.slice(0, 4) !== week[0]?.key.slice(0, 4) : false
      weeks.push(week.map((c, j) => ({ ...c, isYearStart: j === 0 ? isYearStart : false })))
    }
    return { weeks, maxPace }
  }, [books])

  const fmtDayKey = (key: string): string => {
    const [y, m, d] = key.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    return `${d} ${date.toLocaleString('es-CO', { month: 'short' })} ${y}`
  }

  return (
    <div className="home-pace-map">
      <div className="pace-grid">
        {weeks.map((week, wi) => {
          const isYearStart = week[0]?.isYearStart ?? false
          const year = week[0]?.key.slice(0, 4) ?? ''
          return (
            <div
              key={wi}
              className={`pace-week${isYearStart ? ' pace-year-start' : ''}`}
              data-year={isYearStart ? year : undefined}
            >
              {week.map((day) => (
                <div
                  key={day.key}
                  className="pace-cell"
                  data-active={day.pace > 0 ? '' : undefined}
                  style={day.pace > 0 ? { opacity: Math.max(0.18, day.pace / maxPace) } : undefined}
                  onMouseEnter={(e) => { setHoveredDay({ key: day.key, titles: day.titles, pace: day.pace }); setTooltipPos({ x: e.clientX, y: e.clientY }) }}
                  onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => { setHoveredDay(null); setTooltipPos(null) }}
                />
              ))}
            </div>
          )
        })}
      </div>

      {hoveredDay && tooltipPos && (
        <div
          className="stats-tooltip"
          style={{
            left: tooltipPos.x + 14 + 220 > window.innerWidth ? tooltipPos.x - 14 - 220 : tooltipPos.x + 14,
            top: tooltipPos.y - 56,
          }}
        >
          <div className="stats-tooltip-title">{fmtDayKey(hoveredDay.key)}</div>
          {hoveredDay.titles.length > 0
            ? hoveredDay.titles.map((t, i) => <div key={i} className="stats-tooltip-muted">{t}</div>)
            : <div className="stats-tooltip-muted">Sin lectura</div>
          }
          {hoveredDay.pace > 0 && (
            <div className="stats-tooltip-row"><span>{Math.round(hoveredDay.pace)} p/d</span></div>
          )}
        </div>
      )}
    </div>
  )
}

type BookWithMeta = Book & { meta: BookMeta }

const PODIUM_ORDER = [1, 0, 2] as const

function HomePodium({ books, onSelectBook }: { books: Book[]; onSelectBook: (id: string) => void }): React.JSX.Element {
  const [podiumBooks, setPodiumBooks] = useState<BookWithMeta[]>([])
  const [tooltipBook, setTooltipBook] = useState<BookWithMeta | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const [hoveredRank, setHoveredRank] = useState<number | null>(null)

  const top3 = useMemo(() =>
    [...books]
      .filter((b) => b.score !== undefined)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 3),
    [books]
  )

  useEffect(() => {
    if (top3.length === 0) { setPodiumBooks([]); return }
    Promise.all(
      top3.map(async (b) => {
        const meta = await window.electron.getBookMeta(b.id)
        return { ...b, meta: meta ?? {} }
      })
    ).then((results) => setPodiumBooks(results as BookWithMeta[]))
  }, [top3])

  const MEDAL_COLORS = [
    'linear-gradient(135deg, #fde68a, #f59e0b, #b45309)',
    'linear-gradient(135deg, #f1f5f9, #94a3b8, #475569)',
    'linear-gradient(135deg, #c8733a, #9a3412, #7c2d12)',
  ]
  const BAR_COLORS = [
    'linear-gradient(135deg, rgba(253,230,138,0.5), rgba(245,158,11,0.38), rgba(180,83,9,0.28))',
    'linear-gradient(135deg, rgba(241,245,249,0.38), rgba(148,163,184,0.28), rgba(71,85,105,0.2))',
    'linear-gradient(135deg, rgba(200,115,58,0.42), rgba(154,52,18,0.3), rgba(124,45,18,0.2))',
  ]
  const MEDAL_LABELS = ['1°', '2°', '3°']
  const contentRef = useRef<HTMLDivElement>(null)
  const [barHeights, setBarHeights] = useState([72, 52, 38])

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const obs = new ResizeObserver(() => {
      const H = el.clientHeight
      const W = el.clientWidth
      const slotW = (W - 2 * 6) / 3
      const coverW = Math.max(0, slotW - 26)
      const coverH = coverW * 1.5
      const bar1 = Math.max(16, Math.round(H - 4 - 20 - 4 - coverH - 4))
      setBarHeights([bar1, Math.round(bar1 * 52 / 72), Math.round(bar1 * 38 / 72)])
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [podiumBooks.length])

  if (top3.length === 0) {
    return (
      <div className="podium-empty">
        Puntúa libros para verlos aquí
      </div>
    )
  }

  if (podiumBooks.length === 0) return null

  return (
    <div className="podium-content" ref={contentRef}>
      {PODIUM_ORDER.map((rank) => {
        const book = podiumBooks[rank]
        if (!book) return <div key={rank} className="podium-slot" />
        return (
          <div
            key={rank}
            className="podium-slot"
            onClick={() => onSelectBook(book.id)}
            onMouseEnter={(e) => { setTooltipBook(book); setTooltipPos({ x: e.clientX, y: e.clientY }); setHoveredRank(rank) }}
            onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
            onMouseLeave={() => { setTooltipBook(null); setTooltipPos(null); setHoveredRank(null) }}
          >
            <div className="podium-spacer" />
            <div className="podium-medal" style={{ background: MEDAL_COLORS[rank] }}>{MEDAL_LABELS[rank]}</div>
            <div className="podium-cover">
              {book.meta.cover
                ? <img src={book.meta.cover} alt={book.title} />
                : <div className="podium-cover-placeholder">{book.title[0]}</div>
              }
            </div>
            <div className="podium-bar" style={{ height: barHeights[rank], background: hoveredRank === rank ? MEDAL_COLORS[rank] : BAR_COLORS[rank] }}>
              <span className="podium-bar-score">★ {(book.score ?? 0).toFixed(1)}</span>
            </div>
          </div>
        )
      })}
      {tooltipBook && tooltipPos && (
        <div
          className="stats-tooltip"
          style={{
            left: tooltipPos.x + 14 + 200 > window.innerWidth ? tooltipPos.x - 14 - 200 : tooltipPos.x + 14,
            top: tooltipPos.y - 56,
          }}
        >
          <div className="stats-tooltip-title">{tooltipBook.title}</div>
          <div className="stats-tooltip-muted">{tooltipBook.author}</div>
          <div className="stats-tooltip-muted">{tooltipBook.year}</div>
        </div>
      )}
    </div>
  )
}

type CarouselBook = BookWithMeta

interface Props {
  books: Book[]
  onSelectBook: (id: string) => void
}

export default function HomeView({ books, onSelectBook }: Props): React.JSX.Element {
  const stats = useMemo(() => buildStats(books), [books])
  const [carouselBooks, setCarouselBooks] = useState<CarouselBook[]>([])
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (books.length === 0) { setCarouselBooks([]); return }
    const finished = books.filter((b) => getStatus(b) === 'finished')
    Promise.all(
      finished.map(async (b) => {
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
      <div className="home-hero">
        <div className="home-hero-content">
          <img src={appIcon} alt="" className="home-header-icon" />
          <div className="home-header-text">
            <h1 className="home-header-title">Mi estantería</h1>
            <p className="home-header-subtitle">
            by{' '}
            <button className="home-header-link" onClick={() => window.electron.openExternal('https://github.com/Canborda/PersonalMediaTracker')}>
              Canborda
            </button>
            {' '}and Claude Code{' '}
            <span className="home-header-claude-icon">
              <img src={claudeCodeIcon} alt="Claude Code" width="14" height="14" />
            </span>
            </p>
          </div>
        </div>
      </div>

      <div className="home-body">
        <div className="home-kpis">
          <p className="home-friendly-label">Lo que llevo recorrido</p>
          <KpiCard label="Libros terminados" value={stats.finishedCount} tooltip="Libros con al menos una lectura marcada como terminada" />
          <KpiCard label="Autores leídos" value={stats.uniqueAuthors} tooltip="Autores únicos con al menos un libro terminado" />
          <KpiCard label="Páginas leídas" value={fmt(stats.totalPages)} tooltip="Total de páginas × lecturas terminadas por libro" />
          <KpiCard label="Días / libro" value={stats.avgDays || '—'} tooltip="Promedio de días entre inicio y fin por lectura terminada" />
          <KpiCard label="~Palabras leídas" value={fmtWords(stats.totalWords)} tooltip="Estimado: páginas × líneas por página × 9 palabras por línea" />
          <KpiCard label="~WPD prom." value={stats.avgWPD ? fmtWords(stats.avgWPD) : '—'} tooltip="Promedio de palabras por día estimadas por lectura terminada" />
        </div>

        <div className="home-right">
          <div className="home-section home-section-auto home-section-ghost">
            <p className="home-friendly-label">Así han ido mis últimos 6 meses</p>
            <HomeTimeline books={books} />
          </div>
          <div className="home-section home-section-auto home-section-ghost">
            <p className="home-friendly-label">Mi ritmo día a día</p>
            <HomePaceMap books={books} />
          </div>
          <div className="home-right-lower">
            <div className="home-right-charts">
              <div
                className="home-section home-section-ghost home-carousel"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
              >
                <p className="home-friendly-label">Volviendo a mis libros</p>
                {n === 0 ? (
                  <div className="carousel-empty">
                    Termina algún libro para verlo aquí
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
                            <span className="carousel-bullet">·</span>
                            <span className="carousel-year">{current.year}</span>
                          </div>
                          {current.meta.description && (
                            <>
                              <div className="carousel-divider" />
                              <p className="carousel-description">{current.meta.description}</p>
                            </>
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
            </div>
            <div className="home-podium">
              <p className="home-friendly-label">Lo mejor que he leído</p>
              <HomePodium books={books} onSelectBook={onSelectBook} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

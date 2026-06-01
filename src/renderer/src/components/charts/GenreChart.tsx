import React, { useMemo, useState } from 'react'
import type { Book } from '../../../../shared/types'
import { GENRE_LABEL } from '../../../../shared/types/book-genre'
import type { BookGenre } from '../../../../shared/types/book-genre'

interface GenreStat {
  genre: BookGenre | string
  label: string
  count: number
}

const GENRE_COLORS = [
  '#3b82f6', '#8b5cf6', '#0ea5e9', '#ec4899',
  '#f59e0b', '#10b981', '#ef4444', '#6366f1',
]

export default function GenreChart({ books }: { books: Book[] }): React.JSX.Element {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)

  const { slices, total } = useMemo(() => {
    const map = new Map<BookGenre, number>()
    let total = 0
    for (const book of books) {
      if (!book.readings.some((r) => r.completed === true)) continue
      const genre = book.additionalData.genre
      if (!genre) continue
      map.set(genre, (map.get(genre) ?? 0) + 1)
      total++
    }
    const sorted: GenreStat[] = Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([genre, count]) => ({ genre, label: GENRE_LABEL[genre], count }))
    if (sorted.length > 7) {
      const rest = sorted.splice(7)
      sorted.push({ genre: 'other-combined', label: 'Otros', count: rest.reduce((s, x) => s + x.count, 0) })
    }
    return { slices: sorted, total }
  }, [books])

  if (slices.length === 0 || total === 0) {
    return <p className="stats-empty">Sin datos suficientes.</p>
  }

  const cx = 65, cy = 65, R = 57, r = 33, gap = 0.025
  const cos = Math.cos, sin = Math.sin

  const arcs: { d: string; color: string; i: number }[] = []
  let angle = -Math.PI / 2
  for (let i = 0; i < slices.length; i++) {
    const span = (slices[i].count / total) * 2 * Math.PI
    const s = angle + gap / 2
    const e = angle + span - gap / 2
    const la = e - s > Math.PI ? 1 : 0
    arcs.push({
      d: `M${cx + R * cos(s)} ${cy + R * sin(s)} A${R} ${R} 0 ${la} 1 ${cx + R * cos(e)} ${cy + R * sin(e)} L${cx + r * cos(e)} ${cy + r * sin(e)} A${r} ${r} 0 ${la} 0 ${cx + r * cos(s)} ${cy + r * sin(s)}Z`,
      color: GENRE_COLORS[i % GENRE_COLORS.length],
      i,
    })
    angle += span
  }

  const ha = hoveredIdx !== null ? slices[hoveredIdx] : null

  return (
    <div className="genre-chart">
      <svg
        width={130}
        height={130}
        viewBox="0 0 130 130"
        onMouseLeave={() => { setHoveredIdx(null); setTooltipPos(null) }}
      >
        {arcs.map((a) => (
          <path
            key={a.i}
            d={a.d}
            fill={a.color}
            opacity={hoveredIdx === null || hoveredIdx === a.i ? 0.85 : 0.3}
            style={{ cursor: 'default', transition: 'opacity 0.15s' }}
            onMouseEnter={(e) => { setHoveredIdx(a.i); setTooltipPos({ x: e.clientX, y: e.clientY }) }}
            onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
          />
        ))}
        {ha ? (
          <>
            <text x={cx} y={cx - 5} textAnchor="middle" fill="white" fontSize="16" fontWeight="700">{ha.count}</text>
            <text x={cx} y={cx + 11} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="11">{Math.round((ha.count / total) * 100)}%</text>
          </>
        ) : (
          <text x={cx} y={cx + 5} textAnchor="middle" fill="rgba(255,255,255,0.22)" fontSize="13">{total}</text>
        )}
      </svg>

      <div className="genre-legend">
        {slices.map((s, i) => (
          <div
            key={s.genre}
            className={`genre-legend-row${hoveredIdx === i ? ' hovered' : ''}`}
            onMouseEnter={(e) => { setHoveredIdx(i); setTooltipPos({ x: e.clientX, y: e.clientY }) }}
            onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
            onMouseLeave={() => { setHoveredIdx(null); setTooltipPos(null) }}
          >
            <span className="genre-legend-dot" style={{ background: GENRE_COLORS[i % GENRE_COLORS.length] }} />
            <span className="genre-legend-name">{s.label}</span>
            <span className="genre-legend-count">{s.count}</span>
          </div>
        ))}
      </div>

      {ha && tooltipPos && (
        <div
          className="stats-tooltip"
          style={{
            left: tooltipPos.x + 14 + 200 > window.innerWidth ? tooltipPos.x - 14 - 200 : tooltipPos.x + 14,
            top: tooltipPos.y - 40,
          }}
        >
          <div className="stats-tooltip-title">{ha.label}</div>
          <div className="stats-tooltip-row">
            <span>{ha.count} {ha.count === 1 ? 'libro' : 'libros'}</span>
            <span className="stats-tooltip-muted">{Math.round((ha.count / total) * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

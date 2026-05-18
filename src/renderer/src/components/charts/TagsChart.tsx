import React, { useMemo, useState } from 'react'
import type { Book } from '../../../../shared/types'

interface TagStat {
  tag: string
  count: number
}

export default function TagsChart({ books }: { books: Book[] }): React.JSX.Element {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)

  const rows = useMemo((): TagStat[] => {
    const map = new Map<string, number>()
    for (const book of books) {
      if (!book.readings.some((r) => r.completed === true)) continue
      for (const tag of book.tags ?? []) {
        map.set(tag, (map.get(tag) ?? 0) + 1)
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }))
  }, [books])

  if (rows.length === 0) {
    return <p className="stats-empty">Sin datos suficientes.</p>
  }

  const maxCount = rows[0].count
  const ha = hoveredIdx !== null ? rows[hoveredIdx] : null

  return (
    <div className="authors-chart">
      <div className="authors-rows">
        {rows.map((row, i) => (
          <div
            key={row.tag}
            className={`authors-row${hoveredIdx === i ? ' hovered' : ''}`}
            onMouseEnter={(e) => { setHoveredIdx(i); setTooltipPos({ x: e.clientX, y: e.clientY }) }}
            onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
            onMouseLeave={() => { setHoveredIdx(null); setTooltipPos(null) }}
          >
            <span className="authors-label">{row.tag}</span>
            <div className="authors-bar-track">
              <div className="authors-bar-fill" style={{ width: `${(row.count / maxCount) * 100}%` }} />
            </div>
            <span className="authors-count">{row.count}</span>
          </div>
        ))}
      </div>

      {ha && tooltipPos && (
        <div
          className="stats-tooltip"
          style={{
            left: tooltipPos.x + 14 + 240 > window.innerWidth ? tooltipPos.x - 14 - 240 : tooltipPos.x + 14,
            top: tooltipPos.y - 40,
          }}
        >
          <div className="stats-tooltip-title">{ha.tag}</div>
          <div className="stats-tooltip-row">
            <span>{ha.count} {ha.count === 1 ? 'libro' : 'libros'}</span>
          </div>
        </div>
      )}
    </div>
  )
}

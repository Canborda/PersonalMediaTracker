import React, { useMemo, useState } from 'react'
import type { Book } from '../../../../shared/types'
import { fmtWords, WORDS_PER_LINE } from '../../utils'

interface BookStat {
  title: string
  author: string
  words: number
  pages: number
}

export default function LongestBooksChart({ books }: { books: Book[] }): React.JSX.Element {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)

  const rows = useMemo((): BookStat[] => {
    return books
      .filter((b) => b.readings.some((r) => r.completed === true) && (b.additionalData.pages ?? 0) > 0)
      .map((b) => {
        const pages = b.additionalData.pages!
        const words = pages * (b.additionalData.linesPerPage ?? 30) * WORDS_PER_LINE
        return { title: b.title, author: b.author, words, pages }
      })
      .sort((a, b) => b.words - a.words)
      .slice(0, 10)
  }, [books])

  if (rows.length === 0) {
    return <p className="stats-empty">Sin datos suficientes.</p>
  }

  const maxWords = rows[0].words
  const ha = hoveredIdx !== null ? rows[hoveredIdx] : null

  return (
    <div className="authors-chart">
      <div className="authors-rows">
        {rows.map((row, i) => (
          <div
            key={`${row.title}-${i}`}
            className={`authors-row${hoveredIdx === i ? ' hovered' : ''}`}
            onMouseEnter={(e) => { setHoveredIdx(i); setTooltipPos({ x: e.clientX, y: e.clientY }) }}
            onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
            onMouseLeave={() => { setHoveredIdx(null); setTooltipPos(null) }}
          >
            <span className="authors-label">{row.title}</span>
            <div className="authors-bar-track">
              <div
                className="authors-bar-fill"
                style={{ width: `${(row.words / maxWords) * 100}%` }}
              />
            </div>
            <span className="authors-count" style={{ width: 44 }}>~{fmtWords(row.words)}</span>
          </div>
        ))}
      </div>

      {ha && tooltipPos && (
        <div
          className="stats-tooltip"
          style={{
            left: tooltipPos.x + 14 + 240 > window.innerWidth ? tooltipPos.x - 14 - 240 : tooltipPos.x + 14,
            top: tooltipPos.y - 56,
          }}
        >
          <div className="stats-tooltip-title">{ha.title}</div>
          <div className="stats-tooltip-row">
            <span className="stats-tooltip-muted">{ha.author}</span>
          </div>
          <div className="stats-tooltip-row">
            <span>~{fmtWords(ha.words)} palabras</span>
            <span className="stats-tooltip-muted">{ha.pages.toLocaleString('es-CO')} pág.</span>
          </div>
        </div>
      )}
    </div>
  )
}
